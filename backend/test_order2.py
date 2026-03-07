import os, sys
sys.path.append(os.getcwd())
from app.database import SessionLocal
from app.models import User, Vendor, MenuItem
from app.schemas import CanteenOrderCreate, CanteenOrderItemCreate
from app.routers.student import place_canteen_order

def main():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email=='mje@campusflow.com').first()
        
        # Find a menu item
        menu = db.query(MenuItem).first()
        if not menu:
            print("No menu items at all!")
            return
            
        print(f"Loaded menu item: {menu.id} for vendor: {menu.vendor_id}")
        
        req = CanteenOrderCreate(
            vendor_id=menu.vendor_id, 
            items=[CanteenOrderItemCreate(menu_item_id=menu.id, quantity=1.0)]
        )
        
        print("Calling place_canteen_order...")
        place_canteen_order(req, current_user={'user_id': str(user.id)}, db=db)
        print("SUCCESS")
        
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
