# Language: Python | Target: Authentication & Individual/Agency Registration Routes
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token as google_id_token
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies import get_current_user
from app.models.agency_submission import AgencySubmission, VerificationStatus
from app.models.email_verification import EmailVerificationChallenge
from app.models.manual_payment import ManualPayment, PaymentVerificationStatus
from app.models.user import AccountStatus, User, UserRole
from app.schemas import (
    EmailVerificationRequest,
    RegistrationResponse,
    ResendVerificationRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.security import create_access_token, hash_password, verify_password
from app.services.email_service import send_verification_code
from app.services.payment_service import get_payment_method_name

router = APIRouter(prefix="/auth", tags=["Authentication"])
SUPPORTED_LOCALES = {"en", "bn", "ur", "hi", "ar", "tr", "ms"}
VERIFICATION_CODE_TTL = timedelta(minutes=10)
VERIFICATION_RESEND_COOLDOWN = timedelta(seconds=60)
VERIFICATION_MAX_ATTEMPTS = 5
GOOGLE_STATE_COOKIE = "globalroute_google_state"


def _normalize_locale(value: str | None) -> str:
    locale = (value or "bn").strip().lower()
    return locale if locale in SUPPORTED_LOCALES else "bn"


def _code_hash(email: str, code: str) -> str:
    payload = f"{email.lower().strip()}:{code}".encode("utf-8")
    return hmac.new(settings.SECRET_KEY.encode("utf-8"), payload, hashlib.sha256).hexdigest()


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value.astimezone(timezone.utc)


def _issue_verification_challenge(db: Session, user: User) -> None:
    code = f"{secrets.randbelow(1_000_000):06d}"
    now = datetime.now(timezone.utc)
    challenge = db.get(EmailVerificationChallenge, user.id)
    if challenge is None:
        challenge = EmailVerificationChallenge(user_id=user.id, code_hash=_code_hash(user.email, code))
        db.add(challenge)
    else:
        challenge.code_hash = _code_hash(user.email, code)
        challenge.attempts = 0
    challenge.expires_at = now + VERIFICATION_CODE_TTL
    challenge.sent_at = now
    send_verification_code(user.email, user.full_name, code)


@router.post("/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    if not settings.email_verification_configured:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Email verification is not configured")

    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    if payload.account_type == UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot self-register as admin")

    is_agency = payload.account_type == UserRole.AGENCY

    method_name = None
    if is_agency:
        missing_fields = [
            name
            for name, val in [
                ("agency_name", payload.agency_name),
                ("registration_country", payload.registration_country),
                ("license_number", payload.license_number),
                ("office_address", payload.office_address),
                ("trade_license_doc", payload.trade_license_doc),
                ("owner_id_doc", payload.owner_id_doc),
                ("method_name", payload.method_name),
                ("amount", payload.amount),
                ("transaction_reference", payload.transaction_reference),
            ]
            if not val or (isinstance(val, str) and not val.strip())
        ]
        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Agency registration requires documents and manual payment proof: {', '.join(missing_fields)}",
            )

        method_name = get_payment_method_name(db, payload.payment_method_id, payload.method_name)

    new_user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        whatsapp_number=payload.whatsapp_number.strip(),
        country=payload.country.strip(),
        preferred_language=_normalize_locale(payload.preferred_language),
        hashed_password=hash_password(payload.password),
        role=UserRole.AGENCY if is_agency else UserRole.INDIVIDUAL,
        status=AccountStatus.PENDING_VERIFICATION if is_agency else AccountStatus.ACTIVE,
        is_active=True,
    )
    db.add(new_user)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        if db.query(User).filter(User.email == new_user.email).first() is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        raise

    if is_agency:
        submission = AgencySubmission(
            user_id=new_user.id,
            agency_name=payload.agency_name.strip(),
            registration_country=payload.registration_country.strip(),
            license_number=payload.license_number.strip(),
            office_address=payload.office_address.strip(),
            trade_license_doc=payload.trade_license_doc.strip(),
            recruiting_license_doc=payload.recruiting_license_doc.strip() if payload.recruiting_license_doc else None,
            owner_id_doc=payload.owner_id_doc.strip(),
            verification_status=VerificationStatus.PENDING,
        )
        db.add(submission)

        payment_record = ManualPayment(
            user_id=new_user.id,
            payment_method_id=payload.payment_method_id,
            method_name=method_name,
            amount=float(payload.amount),
            currency=(payload.currency or "USD").strip().upper(),
            transaction_reference=payload.transaction_reference.strip(),
            proof_reference=payload.proof_reference.strip() if payload.proof_reference else None,
            status=PaymentVerificationStatus.PENDING,
        )
        db.add(payment_record)

    try:
        _issue_verification_challenge(db, new_user)
        db.commit()
    except Exception as exc:
        db.rollback()
        if isinstance(exc, HTTPException):
            raise
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not send the verification email. Try again later.",
        ) from exc

    return RegistrationResponse(email=new_user.email)


