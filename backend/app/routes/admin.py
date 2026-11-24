from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models.agency_submission import AgencySubmission, VerificationStatus
from app.models.manual_payment import ManualPayment, PaymentVerificationStatus
from app.models.payment_config import PaymentMethodConfig
from app.models.user import AccountStatus, User, UserRole
from app.schemas import (
    AdminAgencyDecisionRequest,
    AgencySubmissionResponse,
    ManualPaymentResponse,
    PaymentMethodCreateRequest,
    PaymentMethodResponse,
)
from app.services.whatsapp_service import send_whatsapp_message


router = APIRouter(prefix="/admin", tags=["Super Admin"], dependencies=[Depends(require_admin)])


@router.get("/agencies/pending", response_model=list[AgencySubmissionResponse])
def list_pending_agencies(db: Session = Depends(get_db)):
    return (
        db.query(AgencySubmission)
        .filter(AgencySubmission.verification_status == VerificationStatus.PENDING)
        .all()
    )


@router.get("/payments/pending", response_model=list[ManualPaymentResponse])
def list_pending_payments(db: Session = Depends(get_db)):
    return (
        db.query(ManualPayment)
        .filter(ManualPayment.status == PaymentVerificationStatus.PENDING)
        .all()
    )


@router.post("/agencies/{user_id}/decide")
async def decide_agency_verification(
    user_id: int,
    payload: AdminAgencyDecisionRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.AGENCY).with_for_update().first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agency user not found")

    submission = db.query(AgencySubmission).filter(AgencySubmission.user_id == user_id).first()
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agency submission not found")
    if (
        not user.is_active
        or user.status != AccountStatus.PENDING_VERIFICATION
        or submission.verification_status != VerificationStatus.PENDING
    ):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Agency submission is no longer pending")

    payment = (
        db.query(ManualPayment)
        .filter(ManualPayment.user_id == user_id, ManualPayment.status == PaymentVerificationStatus.PENDING)
        .order_by(ManualPayment.created_at.desc(), ManualPayment.id.desc())
        .first()
    )

    now = datetime.now(timezone.utc)
    approved = payload.decision == "approve"
    user.status = AccountStatus.ACTIVE if approved else AccountStatus.REJECTED
    submission.verification_status = VerificationStatus.APPROVED if approved else VerificationStatus.REJECTED
    submission.admin_note = payload.note
    submission.verified_at = now
    if payment:
        payment.status = PaymentVerificationStatus.VERIFIED if approved else PaymentVerificationStatus.REJECTED
        payment.admin_remark = payload.note
        payment.verified_at = now

    if approved:
        message = "GlobalRoute: আপনার এজেন্সি অ্যাকাউন্ট অনুমোদিত (Approved) হয়েছে। এখন লগইন করে ব্যবহার করতে পারবেন।"
    else:
        reason = f" কারণ: {payload.note}" if payload.note else ""
        message = f"GlobalRoute: আপনার এজেন্সি আবেদনটি অনুমোদিত হয়নি।{reason}"

    whatsapp_number = user.whatsapp_number
    account_status = user.status.value
    db.commit()
    notification = await send_whatsapp_message(whatsapp_number, message)
    return {
        "user_id": user_id,
        "account_status": account_status,
        "whatsapp_notification": notification,
    }


@router.post("/payment-methods", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
def create_payment_method(payload: PaymentMethodCreateRequest, db: Session = Depends(get_db)):
    item = PaymentMethodConfig(
        name=payload.name.strip(),
        country_scope=payload.country_scope.strip(),
        account_details=payload.account_details.strip(),
        instructions=payload.instructions.strip(),
        is_active=payload.is_active,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post("/ad-scripts", deprecated=True)
def create_ad_script():
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Custom ad scripts have been disabled")
