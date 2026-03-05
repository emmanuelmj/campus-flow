from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app import database, schemas

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/create-vendor", status_code=201)
def create_vendor(req: schemas.VendorCreate, db: Session = Depends(database.get_db)):
    return {"status": "SUCCESS", "vendor_id": req.vendor_id}

@router.post("/add-fine")
def add_fine(req: schemas.FineCreate, db: Session = Depends(database.get_db)):
    return {
        "status": "SUCCESS",
        "deducted": req.amount
    }

@router.get("/transactions")
def admin_transactions(db: Session = Depends(database.get_db)):
    return []

@router.get("/users")
def get_users(db: Session = Depends(database.get_db)):
    return []
