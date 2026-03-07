from app.database import SessionLocal
from app import models
import uuid

def seed():
    db = SessionLocal()
    try:
        # 1. Ensure a Vendor exists
        vendor_id = uuid.UUID("f47ac10b-58cc-4372-a567-0e02b2c3d479")
        vendor_user = db.query(models.User).filter(models.User.email == "vendor@campusflow.com").first()
        if not vendor_user:
            print("Creating vendor user...")
            vendor_user = models.User(
                id=vendor_id,
                email="vendor@campusflow.com",
                full_name="Main Canteen Vendor",
                hashed_password="hashed", # Not important for this seed
                role="VENDOR",
                wallet_balance=0
            )
            db.add(vendor_user)
            db.flush()

        vendor = db.query(models.Vendor).filter(models.Vendor.user_id == vendor_user.id).first()
        if not vendor:
            print("Creating vendor record...")
            vendor = models.Vendor(
                user_id=vendor_user.id,
                vendor_name="Main Canteen",
                vendor_code="CNTN01",
                upi_id="canteen@upi"
            )
            db.add(vendor)
            db.flush()

        # 2. Add Menu Items
        if db.query(models.MenuItem).count() == 0:
            print("Adding menu items...")
            items = [
                models.MenuItem(id=uuid.uuid4(), vendor_id=vendor_user.id, name="Paneer Tikka Roll", price=120.0, description="Spicy paneer roll", is_available=True),
                models.MenuItem(id=uuid.uuid4(), vendor_id=vendor_user.id, name="Veg Deluxe Thali", price=250.0, description="Full meal with dessert", is_available=True),
                models.MenuItem(id=uuid.uuid4(), vendor_id=vendor_user.id, name="Chocolate Shake", price=90.0, description="Thick and creamy", is_available=True),
            ]
            db.add_all(items)

        # 3. Add Books
        if db.query(models.Book).count() == 0:
            print("Adding books...")
            books = [
                models.Book(id=uuid.uuid4(), title="Artificial Intelligence: A Modern Approach", author="Stuart Russell", category="Computer Science", total_copies=10, available_copies=10),
                models.Book(id=uuid.uuid4(), title="Clean Code", author="Robert C. Martin", category="Software Engineering", total_copies=5, available_copies=5),
                models.Book(id=uuid.uuid4(), title="The Alchemist", author="Paulo Coelho", category="Fiction", total_copies=8, available_copies=8),
            ]
            db.add_all(books)

        db.commit()
        print("Seed completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
