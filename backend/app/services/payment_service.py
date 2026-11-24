from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.payment_config import PaymentMethodConfig


def get_payment_method_name(db: Session, method_id: int | None, supplied_name: str) -> str:
    if method_id is None:
        return supplied_name.strip()

    method = db.get(PaymentMethodConfig, method_id)
    if method is None or not method.is_active:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Select an active payment method",
        )
    return method.name
