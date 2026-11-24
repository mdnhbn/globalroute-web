# Language: Python | Target: Country Payment Methods, Manual Payment Proof & Ad Script Routes
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ad_script import AdScript
from app.models.manual_payment import ManualPayment, PaymentVerificationStatus
from app.models.payment_config import PaymentMethodConfig
from app.models.user import User
from app.schemas import (
    AdScriptResponse,
    ManualPaymentResponse,
    ManualPaymentSubmitRequest,
    PaymentMethodResponse,
)

router = APIRouter(tags=["Payments & Third-Party Ads"])


@router.get("/payments/methods", response_model=list[PaymentMethodResponse])
def get_payment_methods(country: str = Query(default=""), db: Session = Depends(get_db)):
    methods = db.query(PaymentMethodConfig).filter(PaymentMethodConfig.is_active.is_(True)).all()
    country_clean = country.strip().lower()
    if not country_clean:
        return methods

    matched: list[PaymentMethodConfig] = []
    for m in methods:
        scope_clean = m.country_scope.strip().lower()
        if scope_clean in ("all", "global") or country_clean in scope_clean or scope_clean in country_clean:
            matched.append(m)
    return matched if matched else methods


@router.post("/payments/manual-submit", response_model=ManualPaymentResponse, status_code=status.HTTP_201_CREATED)
def submit_manual_payment(user_id: int, payload: ManualPaymentSubmitRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    record = ManualPayment(
        user_id=user.id,
        payment_method_id=payload.payment_method_id,
        method_name=payload.method_name.strip(),
        amount=float(payload.amount),
        currency=payload.currency.strip().upper(),
        transaction_reference=payload.transaction_reference.strip(),
        proof_reference=payload.proof_reference.strip() if payload.proof_reference else None,
        status=PaymentVerificationStatus.PENDING,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/ads/slots", response_model=list[AdScriptResponse])
def get_active_ad_slots(audience: str = Query(default="individual_and_public"), db: Session = Depends(get_db)):
    if audience.strip().lower() == "agency":
        return []
    return (
        db.query(AdScript)
        .filter(AdScript.is_active.is_(True), AdScript.target_audience != "agency_only")
        .all()
    )
