from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app import database, models, schemas
from app.utils.security import require_admin, get_password_hash

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/create-vendor", status_code=201)
def create_vendor(
    req: schemas.VendorCreate,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    # Check if vendor_code already exists
    existing = db.query(models.Vendor).filter(models.Vendor.vendor_code == req.vendor_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vendor code already exists")

    # Check if email already registered
    existing_user = db.query(models.User).filter(models.User.email == req.contact_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user account for vendor with a default password
    vendor_user = models.User(
        name=req.business_name,
        email=req.contact_email,
        password_hash=get_password_hash("vendor123"),  # default password for hackathon
        role="VENDOR",
    )
    db.add(vendor_user)
    db.commit()
    db.refresh(vendor_user)

    # Create vendor profile
    vendor_profile = models.Vendor(
        user_id=vendor_user.id,
        vendor_name=req.business_name,
        vendor_code=req.vendor_id,
    )
    db.add(vendor_profile)
    db.commit()
    db.refresh(vendor_profile)

    return {
        "status": "SUCCESS",
        "message": "Vendor created successfully",
        "vendor_user_id": vendor_user.id,
    }


@router.get("/vendors")
def list_vendors(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    vendors = db.query(models.Vendor).all()
    return [
        {
            "vendor_id": v.vendor_code,
            "business_name": v.vendor_name,
            "user_id": v.user_id,
            "created_at": v.created_at.isoformat() if v.created_at else None,
        }
        for v in vendors
    ]


@router.post("/add-fine")
def add_fine(
    req: schemas.FineCreate,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    # Find student by email or name
    student = (
        db.query(models.User)
        .filter(
            models.User.role == "STUDENT",
            or_(
                models.User.email == req.student_id,
                models.User.name == req.student_id,
            ),
        )
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    fine = models.Fine(
        user_id=student.id,
        reason=req.reason,
        amount=req.amount,
        status="UNPAID",
        created_by_admin=current_user["user_id"],
    )
    db.add(fine)

    deducted = False
    if req.force_deduct:
        if student.wallet_balance >= req.amount:
            student.wallet_balance -= req.amount
            fine.status = "PAID"
            txn = models.Transaction(
                sender_id=student.id,
                receiver_id=None,
                amount=req.amount,
                type="FINE",
                status="COMPLETED",
            )
            db.add(txn)
            deducted = True

    db.commit()
    db.refresh(fine)

    result = {
        "status": "SUCCESS",
        "fine_id": f"fine-{fine.id}",
        "message": "Fine issued",
    }
    if req.force_deduct:
        result["deducted"] = deducted
        if deducted:
            result["message"] = "Fine issued and amount deducted from wallet"
        else:
            result["message"] = "Fine issued but insufficient balance to deduct"
    return result


@router.get("/users")
def get_users(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "wallet_balance": u.wallet_balance,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.get("/transactions")
def admin_transactions(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    txns = (
        db.query(models.Transaction)
        .order_by(models.Transaction.timestamp.desc())
        .all()
    )
    return [
        {
            "transaction_id": f"txn-{t.id}",
            "sender_id": t.sender_id,
            "receiver_id": t.receiver_id,
            "type": t.type,
            "amount": t.amount,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            "status": t.status,
        }
        for t in txns
    ]
