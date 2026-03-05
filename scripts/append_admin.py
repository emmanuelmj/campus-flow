
ADMIN_PATH = "C:/Users/Aditya/OneDrive/Desktop/CF/campus-flow/backend/app/routers/admin.py"
VENDOR_PATH = "C:/Users/Aditya/OneDrive/Desktop/CF/campus-flow/backend/app/routers/vendor.py"

admin_addition = r"""

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
"""

vendor_addition = r"""

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
"""

with open(ADMIN_PATH, "a") as f:
    f.write(admin_addition)
print("admin.py updated")

with open(VENDOR_PATH, "a") as f:
    f.write(vendor_addition)
print("vendor.py updated")
