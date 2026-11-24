# Language: Python | Target: Country-Wise Payment Methods & Admin Instructions Model
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.database import Base


class PaymentMethodConfig(Base):
    __tablename__ = "payment_method_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # যেমন: bKash, Nagad, Bank Transfer, Payoneer, PayPal, Crypto
    country_scope = Column(String(100), default="ALL", nullable=False)  # যেমন: Bangladesh, India, Pakistan, ALL
    account_details = Column(Text, nullable=False)  # নম্বর, IBAN, ইমেইল বা ওয়ালেট অ্যাড্রেস
    instructions = Column(Text, nullable=False)  # পেমেন্ট করার বিস্তারিত নির্দেশনা
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
