from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from decimal import Decimal
from app import database, models, schemas
from app.utils.security import get_current_user

router = APIRouter(prefix="/vendor", tags=["vendor"])


# ─── Local request schema ─────────────────────────────────────────────────────

class PaymentRequestBody(BaseModel):
    student_email: str
    amount: Decimal


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _require_vendor(current_user: dict):
    if current_user["role"] != "VENDOR":
        raise HTTPException(status_code=403, detail="Vendors only")


def _find_student(db: Session, identifier: str):
    return (
        db.query(models.User)
        .filter(
            models.User.role == "STUDENT",
            or_(
                models.User.email == identifier,
                models.User.student_id == identifier,
                models.User.name == identifier,
            ),
        )
        .first()
    )


# ═══════════════════════════════════════════════════════════════════════════════
# EXISTING ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/request-payment")
def request_payment(
    req: PaymentRequestBody,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _require_vendor(current_user)
    amount = float(req.amount)
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    student = db.query(models.User).filter(models.User.email == req.student_email, models.User.role == "STUDENT").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found with that email")

    try:
        pay_req = models.PaymentRequest(
            vendor_id=current_user["user_id"], student_id=student.id,
            amount=amount, description="", status="PENDING",
        )
        db.add(pay_req)
        db.commit()
        db.refresh(pay_req)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {"status": "success", "message": "Payment request sent", "data": {"request_id": str(pay_req.id), "status": "PENDING"}}


@router.get("/transactions")
def vendor_transactions(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _require_vendor(current_user)
    txns = (
        db.query(models.Transaction)
        .filter(models.Transaction.receiver_id == current_user["user_id"])
        .order_by(models.Transaction.timestamp.desc())
        .all()
    )
    results = []
    for t in txns:
        counterparty_name = "Unknown"
        if t.sender_id:
            sender = db.query(models.User).filter(models.User.id == t.sender_id).first()
            if sender:
                counterparty_name = sender.name
        results.append({
            "id": str(t.id),
            "type": t.type if isinstance(t.type, str) else t.type.value,
            "amount": t.amount,
            "counterparty_name": counterparty_name,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            "status": t.status if isinstance(t.status, str) else t.status.value,
        })
    return {"status": "success", "data": {"transactions": results}}


# ═══════════════════════════════════════════════════════════════════════════════
# NEW ENDPOINTS (from CampusFlow_API_Changes.md)
# ═══════════════════════════════════════════════════════════════════════════════

# ─── 5.1 Submit Deduct Request to Admin ────────────────────────────────────────

@router.post("/request-admin-deduct")
def request_admin_deduct(
    req: schemas.AdminDeductRequestCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _require_vendor(current_user)

    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    student = _find_student(db, req.student_identifier)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    try:
        deduct_req = models.AdminDeductRequest(
            vendor_id=current_user["user_id"],
            student_id=student.id,
            amount=req.amount,
            reason=req.reason,
            status="PENDING",
        )
        db.add(deduct_req)
        db.commit()
        db.refresh(deduct_req)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "status": "SUCCESS",
        "request_id": str(deduct_req.id),
        "message": "Deduct request sent to admin for approval",
    }


# ─── 5.2 List Own Deduct Requests ─────────────────────────────────────────────

@router.get("/deduct-requests")
def list_own_deduct_requests(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _require_vendor(current_user)

    requests = (
        db.query(models.AdminDeductRequest)
        .filter(models.AdminDeductRequest.vendor_id == current_user["user_id"])
        .order_by(models.AdminDeductRequest.created_at.desc())
        .all()
    )

    results = []
    for r in requests:
        student_user = db.query(models.User).filter(models.User.id == r.student_id).first()
        results.append({
            "id": str(r.id),
            "student_name": student_user.name if student_user else "Unknown",
            "student_identifier": student_user.student_id if student_user else None,
            "amount": r.amount,
            "reason": r.reason,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
        })

    return results
