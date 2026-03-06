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

# ─── New Admin ──────────────────────────────────────────────────────────────────

class AdminUserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str                           # STUDENT, VENDOR, ADMIN
    student_id: Optional[str] = None    # required when role=STUDENT
    vendor_code: Optional[str] = None   # required when role=VENDOR
    business_name: Optional[str] = None # required when role=VENDOR

from typing import List
class BulkUserCreate(BaseModel):
    users: List[AdminUserCreate]

class ManualDeductRequest(BaseModel):
    user_identifier: str   # email, student_id, or name
    amount: float
    reason: str

class ManualTopUpRequest(BaseModel):
    user_identifier: str   # email, student_id, or name
    amount: float
    reason: str

class AdminDeductRequestCreate(BaseModel):
    student_identifier: str
    amount: float
    reason: str

class AdminSubscriptionCreate(BaseModel):
    student_identifier: str       # email, student_id, or name
    plan_name:          str
    amount:             float
    billing_cycle:      str            # WEEKLY, MONTHLY, SEMESTER
    vendor_code:        Optional[str] = None
    immediate_charge:   bool = True    # deduct first billing immediately
