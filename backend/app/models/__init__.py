from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String) # STUDENT, VENDOR, ADMIN
    wallet_balance = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    vendor_name = Column(String)
    vendor_code = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True) # null for system topups
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True) # null for system burns
    amount = Column(Float)
    type = Column(String) # P2P, VENDOR_PAYMENT, SUBSCRIPTION, FINE, FEE, TOP_UP
    status = Column(String, default="COMPLETED")
    timestamp = Column(DateTime, default=datetime.utcnow)

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

class PaymentRequest(Base):
    __tablename__ = "payment_requests"
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("users.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    description = Column(String, default="")
    status = Column(String, default="PENDING") # PENDING, PAID, DECLINED
    created_at = Column(DateTime, default=datetime.utcnow)

    vendor = relationship("User", foreign_keys=[vendor_id])
    student = relationship("User", foreign_keys=[student_id])

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plan_name = Column(String)
    amount = Column(Float)
    billing_cycle = Column(String) # MONTHLY, WEEKLY
    next_billing_date = Column(DateTime)
    is_active = Column(Boolean, default=True)

    user = relationship("User")

class Fine(Base):
    __tablename__ = "fines"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    reason = Column(String)
    amount = Column(Float)
    status = Column(String, default="UNPAID") # UNPAID, PAID
    created_by_admin = Column(Integer, ForeignKey("users.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[created_by_admin])
