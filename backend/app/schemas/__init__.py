from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    wallet_balance: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int

class TopUpRequest(BaseModel):
    amount: float

class TransferRequest(BaseModel):
    recipient_identifier: str  # email or name of recipient
    amount: float
    note: Optional[str] = None

class VendorPaymentRequest(BaseModel):
    vendor_id: str  # vendor_code like "canteen-01"
    amount: float

class SubscriptionRequest(BaseModel):
    service_id: str
    auto_renew: bool

class VendorPaymentInit(BaseModel):
    student_identifier: str  # email or name of student
    amount: float
    description: str

class VendorCreate(BaseModel):
    business_name: str
    vendor_id: str  # vendor_code
    contact_email: str

class FineCreate(BaseModel):
    student_id: str  # email or name of student
    amount: float
    reason: str
    force_deduct: bool
