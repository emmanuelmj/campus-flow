from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from decimal import Decimal
from uuid import UUID
from app import database, models, schemas
from app.utils.security import get_current_user
from typing import List

router = APIRouter(prefix="/vendor", tags=["vendor"])


# ─── Local request schema ─────────────────────────────────────────────────────

class PaymentRequestBody(BaseModel):
    student_identifier: str
    amount: Decimal
    description: str = ""


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _require_vendor(current_user: dict):
    if current_user["role"] != "VENDOR":
        raise HTTPException(status_code=403, detail="Vendors only")


def _find_student(db: Session, identifier: str):
    import uuid
    is_uuid = False
    try:
        uuid_obj = uuid.UUID(identifier)
        is_uuid = True
    except ValueError:
        pass

    filters = [
        models.User.email == identifier,
        models.User.student_id == identifier,
        models.User.name == identifier,
    ]
    if is_uuid:
        filters.append(models.User.id == uuid_obj)

    return (
        db.query(models.User)
        .filter(
            models.User.role == "STUDENT",
            or_(*filters),
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

    student = _find_student(db, req.student_identifier)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found with that identifier")

    try:
        pay_req = models.PaymentRequest(
            vendor_id=current_user["user_id"], student_id=student.id,
            amount=amount, description=req.description, status="PENDING",
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


# ─── Canteen Menu Management ──────────────────────────────────────────────────

@router.post("/menu", response_model=schemas.MenuItemResponse)
def create_menu_item(
    item: schemas.MenuItemCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _require_vendor(current_user)
    db_item = models.MenuItem(**item.model_dump(), vendor_id=current_user["user_id"])
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.get("/menu", response_model=List[schemas.MenuItemResponse])
def list_menu_items(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _require_vendor(current_user)
    return db.query(models.MenuItem).filter(models.MenuItem.vendor_id == current_user["user_id"]).all()


@router.put("/menu/{item_id}", response_model=schemas.MenuItemResponse)
def update_menu_item(
    item_id: UUID,
    item: schemas.MenuItemUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _require_vendor(current_user)
    db_item = db.query(models.MenuItem).filter(
        models.MenuItem.id == item_id, 
        models.MenuItem.vendor_id == current_user["user_id"]
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    update_data = item.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/menu/{item_id}")
def delete_menu_item(
    item_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _require_vendor(current_user)
    db_item = db.query(models.MenuItem).filter(
        models.MenuItem.id == item_id, 
        models.MenuItem.vendor_id == current_user["user_id"]
    ).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    
    db.delete(db_item)
    db.commit()
    return {"status": "SUCCESS", "message": "Item deleted"}


# ─── Canteen Order Management ─────────────────────────────────────────────────

@router.get("/orders", response_model=List[schemas.CanteenOrderResponse])
def list_vendor_orders(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _require_vendor(current_user)
    return (
        db.query(models.CanteenOrder)
        .filter(models.CanteenOrder.vendor_id == current_user["user_id"])
        .order_by(models.CanteenOrder.created_at.desc())
        .all()
    )


@router.patch("/orders/{order_id}/status", response_model=schemas.CanteenOrderResponse)
def update_order_status(
    order_id: UUID,
    status: str, # PENDING, PREPARING, READY, COMPLETED, CANCELLED
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    _require_vendor(current_user)
    order = db.query(models.CanteenOrder).filter(
        models.CanteenOrder.id == order_id,
        models.CanteenOrder.vendor_id == current_user["user_id"]
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status
    db.commit()
    db.refresh(order)
    return order
