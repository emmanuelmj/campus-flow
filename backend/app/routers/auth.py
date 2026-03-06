from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app import database, models, schemas
from app.utils.security import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    # 1. Check for duplicate email
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Check for duplicate student_id (if student)
    if user.role.upper() == "STUDENT" and user.student_id:
        if db.query(models.User).filter(models.User.student_id == user.student_id).first():
            raise HTTPException(status_code=400, detail="Student ID already registered")

    # 3. Validate role
    valid_roles = {"STUDENT", "VENDOR", "ADMIN"}
    if user.role.upper() not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of {valid_roles}")

    # 4. Create user
    new_user = models.User(
        name=user.username,
        email=user.email,
        password_hash=get_password_hash(user.password),
        role=user.role.upper(),
        student_id=user.student_id if user.role.upper() == "STUDENT" else None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully", "user_id": str(new_user.id)}


@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.LoginRequest, db: Session = Depends(database.get_db)):
    # 1. Look up user
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()

    # 2. Verify password
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid email or password",
        )

    # 3. Build JWT with user_id and role
    role_str = user.role.value if hasattr(user.role, "value") else str(user.role)
    access_token = create_access_token(data={"user_id": str(user.id), "role": role_str})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role_str,
        "user_id": str(user.id),
        "student_id": user.student_id if hasattr(user, 'student_id') else None,
    }
