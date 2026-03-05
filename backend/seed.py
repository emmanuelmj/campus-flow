import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import User, Vendor, Transaction
from app.utils.security import pwd_context

def seed_db():
    print("Creating tables if not present...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Seeding users...")
    
    # 1. Admin
    admin_email = "admin@campusflow.com"
    if not db.query(User).filter_by(email=admin_email).first():
        admin = User(
            name="Super Admin",
            email=admin_email,
            password_hash=pwd_context.hash("admin123"),
            role="ADMIN",
            wallet_balance=0.0
        )
        db.add(admin)
        print("Added Admin.")
        
    # 2. Vendor
    vendor_email = "vendor@campusflow.com"
    vendor_user = db.query(User).filter_by(email=vendor_email).first()
    if not vendor_user:
        vendor_user = User(
            name="John Vendor",
            email=vendor_email,
            password_hash=pwd_context.hash("vendor123"),
            role="VENDOR",
            wallet_balance=100.0
        )
        db.add(vendor_user)
        db.commit()
        db.refresh(vendor_user)
        
        vendor_profile = Vendor(
            user_id=vendor_user.id,
            vendor_name="Campus Cafe",
            vendor_code="CAFE01"
        )
        db.add(vendor_profile)
        print("Added Vendor.")
        
    # 3. Student
    student_email = "student@campusflow.com"
    student_user = db.query(User).filter_by(email=student_email).first()
    if not student_user:
        student_user = User(
            name="Alice Student",
            email=student_email,
            password_hash=pwd_context.hash("student123"),
            role="STUDENT",
            wallet_balance=500.0,
            student_id="CS-2024-001"
        )
        db.add(student_user)
        db.commit()
        db.refresh(student_user)
        print("Added Student.")

    # 4. Transactions
    if student_user and vendor_user and db.query(Transaction).count() == 0:
        t1 = Transaction(
            sender_id=student_user.id,
            receiver_id=vendor_user.id,
            amount=25.50,
            type="VENDOR_PAYMENT",
            status="COMPLETED"
        )
        student_user.wallet_balance -= 25.50
        vendor_user.wallet_balance += 25.50
        db.add(t1)
        print("Added test transaction.")
            
    db.commit()
    print("Database seeded successfully.")
    db.close()

if __name__ == "__main__":
    seed_db()
