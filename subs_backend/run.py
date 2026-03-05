SCHEMA_PATH = "C:/Users/Aditya/OneDrive/Desktop/CF/campus-flow/backend/app/schemas/__init__.py"
ADMIN_PATH  = "C:/Users/Aditya/OneDrive/Desktop/CF/campus-flow/backend/app/routers/admin.py"

schema_addition = """
class AdminSubscriptionCreate(BaseModel):
    student_identifier: str       # email, student_id, or name
    plan_name:          str
    amount:             float
    billing_cycle:      str            # WEEKLY, MONTHLY, SEMESTER
    vendor_code:        Optional[str] = None
    immediate_charge:   bool = True    # deduct first billing immediately
"""

admin_addition = """

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
"""

with open(SCHEMA_PATH, "a", encoding="utf-8") as f:
    f.write(schema_addition)
print("1. schemas/__init__.py updated")

with open(ADMIN_PATH, "a", encoding="utf-8") as f:
    f.write(admin_addition)
print("2. admin.py updated")