@router.post("/verify-email")
def verify_email(payload: EmailVerificationRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    challenge = db.get(EmailVerificationChallenge, user.id) if user else None
    if challenge is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code is invalid or expired")

    now = datetime.now(timezone.utc)
    if _as_utc(challenge.expires_at) <= now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code is invalid or expired")
    if challenge.attempts >= VERIFICATION_MAX_ATTEMPTS:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many attempts. Request a new code.")

    expected_hash = _code_hash(email, payload.code)
    if not hmac.compare_digest(challenge.code_hash, expected_hash):
        challenge.attempts += 1
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code is invalid or expired")

    db.delete(challenge)
    db.commit()
    return {"verified": True}


@router.post("/resend-verification")
def resend_verification(payload: ResendVerificationRequest, db: Session = Depends(get_db)):
    if not settings.email_verification_configured:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Email verification is not configured")

    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    challenge = db.get(EmailVerificationChallenge, user.id) if user else None
    if user is None or challenge is None:
        return {"message": "If email verification is pending, a new code will be sent."}

    now = datetime.now(timezone.utc)
    if _as_utc(challenge.sent_at) + VERIFICATION_RESEND_COOLDOWN > now:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Please wait before requesting another code")

    try:
        _issue_verification_challenge(db, user)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Could not send the verification email") from exc

    return {"message": "If email verification is pending, a new code will be sent."}


def _google_error_redirect(error: str, locale: str) -> RedirectResponse:
    response = RedirectResponse(
        f"{settings.primary_frontend_url}/login#oauth_error={error}&locale={_normalize_locale(locale)}",
        status_code=status.HTTP_302_FOUND,
    )
    response.delete_cookie(GOOGLE_STATE_COOKIE, path="/api/v1/auth/google/callback")
    return response


@router.get("/google")
def start_google_login(locale: str = "bn"):
    normalized_locale = _normalize_locale(locale)
    if not settings.google_oauth_configured:
        return _google_error_redirect("google_unavailable", normalized_locale)

    state = secrets.token_urlsafe(32)
    nonce = secrets.token_urlsafe(32)
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "nonce": nonce,
        "prompt": "select_account",
    }
    response = RedirectResponse(
        f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}",
        status_code=status.HTTP_302_FOUND,
    )
    response.set_cookie(
        GOOGLE_STATE_COOKIE,
        f"{state}:{nonce}:{normalized_locale}",
        max_age=600,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        path="/api/v1/auth/google/callback",
    )
    return response


@router.get("/google/callback")
def finish_google_login(
    request: Request,
    db: Session = Depends(get_db),
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):
    cookie_value = request.cookies.get(GOOGLE_STATE_COOKIE, "")
    parts = cookie_value.split(":", 2)
    expected_state, expected_nonce, locale = (parts + ["", "", "bn"])[:3]
    locale = _normalize_locale(locale)
    if error:
        return _google_error_redirect("google_cancelled", locale)
    if not code or not state or not expected_state or not hmac.compare_digest(state, expected_state):
        return _google_error_redirect("google_state_error", locale)

    try:
        token_response = httpx.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            timeout=15,
        )
        token_response.raise_for_status()
        id_token_value = token_response.json().get("id_token")
        if not id_token_value:
            raise ValueError("Missing ID token")
        claims = google_id_token.verify_oauth2_token(
            id_token_value,
            GoogleRequest(),
            audience=settings.GOOGLE_CLIENT_ID,
        )
        if claims.get("nonce") != expected_nonce:
            raise ValueError("Invalid nonce")
        if claims.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
            raise ValueError("Invalid issuer")
        if claims.get("email_verified") is not True:
            raise ValueError("Google account email is not verified")
        email = str(claims.get("email", "")).strip().lower()
        if not email or not claims.get("sub"):
            raise ValueError("Google account email is missing")
    except Exception:
        return _google_error_redirect("google_auth_failed", locale)

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        display_name = str(claims.get("name") or email.split("@", 1)[0]).strip()
        if len(display_name) < 2:
            display_name = "Google User"
        user = User(
            full_name=display_name[:150],
            email=email,
            whatsapp_number="",
            country="",
            preferred_language=locale,
            hashed_password=hash_password(secrets.token_urlsafe(48)),
            role=UserRole.INDIVIDUAL,
            status=AccountStatus.ACTIVE,
            is_active=True,
        )
        db.add(user)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active or user.status == AccountStatus.SUSPENDED:
        return _google_error_redirect("google_account_unavailable", locale)

    pending_challenge = db.get(EmailVerificationChallenge, user.id)
    if pending_challenge is not None:
        db.delete(pending_challenge)
    db.commit()

    token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value, "status": user.status.value}
    )
    callback_url = f"{settings.primary_frontend_url}/auth/callback#access_token={token}&locale={locale}"
    response = RedirectResponse(callback_url, status_code=status.HTTP_302_FOUND)
    response.delete_cookie(GOOGLE_STATE_COOKIE, path="/api/v1/auth/google/callback")
    return response


@router.get("/me", response_model=UserResponse)
def read_current_user(user: Annotated[User, Depends(get_current_user)]):
    return user


@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active or user.status == AccountStatus.SUSPENDED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is suspended or inactive")

    if db.get(EmailVerificationChallenge, user.id) is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email verification required")

    token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role.value,
            "status": user.status.value,
        }
    )
    return TokenResponse(
        access_token=token,
        role=user.role,
        status=user.status,
        preferred_language=user.preferred_language,
    )
