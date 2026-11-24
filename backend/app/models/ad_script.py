# Language: Python | Target: Admin Third-Party Ad Script Model
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text

from app.database import Base


class AdScript(Base):
    __tablename__ = "ad_scripts"

    id = Column(Integer, primary_key=True, index=True)
    slot_name = Column(String(100), nullable=False)  # যেমন: header_banner, sidebar, job_list_inline, footer
    provider_label = Column(String(120), nullable=False)  # যেমন: Adsterra, Ad Manager, Custom Script
    script_code = Column(Text, nullable=False)  # Admin থেকে দেওয়া HTML/JS কোড
    target_audience = Column(String(50), default="individual_and_public", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
