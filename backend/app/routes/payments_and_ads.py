from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.manual_payment import ManualPayment, PaymentVerificationStatus
from app.models.payment_config import PaymentMethodConfig
from app.models.user import AccountStatus, User, UserRole
from app.schemas import ManualPaymentResponse, ManualPaymentSubmitRequest, PaymentMethodResponse
from app.services.payment_service import get_payment_method_name


router = APIRouter(tags=["Payments & Third-Party Ads"])


@router.get("/payments/methods", response_model=list[PaymentMethodResponse])
def get_payment_methods(country: str = Query(default=""), db: Session = Depends(get_db)):
    methods = db.query(PaymentMethodConfig).filter(PaymentMethodConfig.is_active.is_(True)).all()
    country_clean = country.strip().lower()
    if not country_clean:
        return methods

    matched: list[PaymentMethodConfig] = []
    for method in methods:
        scope_clean = method.country_scope.strip().lower()
        if scope_clean in ("all", "global") or country_clean in scope_clean or scope_clean in country_clean:
            matched.append(method)
    return matched if matched else methods


@router.post("/payments/manual-submit", response_model=ManualPaymentResponse, status_code=status.HTTP_201_CREATED)
def submit_manual_payment(
    payload: ManualPaymentSubmitRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    user_id: Annotated[int | None, Query(gt=0)] = None,
):
    if user_id is not None and user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Submit payments for your own account")
    if user.status != AccountStatus.ACTIVE and not (
        user.role == UserRole.AGENCY and user.status == AccountStatus.PENDING_VERIFICATION
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account cannot submit a payment")

    record = ManualPayment(
        user_id=user.id,
        payment_method_id=payload.payment_method_id,
        method_name=get_payment_method_name(db, payload.payment_method_id, payload.method_name),
        amount=payload.amount,
        currency=payload.currency.strip().upper(),
        transaction_reference=payload.transaction_reference.strip(),
        proof_reference=payload.proof_reference.strip() if payload.proof_reference else None,
        status=PaymentVerificationStatus.PENDING,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/ads/slots", deprecated=True)
def get_active_ad_slots() -> list:
    return []
