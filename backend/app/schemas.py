# Language: Python | Target: Pydantic Request & Response Schemas
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.agency_submission import VerificationStatus
from app.models.manual_payment import PaymentVerificationStatus
from app.models.user import AccountStatus, UserRole


class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: EmailStr
    whatsapp_number: str = Field(..., min_length=6, max_length=30)
    country: str = Field(..., min_length=2, max_length=80)
    preferred_language: str = Field(default="en", min_length=2, max_length=10)
    password: str = Field(..., min_length=6, max_length=128)
    account_type: UserRole = Field(default=UserRole.INDIVIDUAL)

    # Agency রেজিস্ট্রেশনের সময় প্রয়োজনীয় তথ্য
    agency_name: Optional[str] = Field(default=None, max_length=200)
    registration_country: Optional[str] = Field(default=None, max_length=100)
    license_number: Optional[str] = Field(default=None, max_length=150)
    office_address: Optional[str] = None
    trade_license_doc: Optional[str] = Field(default=None, max_length=500)
    recruiting_license_doc: Optional[str] = Field(default=None, max_length=500)
    owner_id_doc: Optional[str] = Field(default=None, max_length=500)

    # Agency রেজিস্ট্রেশনের সাথে Manual Payment প্রুফ
    payment_method_id: Optional[int] = Field(default=None, gt=0, le=2_147_483_647)
    method_name: Optional[str] = Field(default=None, max_length=100)
    amount: Optional[float] = Field(default=None, gt=0, allow_inf_nan=False)
    currency: Optional[str] = Field(default="USD", max_length=20)
    transaction_reference: Optional[str] = Field(default=None, max_length=255)
    proof_reference: Optional[str] = Field(default=None, max_length=500)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class EmailVerificationRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., pattern=r"^\d{6}$")


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class RegistrationResponse(BaseModel):
    email: EmailStr
    verification_required: bool = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    status: AccountStatus
    preferred_language: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    email: str
    whatsapp_number: str
    country: str
    preferred_language: str
    role: UserRole
    status: AccountStatus
    is_active: bool
    created_at: datetime


class ManualPaymentSubmitRequest(BaseModel):
    payment_method_id: Optional[int] = Field(default=None, gt=0, le=2_147_483_647)
    method_name: str = Field(..., min_length=2, max_length=100)
    amount: float = Field(..., gt=0, allow_inf_nan=False)
    currency: str = Field(default="USD", min_length=2, max_length=20)
    transaction_reference: str = Field(..., min_length=2, max_length=255)
    proof_reference: Optional[str] = Field(default=None, max_length=500)


class ManualPaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    payment_method_id: Optional[int]
    method_name: str
    amount: float
    currency: str
    transaction_reference: str
    proof_reference: Optional[str]
    status: PaymentVerificationStatus
    admin_remark: Optional[str]
    created_at: datetime


class AgencySubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    agency_name: str
    registration_country: str
    license_number: str
    office_address: str
    trade_license_doc: str
    recruiting_license_doc: Optional[str]
    owner_id_doc: str
    verification_status: VerificationStatus
    admin_note: Optional[str]
    created_at: datetime


class AdminAgencyDecisionRequest(BaseModel):
    decision: str = Field(..., pattern="^(approve|reject)$")
    note: Optional[str] = Field(default=None, max_length=1000)


class PaymentMethodCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    country_scope: str = Field(default="ALL", min_length=2, max_length=100)
    account_details: str = Field(..., min_length=2)
    instructions: str = Field(..., min_length=2)
    is_active: bool = True


class PaymentMethodResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    country_scope: str
    account_details: str
    instructions: str
    is_active: bool
    created_at: datetime
