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
    CANTEEN_PURCHASE = "CANTEEN_PURCHASE"
    LIBRARY_RENTAL = "LIBRARY_RENTAL"


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


class AdminDeductRequest(Base):
    __tablename__ = "admin_deduct_requests"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    amount = Column(Float, nullable=False)
    reason = Column(String, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    vendor = relationship("User", foreign_keys=[vendor_id])
    student = relationship("User", foreign_keys=[student_id])
    resolver = relationship("User", foreign_keys=[resolved_by])


# ─── Canteen ───────────────────────────────────────────────────────────────────

class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=True) # e.g. Snacks, Drinks, Mains
    is_available = Column(Boolean, default=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vendor = relationship("User", foreign_keys=[vendor_id])


class CanteenOrder(Base):
    __tablename__ = "canteen_orders"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    total_amount = Column(Float, nullable=False)
    status = Column(String, default="PENDING") # PENDING, PREPARING, READY, COMPLETED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", foreign_keys=[student_id])
    vendor = relationship("User", foreign_keys=[vendor_id])
    items = relationship("CanteenOrderItem", back_populates="order")


class CanteenOrderItem(Base):
    __tablename__ = "canteen_order_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("canteen_orders.id"))
    menu_item_id = Column(UUID(as_uuid=True), ForeignKey("menu_items.id"))
    quantity = Column(SQLEnum(enum.IntEnum('Quantity', 'ONE TWO THREE FOUR FIVE'), create_type=False), default=1) # Simplified for now or just use Integer
    # Re-evaluating quantity to just use Integer for simplicity
    quantity = Column(Float, default=1.0) # Using float/int
    price_at_order = Column(Float, nullable=False)

    order = relationship("CanteenOrder", back_populates="items")
    menu_item = relationship("MenuItem")


# ─── Library ───────────────────────────────────────────────────────────────────

class Book(Base):
    __tablename__ = "books"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    isbn = Column(String, unique=True, nullable=True)
    category = Column(String, nullable=True)
    total_copies = Column(SQLEnum(enum.IntEnum('Copies', 'ZERO ONE TWO THREE FOUR FIVE TEN'), create_type=False), default=1)
    # Again, better to use Float or Integer
    total_copies = Column(Float, default=1.0)
    available_copies = Column(Float, default=1.0)
    image_url = Column(String, nullable=True)

class BookRental(Base):
    __tablename__ = "book_rentals"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"))
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    rented_at = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=False)
    returned_at = Column(DateTime, nullable=True)
    status = Column(String, default="RENTED") # RENTED, RETURNED, OVERDUE

    book = relationship("Book")
    student = relationship("User")
