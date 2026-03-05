from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID

# ─── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str
    student_id: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: UUID

# ─── Student ───────────────────────────────────────────────────────────────────

class TopUpRequest(BaseModel):
    amount: float

class TransferRequest(BaseModel):
    recipient_identifier: str   # student_id, email, or name
    amount: float
    note: Optional[str] = None

class VendorPaymentRequest(BaseModel):
    vendor_id: str              # vendor_code
    amount: float

class SubscriptionRequest(BaseModel):
    service_id: str
    auto_renew: Optional[bool] = True

# ─── Vendor ────────────────────────────────────────────────────────────────────

class VendorPaymentInit(BaseModel):
    student_identifier: str     # student_id, email, or name
    amount: float
    description: str

# ─── Admin ─────────────────────────────────────────────────────────────────────

class VendorCreate(BaseModel):
    business_name: str
    vendor_id: str              # becomes vendor_code
    contact_email: str

class FineCreate(BaseModel):
    student_identifier: str     # student_id, email, or name
    amount: float
    reason: str
    force_deduct: bool = False
