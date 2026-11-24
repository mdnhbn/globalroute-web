# Language: Python | Target: Manual Payment Proof & Verification Model
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text

from app.database import Base


class PaymentVerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class ManualPayment(Base):
    __tablename__ = "manual_payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    payment_method_id = Column(Integer, ForeignKey("payment_method_configs.id", ondelete="SET NULL"), nullable=True)

    method_name = Column(String(100), nullable=False)  # যেমন: bKash, Nagad, Bank, Card, Payoneer, PayPal, Crypto
    amount = Column(Float, nullable=False)
    currency = Column(String(20), default="USD", nullable=False)
    transaction_reference = Column(String(255), nullable=False)  # TrxID বা TxHash বা রেফারেন্স নম্বর
    proof_reference = Column(String(500), nullable=True)  # স্ক্রিনশট/প্রুফ ফাইলের রেফারেন্স বা নোট

    status = Column(Enum(PaymentVerificationStatus), default=PaymentVerificationStatus.PENDING, nullable=False)
    admin_remark = Column(Text, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
