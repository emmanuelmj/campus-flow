from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app import database, models, schemas
from app.utils.security import require_vendor

router = APIRouter(prefix="/vendor", tags=["vendor"])


@router.post("/request-payment")
def request_payment(
    req: schemas.VendorPaymentInit,
    current_user: dict = Depends(require_vendor),
    db: Session = Depends(database.get_db),
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    # Find student by student_id, email, or name
    student = (
        db.query(models.User)
        .filter(
            models.User.role == "STUDENT",
            or_(
                models.User.email == req.student_identifier,
                models.User.student_id == req.student_identifier,
                models.User.name == req.student_identifier,
            ),
        )
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    pay_req = models.PaymentRequest(
        vendor_id=current_user["user_id"],
        student_id=student.id,
        amount=req.amount,
        description=req.description,
        status="PENDING",
    )
    db.add(pay_req)
    db.commit()
    db.refresh(pay_req)
    return {
        "status": "SUCCESS",
        "request_id": f"req-{pay_req.id}",
        "message": "Payment request sent to student",
    }


@router.get("/transactions")
def vendor_transactions(
    current_user: dict = Depends(require_vendor),
    db: Session = Depends(database.get_db),
):
    txns = (
        db.query(models.Transaction)
        .filter(models.Transaction.receiver_id == current_user["user_id"])
        .order_by(models.Transaction.timestamp.desc())
        .all()
    )
    return [
        {
            "transaction_id": f"txn-{t.id}",
            "sender_id": str(t.sender_id) if t.sender_id else None,
            "amount": t.amount,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            "status": t.status,
        }
        for t in txns
    ]


@router.post("/request-admin-deduct")
def request_admin_deduct(
    req: schemas.AdminDeductRequestCreate,
    current_user: dict = Depends(require_vendor),
    db: Session = Depends(database.get_db),
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    student = (
        db.query(models.User)
        .filter(
            models.User.role == "STUDENT",
            or_(
                models.User.email == req.student_identifier,
                models.User.student_id == req.student_identifier,
                models.User.name == req.student_identifier,
            ),
        )
        .first()
    )
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

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
    return {
        "status": "SUCCESS",
        "request_id": str(deduct_req.id),
        "message": "Deduct request sent to admin for approval",
    }


@router.get("/deduct-requests")
def vendor_deduct_requests(
    current_user: dict = Depends(require_vendor),
    db: Session = Depends(database.get_db),
):
    reqs = (
        db.query(models.AdminDeductRequest)
        .filter(models.AdminDeductRequest.vendor_id == current_user["user_id"])
        .order_by(models.AdminDeductRequest.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(r.id),
            "student_name": r.student.name if r.student else None,
            "student_identifier": r.student.student_id if r.student else None,
            "amount": r.amount,
            "reason": r.reason,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
        }
        for r in reqs
    ]
