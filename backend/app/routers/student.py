from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import database, schemas

router = APIRouter(tags=["student"])

@router.get("/wallet")
def get_wallet(db: Session = Depends(database.get_db)):
    return {
        "wallet_id": "w-mock-123",
        "balance": 1500.50,
        "currency": "INR",
        "status": "ACTIVE"
    }

@router.get("/transactions")
def get_transactions(db: Session = Depends(database.get_db)):
    return [
        {
            "transaction_id": "txn-987",
            "type": "VENDOR_PAYMENT",
            "amount": -150.00,
            "recipient": "canteen-01",
            "timestamp": "2026-03-05T10:30:00Z"
        }
    ]

@router.post("/transfer")
def transfer(req: schemas.TransferRequest, db: Session = Depends(database.get_db)):
    return {
        "status": "SUCCESS",
        "transaction_id": "txn-988",
        "new_balance": 1250.50
    }

@router.post("/pay-vendor")
def pay_vendor(req: schemas.VendorPaymentRequest, db: Session = Depends(database.get_db)):
    return {
        "status": "SUCCESS",
        "transaction_id": "txn-989",
        "new_balance": 1130.50
    }

@router.post("/subscribe")
def subscribe(req: schemas.SubscriptionRequest, db: Session = Depends(database.get_db)):
    return {"status": "SUCCESS", "message": "Subscribed to " + req.service_id}
