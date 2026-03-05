from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
import uuid
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    VENDOR = "VENDOR"
    ADMIN = "ADMIN"


class TransactionType(str, enum.Enum):
    P2P = "P2P"
    VENDOR_PAYMENT = "VENDOR_PAYMENT"
    SUB = "SUB"
    FINE = "FINE"
    FEE = "FEE"
    TOP_UP = "TOP_UP"


class TransactionStatus(str, enum.Enum):
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    PENDING = "PENDING"


class FineStatus(str, enum.Enum):
    UNPAID = "UNPAID"
    PAID = "PAID"


class BillingCycle(str, enum.Enum):
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    SEMESTER = "SEMESTER"


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    wallet_balance = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    student_id = Column(String, unique=True, nullable=True)  # e.g. CS-2024-001


# Named "Vendor" (not VendorProfile) so Dev 2's router references work directly
class Vendor(Base):
    __tablename__ = "vendor_profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    vendor_name = Column(String, nullable=False)
    vendor_code = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    receiver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    amount = Column(Float, nullable=False)
    type = Column(SQLEnum(TransactionType), nullable=False)
    status = Column(SQLEnum(TransactionStatus), nullable=False, default=TransactionStatus.COMPLETED)
    timestamp = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])


class PaymentRequest(Base):
    __tablename__ = "payment_requests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True, default="")
    status = Column(String, default="PENDING")  # PENDING, PAID, DECLINED
    created_at = Column(DateTime, default=datetime.utcnow)

    vendor = relationship("User", foreign_keys=[vendor_id])
    student = relationship("User", foreign_keys=[student_id])


class Fine(Base):
    __tablename__ = "fines"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # "user_id" used to match Dev 2's router column references
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    reason = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(SQLEnum(FineStatus), default=FineStatus.UNPAID)
    created_by_admin = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[created_by_admin])


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # "user_id" used to match Dev 2's router column references
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    plan_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    billing_cycle = Column(SQLEnum(BillingCycle), nullable=False, default=BillingCycle.MONTHLY)
    next_billing_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User", foreign_keys=[user_id])
