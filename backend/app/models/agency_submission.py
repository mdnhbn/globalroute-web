# Language: Python | Target: Agency License & Verification Documents Model
import enum
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text

from app.database import Base


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AgencySubmission(Base):
    __tablename__ = "agency_submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    agency_name = Column(String(200), nullable=False)
    registration_country = Column(String(100), nullable=False)
    license_number = Column(String(150), nullable=False)
    office_address = Column(Text, nullable=False)

    # ডকুমেন্টের রেফারেন্স/পাথ বা ফাইল তথ্য (লোকাল/ক্লাউড রেফারেন্স অনুযায়ী)
    trade_license_doc = Column(String(500), nullable=False)
    recruiting_license_doc = Column(String(500), nullable=True)
    owner_id_doc = Column(String(500), nullable=False)

    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING, nullable=False)
    admin_note = Column(Text, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
