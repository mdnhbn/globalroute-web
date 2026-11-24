# Language: Python | Target: Authentication & Individual/Agency Registration Routes
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.agency_submission import AgencySubmission, VerificationStatus
from app.models.manual_payment import ManualPayment, PaymentVerificationStatus
from app.models.user import AccountStatus, User, UserRole
from app.schemas import TokenResponse, UserLoginRequest, UserRegisterRequest, UserResponse
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    if payload.account_type == UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot self-register as admin")

    is_agency = payload.account_type == UserRole.AGENCY

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
            if not val
        ]
        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Agency registration requires documents and manual payment proof: {', '.join(missing_fields)}",
            )

    new_user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        whatsapp_number=payload.whatsapp_number.strip(),
        country=payload.country.strip(),
        preferred_language=payload.preferred_language.strip().lower(),
        hashed_password=hash_password(payload.password),
        role=UserRole.AGENCY if is_agency else UserRole.INDIVIDUAL,
        status=AccountStatus.PENDING_VERIFICATION if is_agency else AccountStatus.ACTIVE,
        is_active=True,
    )
    db.add(new_user)
    db.flush()  # new_user.id পেতে

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
            method_name=payload.method_name.strip(),
            amount=float(payload.amount),
            currency=(payload.currency or "USD").strip().upper(),
            transaction_reference=payload.transaction_reference.strip(),
            proof_reference=payload.proof_reference.strip() if payload.proof_reference else None,
            status=PaymentVerificationStatus.PENDING,
        )
        db.add(payment_record)

    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active or user.status == AccountStatus.SUSPENDED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is suspended or inactive")

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
