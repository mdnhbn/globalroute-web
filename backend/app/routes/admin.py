# Language: Python | Target: Super Admin Verification, Payment Config & Ad Script Routes
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ad_script import AdScript
from app.models.agency_submission import AgencySubmission, VerificationStatus
from app.models.manual_payment import ManualPayment, PaymentVerificationStatus
from app.models.payment_config import PaymentMethodConfig
from app.models.user import AccountStatus, User
from app.schemas import (
    AdScriptCreateRequest,
    AdScriptResponse,
    AdminAgencyDecisionRequest,
    AgencySubmissionResponse,
    ManualPaymentResponse,
    PaymentMethodCreateRequest,
    PaymentMethodResponse,
)
from app.services.whatsapp_service import send_whatsapp_message

router = APIRouter(prefix="/admin", tags=["Super Admin"])


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
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agency user not found")

    submission = db.query(AgencySubmission).filter(AgencySubmission.user_id == user_id).first()
    payment = (
        db.query(ManualPayment)
        .filter(ManualPayment.user_id == user_id)
        .order_by(ManualPayment.created_at.desc())
        .first()
    )

    now = datetime.now(timezone.utc)
    if payload.decision == "approve":
        user.status = AccountStatus.ACTIVE
        if submission:
            submission.verification_status = VerificationStatus.APPROVED
            submission.admin_note = payload.note
            submission.verified_at = now
        if payment:
            payment.status = PaymentVerificationStatus.VERIFIED
            payment.admin_remark = payload.note
            payment.verified_at = now
        msg = f"GlobalRoute: আপনার এজেন্সি অ্যাকাউন্ট অনুমোদিত (Approved) হয়েছে। এখন লগইন করে ব্যবহার করতে পারবেন।"
    else:
        user.status = AccountStatus.REJECTED
        if submission:
            submission.verification_status = VerificationStatus.REJECTED
            submission.admin_note = payload.note
            submission.verified_at = now
        if payment:
            payment.status = PaymentVerificationStatus.REJECTED
            payment.admin_remark = payload.note
            payment.verified_at = now
        reason_part = f" কারণ: {payload.note}" if payload.note else ""
        msg = f"GlobalRoute: আপনার এজেন্সি আবেদনটি অনুমোদিত হয়নি।{reason_part}"

    db.commit()
    wa_result = await send_whatsapp_message(user.whatsapp_number, msg)
    return {
        "user_id": user.id,
        "account_status": user.status.value,
        "whatsapp_notification": wa_result,
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


@router.post("/ad-scripts", response_model=AdScriptResponse, status_code=status.HTTP_201_CREATED)
def create_ad_script(payload: AdScriptCreateRequest, db: Session = Depends(get_db)):
    script = AdScript(
        slot_name=payload.slot_name.strip(),
        provider_label=payload.provider_label.strip(),
        script_code=payload.script_code,
        target_audience=payload.target_audience.strip(),
        is_active=payload.is_active,
    )
    db.add(script)
    db.commit()
    db.refresh(script)
    return script
