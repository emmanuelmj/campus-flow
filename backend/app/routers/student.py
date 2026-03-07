from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app import database, models, schemas
from app.utils.security import require_student
from datetime import datetime, timedelta
from uuid import UUID
from typing import List

router = APIRouter(tags=["student"])


# ─── Wallet ────────────────────────────────────────────────────────────────────

@router.get("/wallet")
def get_wallet(
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    user = db.query(models.User).filter(models.User.id == current_user["user_id"]).first()
    return {
        "wallet_id": f"w-{user.id}",
        "balance": user.wallet_balance,
        "currency": "INR",
        "status": "ACTIVE",
    }


@router.post("/wallet/top-up")
def top_up(
    req: schemas.TopUpRequest,
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    user = db.query(models.User).filter(models.User.id == current_user["user_id"]).first()
    user.wallet_balance += req.amount

    txn = models.Transaction(
        sender_id=None,
        receiver_id=user.id,
        amount=req.amount,
        type="TOP_UP",
        status="COMPLETED",
    )
    db.add(txn)
    db.commit()
    db.refresh(user)
    return {"message": "Wallet topped up successfully", "new_balance": user.wallet_balance}


# ─── Transactions ──────────────────────────────────────────────────────────────

@router.get("/transactions")
def get_transactions(
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    uid = current_user["user_id"]
    txns = (
        db.query(models.Transaction)
        .filter(or_(models.Transaction.sender_id == uid, models.Transaction.receiver_id == uid))
        .order_by(models.Transaction.timestamp.desc())
        .all()
    )
    results = []
    
    # Pre-fetch all user info that might be related to these transactions to resolve names
    user_ids = set()
    for t in txns:
        if t.sender_id: user_ids.add(t.sender_id)
        if t.receiver_id: user_ids.add(t.receiver_id)
        
    users = db.query(models.User).filter(models.User.id.in_(user_ids)).all()
    user_map = {u.id: u.name for u in users}

    # Pre-fetch vendor info for vendor payments
    vendors = db.query(models.Vendor).all()
    vendor_map = {v.user_id: v.vendor_name for v in vendors}

    for t in txns:
        is_sender = str(t.sender_id) == uid
        
        # Determine the name of the 'other' entity
        entity_name = t.type
        if t.type == 'P2P':
            other_id = t.receiver_id if is_sender else t.sender_id
            entity_name = user_map.get(other_id, "Unknown Student")
        elif t.type == 'VENDOR_PAYMENT':
            other_id = t.receiver_id if is_sender else t.sender_id
            entity_name = vendor_map.get(other_id, "Unknown Vendor")
            
        results.append({
            "transaction_id": f"txn-{t.id}",
            "type": t.type,
            "entity_name": entity_name,
            "amount": -t.amount if is_sender else t.amount,
            "sender_id": str(t.sender_id),
            "receiver_id": str(t.receiver_id) if t.receiver_id else None,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            "status": t.status,
        })
    return results


# ─── P2P Transfer ──────────────────────────────────────────────────────────────

@router.post("/transfer")
def transfer(
    req: schemas.TransferRequest,
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    sender = db.query(models.User).filter(models.User.id == current_user["user_id"]).first()

    # Find recipient by student_id, email, or name
    recipient = (
        db.query(models.User)
        .filter(
            models.User.role == "STUDENT",
            or_(
                models.User.email == req.recipient_identifier,
                models.User.student_id == req.recipient_identifier,
                models.User.name == req.recipient_identifier,
            ),
        )
        .first()
    )
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    if str(recipient.id) == str(sender.id):
        raise HTTPException(status_code=400, detail="Cannot transfer to yourself")
    if sender.wallet_balance < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    sender.wallet_balance -= req.amount
    recipient.wallet_balance += req.amount

    txn = models.Transaction(
        sender_id=sender.id,
        receiver_id=recipient.id,
        amount=req.amount,
        type="P2P",
        status="COMPLETED",
    )
    db.add(txn)
    db.commit()
    db.refresh(sender)
    return {
        "status": "SUCCESS",
        "transaction_id": f"txn-{txn.id}",
        "new_balance": sender.wallet_balance,
    }


# ─── Vendor Payment ────────────────────────────────────────────────────────────

@router.post("/pay-vendor")
def pay_vendor(
    req: schemas.VendorPaymentRequest,
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    student = db.query(models.User).filter(models.User.id == current_user["user_id"]).first()

    vendor_profile = db.query(models.Vendor).filter(models.Vendor.vendor_code == req.vendor_id).first()
    if not vendor_profile:
        raise HTTPException(status_code=404, detail="Vendor not found")

    vendor_user = db.query(models.User).filter(models.User.id == vendor_profile.user_id).first()

    if student.wallet_balance < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    student.wallet_balance -= req.amount
    vendor_user.wallet_balance += req.amount

    txn = models.Transaction(
        sender_id=student.id,
        receiver_id=vendor_user.id,
        amount=req.amount,
        type="VENDOR_PAYMENT",
        status="COMPLETED",
    )
    db.add(txn)
    db.commit()
    db.refresh(student)
    return {
        "status": "SUCCESS",
        "transaction_id": f"txn-{txn.id}",
        "new_balance": student.wallet_balance,
    }


@router.get("/vendors")
def list_vendors(
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    """Allow students to fetch a list of active vendors for payment."""
    vendors = db.query(models.Vendor).all()
    return [{"vendor_id": v.vendor_code, "business_name": v.vendor_name} for v in vendors]


# ─── Subscriptions ─────────────────────────────────────────────────────────────

@router.post("/subscribe")
def subscribe(
    req: schemas.SubscriptionRequest,
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    next_bill = datetime.utcnow() + timedelta(days=30)

    sub = models.Subscription(
        user_id=current_user["user_id"],
        plan_name=req.service_id,
        amount=0.0,
        billing_cycle="MONTHLY",
        next_billing_date=next_bill,
        is_active=True,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return {
        "status": "SUCCESS",
        "message": f"Subscribed to {req.service_id}",
        "subscription_id": f"sub-{sub.id}",
    }


# ─── Payment Requests (from vendors) ──────────────────────────────────────────

@router.get("/student/payment-requests")
def get_payment_requests(
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    requests = (
        db.query(models.PaymentRequest)
        .filter(
            models.PaymentRequest.student_id == current_user["user_id"],
            models.PaymentRequest.status == "PENDING",
        )
        .order_by(models.PaymentRequest.created_at.desc())
        .all()
    )
    results = []
    for r in requests:
        vendor_profile = db.query(models.Vendor).filter(models.Vendor.user_id == r.vendor_id).first()
        results.append({
            "request_id": f"req-{r.id}",
            "vendor_id": vendor_profile.vendor_code if vendor_profile else str(r.vendor_id),
            "amount": r.amount,
            "description": r.description,
            "status": r.status,
        })
    return results


@router.post("/student/approve-payment/{request_id}")
def approve_payment(
    request_id: UUID,  # UUID, not int
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    pay_req = db.query(models.PaymentRequest).filter(models.PaymentRequest.id == request_id).first()
    if not pay_req:
        raise HTTPException(status_code=404, detail="Payment request not found")
    if str(pay_req.student_id) != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your payment request")
    if pay_req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Request already processed")

    student = db.query(models.User).filter(models.User.id == current_user["user_id"]).first()
    if student.wallet_balance < pay_req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    vendor_user = db.query(models.User).filter(models.User.id == pay_req.vendor_id).first()

    student.wallet_balance -= pay_req.amount
    vendor_user.wallet_balance += pay_req.amount
    pay_req.status = "PAID"

    txn = models.Transaction(
        sender_id=student.id,
        receiver_id=vendor_user.id,
        amount=pay_req.amount,
        type="VENDOR_PAYMENT",
        status="COMPLETED",
    )
    db.add(txn)
    db.commit()
    db.refresh(student)
    return {
        "status": "SUCCESS",
        "message": "Payment request approved",
        "transaction_id": f"txn-{txn.id}",
        "new_balance": student.wallet_balance,
    }


# ─── Fines ─────────────────────────────────────────────────────────────────────

@router.get("/student/fines")
def get_fines(
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    fines = (
        db.query(models.Fine)
        .filter(models.Fine.user_id == current_user["user_id"])
        .order_by(models.Fine.timestamp.desc())
        .all()
    )
    return [
        {
            "fine_id": f"fine-{f.id}",
            "amount": f.amount,
            "reason": f.reason,
            "status": f.status,
            "issued_at": f.timestamp.isoformat() if f.timestamp else None,
        }
        for f in fines
    ]


@router.post("/student/pay-fine/{fine_id}")
def pay_fine(
    fine_id: UUID,  # UUID, not int
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    fine = db.query(models.Fine).filter(models.Fine.id == fine_id).first()
    if not fine:
        raise HTTPException(status_code=404, detail="Fine not found")
    if str(fine.user_id) != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not your fine")
    if fine.status == "PAID":
        raise HTTPException(status_code=400, detail="Fine already paid")

    student = db.query(models.User).filter(models.User.id == current_user["user_id"]).first()
    if student.wallet_balance < fine.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    student.wallet_balance -= fine.amount
    fine.status = "PAID"

    txn = models.Transaction(
        sender_id=student.id,
        receiver_id=None,
        amount=fine.amount,
        type="FINE",
        status="COMPLETED",
    )
    db.add(txn)
    db.commit()
    db.refresh(student)
    return {
        "status": "SUCCESS",
        "message": "Fine paid successfully",
        "new_balance": student.wallet_balance,
    }


# ─── Canteen ───────────────────────────────────────────────────────────────────

@router.get("/canteens", response_model=List[dict])
def list_available_canteens(
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    # Canteens are vendors who have at least one menu item or are categorized as such
    # For now, let's just list all vendors
    vendors = db.query(models.Vendor).all()
    return [{"vendor_id": str(v.user_id), "vendor_code": v.vendor_code, "vendor_name": v.vendor_name} for v in vendors]


@router.get("/canteens/{vendor_id}/menu", response_model=List[schemas.MenuItemResponse])
def get_canteen_menu(
    vendor_id: UUID,
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    return db.query(models.MenuItem).filter(
        models.MenuItem.vendor_id == vendor_id,
        models.MenuItem.is_available == True
    ).all()


@router.post("/orders", response_model=schemas.CanteenOrderResponse)
def place_canteen_order(
    req: schemas.CanteenOrderCreate,
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    student = db.query(models.User).filter(models.User.id == current_user["user_id"]).first()
    
    # Calculate total and check availability
    total_amount = 0.0
    order_items = []
    
    for item_req in req.items:
        menu_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_req.menu_item_id).first()
        if not menu_item or not menu_item.is_available:
            raise HTTPException(status_code=400, detail=f"Item {item_req.menu_item_id} not available")
        
        item_total = menu_item.price * item_req.quantity
        total_amount += item_total
        
        order_items.append(models.CanteenOrderItem(
            menu_item_id=menu_item.id,
            quantity=item_req.quantity,
            price_at_order=menu_item.price
        ))

    if student.wallet_balance < total_amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # Deduct balance
    student.wallet_balance -= total_amount
    
    # Create order
    order = models.CanteenOrder(
        student_id=student.id,
        vendor_id=req.vendor_id,
        total_amount=total_amount,
        status="PENDING",
        items=order_items
    )
    
    # Create transaction record
    txn = models.Transaction(
        sender_id=student.id,
        receiver_id=req.vendor_id,
        amount=total_amount,
        type="CANTEEN_PURCHASE",
        status="COMPLETED",
    )
    
    db.add(order)
    db.add(txn)
    db.commit()
    db.refresh(order)
    return order


@router.get("/orders", response_model=List[schemas.CanteenOrderResponse])
def get_my_orders(
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    return (
        db.query(models.CanteenOrder)
        .filter(models.CanteenOrder.student_id == current_user["user_id"])
        .order_by(models.CanteenOrder.created_at.desc())
        .all()
    )


# ─── Library ───────────────────────────────────────────────────────────────────

@router.get("/library/books", response_model=List[schemas.BookResponse])
def list_books(
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    return db.query(models.Book).filter(models.Book.available_copies > 0).all()


@router.post("/library/rent", response_model=schemas.BookRentalResponse)
def rent_book(
    req: schemas.BookRentalCreate,
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    student = db.query(models.User).filter(models.User.id == current_user["user_id"]).first()
    book = db.query(models.Book).filter(models.Book.id == req.book_id).first()
    
    if not book or book.available_copies <= 0:
        raise HTTPException(status_code=400, detail="Book not available")

    # Check if already rented
    active_rental = db.query(models.BookRental).filter(
        models.BookRental.book_id == book.id,
        models.BookRental.student_id == student.id,
        models.BookRental.status == "RENTED"
    ).first()
    if active_rental:
        raise HTTPException(status_code=400, detail="You already have this book rented")

    # Default due date 14 days from now
    due_date = datetime.utcnow() + timedelta(days=14)
    
    rental = models.BookRental(
        book_id=book.id,
        student_id=student.id,
        due_date=due_date,
        status="RENTED"
    )
    
    book.available_copies -= 1
    
    db.add(rental)
    db.commit()
    db.refresh(rental)
    return rental


@router.get("/library/rentals", response_model=List[schemas.BookRentalResponse])
def get_my_rentals(
    current_user: dict = Depends(require_student),
    db: Session = Depends(database.get_db),
):
    return (
        db.query(models.BookRental)
        .filter(models.BookRental.student_id == current_user["user_id"])
        .order_by(models.BookRental.rented_at.desc())
        .all()
    )
