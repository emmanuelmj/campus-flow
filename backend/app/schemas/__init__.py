from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    wallet_balance: float
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TransferRequest(BaseModel):
    recipient_identifier: str
    amount: float
    note: Optional[str] = None

class VendorPaymentRequest(BaseModel):
    vendor_id: str
    amount: float

class SubscriptionRequest(BaseModel):
    service_id: str
    auto_renew: bool

class VendorPaymentInit(BaseModel):
    student_identifier: str
    amount: float
    description: str

class VendorCreate(BaseModel):
    business_name: str
    vendor_id: str
    contact_email: str

class FineCreate(BaseModel):
    student_id: str
    amount: float
    reason: str
    force_deduct: bool
