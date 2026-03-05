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
    # Check vendor_code uniqueness
    if db.query(models.Vendor).filter(models.Vendor.vendor_code == req.vendor_id).first():
        raise HTTPException(status_code=400, detail="Vendor code already exists")

    # Check email uniqueness
    if db.query(models.User).filter(models.User.email == req.contact_email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create User account for vendor (default password: vendor123)
    vendor_user = models.User(
        name=req.business_name,
        email=req.contact_email,
        password_hash=get_password_hash("vendor123"),
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
        "vendor_user_id": str(vendor_user.id),
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
            "user_id": str(v.user_id),
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

    result = {"status": "SUCCESS", "fine_id": f"fine-{fine.id}", "message": "Fine issued"}
    if req.force_deduct:
        result["deducted"] = deducted
        result["message"] = (
            "Fine issued and amount deducted from wallet" if deducted
            else "Fine issued but insufficient balance to deduct"
        )
    return result


@router.get("/users")
def get_users(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    users = db.query(models.User).order_by(models.User.created_at.desc()).all()
    return [
        {
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "wallet_balance": u.wallet_balance,
            "student_id": u.student_id,
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
            "sender_id": str(t.sender_id) if t.sender_id else None,
            "receiver_id": str(t.receiver_id) if t.receiver_id else None,
            "type": t.type,
            "amount": t.amount,
            "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            "status": t.status,
        }
        for t in txns
    ]


@router.post("/create-user", status_code=201)
def create_user(
    req: schemas.AdminUserCreate,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    valid_roles = {"STUDENT", "VENDOR", "ADMIN"}
    if req.role.upper() not in valid_roles:
        raise HTTPException(status_code=400, detail="Invalid role")

    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if req.role.upper() == "STUDENT" and req.student_id:
        if db.query(models.User).filter(models.User.student_id == req.student_id).first():
            raise HTTPException(status_code=400, detail="Student ID already registered")

    if req.role.upper() == "VENDOR":
        if not req.vendor_code or not req.business_name:
            raise HTTPException(status_code=400, detail="vendor_code and business_name required for VENDOR")
        if db.query(models.Vendor).filter(models.Vendor.vendor_code == req.vendor_code).first():
            raise HTTPException(status_code=400, detail="Vendor code already exists")

    new_user = models.User(
        name=req.username,
        email=req.email,
        password_hash=get_password_hash(req.password),
        role=req.role.upper(),
        student_id=req.student_id if req.role.upper() == "STUDENT" else None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if req.role.upper() == "VENDOR":
        vendor_profile = models.Vendor(
            user_id=new_user.id,
            vendor_name=req.business_name,
            vendor_code=req.vendor_code,
        )
        db.add(vendor_profile)
        db.commit()

    return {"status": "SUCCESS", "message": "User created successfully", "user_id": str(new_user.id)}


@router.post("/manual-deduct")
def manual_deduct(
    req: schemas.ManualDeductRequest,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    user = (
        db.query(models.User)
        .filter(
            or_(
                models.User.email == req.user_identifier,
                models.User.student_id == req.user_identifier,
                models.User.name == req.user_identifier,
            )
        )
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.wallet_balance < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    user.wallet_balance -= req.amount
    txn = models.Transaction(
        sender_id=user.id,
        receiver_id=None,
        amount=req.amount,
        type="FEE",
        status="COMPLETED",
    )
    db.add(txn)
    db.commit()
    db.refresh(user)
    return {
        "status": "SUCCESS",
        "message": "Deducted from " + user.name,
        "new_balance": user.wallet_balance,
        "transaction_id": "txn-" + str(txn.id),
    }


@router.get("/student/{identifier}")
def get_student_profile(
    identifier: str,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    student = (
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
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    txns = (
        db.query(models.Transaction)
        .filter(or_(models.Transaction.sender_id == student.id, models.Transaction.receiver_id == student.id))
        .order_by(models.Transaction.timestamp.desc())
        .limit(20)
        .all()
    )
    fines = (
        db.query(models.Fine)
        .filter(models.Fine.user_id == student.id)
        .order_by(models.Fine.timestamp.desc())
        .all()
    )
    subs = (
        db.query(models.Subscription)
        .filter(models.Subscription.user_id == student.id, models.Subscription.is_active == True)
        .all()
    )

    return {
        "user": {
            "id": str(student.id),
            "name": student.name,
            "email": student.email,
            "student_id": student.student_id,
            "wallet_balance": student.wallet_balance,
            "created_at": student.created_at.isoformat() if student.created_at else None,
        },
        "transactions": [
            {
                "transaction_id": "txn-" + str(t.id),
                "type": t.type,
                "amount": -t.amount if str(t.sender_id) == str(student.id) else t.amount,
                "status": t.status,
                "timestamp": t.timestamp.isoformat() if t.timestamp else None,
            }
            for t in txns
        ],
        "fines": [
            {
                "fine_id": "fine-" + str(f.id),
                "amount": f.amount,
                "reason": f.reason,
                "status": f.status,
                "issued_at": f.timestamp.isoformat() if f.timestamp else None,
            }
            for f in fines
        ],
        "subscriptions": [
            {
                "subscription_id": "sub-" + str(s.id),
                "plan_name": s.plan_name,
                "amount": s.amount,
                "billing_cycle": s.billing_cycle,
                "next_billing_date": s.next_billing_date.isoformat() if s.next_billing_date else None,
            }
            for s in subs
        ],
    }


@router.get("/deduct-requests")
def list_deduct_requests(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    reqs = db.query(models.AdminDeductRequest).order_by(models.AdminDeductRequest.created_at.desc()).all()
    results = []
    for r in reqs:
        vendor_profile = db.query(models.Vendor).filter(models.Vendor.user_id == r.vendor_id).first()
        results.append({
            "id": str(r.id),
            "vendor_id": str(r.vendor_id),
            "vendor_name": vendor_profile.vendor_name if vendor_profile else str(r.vendor_id),
            "student_id": str(r.student_id),
            "student_name": r.student.name if r.student else None,
            "student_identifier": r.student.student_id if r.student else None,
            "amount": r.amount,
            "reason": r.reason,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "resolved_at": r.resolved_at.isoformat() if r.resolved_at else None,
        })
    return results


@router.post("/deduct-requests/{request_id}/approve")
def approve_deduct_request(
    request_id: UUID,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    from datetime import datetime as dt
    req = db.query(models.AdminDeductRequest).filter(models.AdminDeductRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Request already resolved")

    student = db.query(models.User).filter(models.User.id == req.student_id).first()
    if student.wallet_balance < req.amount:
        raise HTTPException(status_code=400, detail="Student has insufficient balance")

    vendor_user = db.query(models.User).filter(models.User.id == req.vendor_id).first()
    student.wallet_balance -= req.amount
    vendor_user.wallet_balance += req.amount
    req.status = "APPROVED"
    req.resolved_at = dt.utcnow()
    req.resolved_by = current_user["user_id"]

    txn = models.Transaction(
        sender_id=student.id,
        receiver_id=vendor_user.id,
        amount=req.amount,
        type="VENDOR_PAYMENT",
        status="COMPLETED",
    )
    db.add(txn)
    db.commit()
    return {
        "status": "SUCCESS",
        "message": "Deduct request approved and amount transferred",
        "transaction_id": "txn-" + str(txn.id),
    }


@router.post("/deduct-requests/{request_id}/reject")
def reject_deduct_request(
    request_id: UUID,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    from datetime import datetime as dt
    req = db.query(models.AdminDeductRequest).filter(models.AdminDeductRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Request already resolved")

    req.status = "REJECTED"
    req.resolved_at = dt.utcnow()
    req.resolved_by = current_user["user_id"]
    db.commit()
    return {"status": "SUCCESS", "message": "Deduct request rejected"}


@router.post("/subscriptions", status_code=201)
def create_subscription(
    req: schemas.AdminSubscriptionCreate,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    from datetime import datetime as dt, timedelta

    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    valid_cycles = {"WEEKLY", "MONTHLY", "SEMESTER"}
    if req.billing_cycle.upper() not in valid_cycles:
        raise HTTPException(status_code=400, detail="billing_cycle must be WEEKLY, MONTHLY, or SEMESTER")

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

    vendor_user = None
    if req.vendor_code:
        vendor = db.query(models.Vendor).filter(models.Vendor.vendor_code == req.vendor_code).first()
        if not vendor:
            raise HTTPException(status_code=404, detail="Vendor not found")
        vendor_user = db.query(models.User).filter(models.User.id == vendor.user_id).first()

    if req.immediate_charge and student.wallet_balance < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance for immediate charge")

    days_map = {"WEEKLY": 7, "MONTHLY": 30, "SEMESTER": 180}
    next_billing = dt.utcnow() + timedelta(days=days_map[req.billing_cycle.upper()])

    sub = models.Subscription(
        user_id=student.id,
        vendor_id=vendor_user.id if vendor_user else None,
        plan_name=req.plan_name,
        amount=req.amount,
        billing_cycle=req.billing_cycle.upper(),
        next_billing_date=next_billing,
        is_active=True,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    txn_id = None
    if req.immediate_charge:
        student.wallet_balance -= req.amount
        if vendor_user:
            vendor_user.wallet_balance += req.amount
        txn = models.Transaction(
            sender_id=student.id,
            receiver_id=vendor_user.id if vendor_user else None,
            amount=req.amount,
            type="SUB",
            status="COMPLETED",
        )
        db.add(txn)
        db.commit()
        txn_id = str(txn.id)

    return {
        "status": "SUCCESS",
        "message": "Subscription created",
        "subscription_id": "sub-" + str(sub.id),
        "transaction_id": "txn-" + txn_id if txn_id else None,
    }


@router.get("/subscriptions")
def list_subscriptions(
    current_user: dict = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    subs = db.query(models.Subscription).order_by(models.Subscription.is_active.desc()).all()
    results = []
    for s in subs:
        vendor_name = None
        if s.vendor_id:
            vp = db.query(models.Vendor).filter(models.Vendor.user_id == s.vendor_id).first()
            vendor_name = vp.vendor_name if vp else str(s.vendor_id)
        results.append({
            "subscription_id": "sub-" + str(s.id),
            "student_name":       s.user.name if s.user else None,
            "student_identifier": s.user.student_id if s.user else None,
            "plan_name":          s.plan_name,
            "amount":             s.amount,
            "billing_cycle":      s.billing_cycle,
            "next_billing_date":  s.next_billing_date.isoformat() if s.next_billing_date else None,
            "vendor_name":        vendor_name,
            "is_active":          s.is_active,
        })
    return results


@router.post("/subscriptions/{sub_id}/cancel")
def cancel_subscription(
    sub_id: str,
    current_user: dict = Depends(require_admin),
    db: Session = Depends(database.get_db),
):
    import uuid as _uuid
    try:
        sub_uuid = _uuid.UUID(sub_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid subscription ID")

    sub = db.query(models.Subscription).filter(models.Subscription.id == sub_uuid).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if not sub.is_active:
        raise HTTPException(status_code=400, detail="Subscription already cancelled")

    sub.is_active = False
    db.commit()
    return {"status": "SUCCESS", "message": "Subscription cancelled"}
