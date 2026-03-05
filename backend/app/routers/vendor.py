from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import database, schemas

router = APIRouter(prefix="/vendor", tags=["vendor"])

@router.post("/request-payment")
def request_payment(req: schemas.VendorPaymentInit, db: Session = Depends(database.get_db)):
    return {"status": "SUCCESS", "message": "Payment requested"}

@router.get("/transactions")
def vendor_transactions(db: Session = Depends(database.get_db)):
    return [
        {
            "transaction_id": "txn-989",
            "sender_id": "CS-2024-001",
            "amount": 120.00,
            "timestamp": "2026-03-05T12:00:00Z"
        }
    ]
