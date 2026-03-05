import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load env vars from .env file
load_dotenv()

# ─── Read and validate DATABASE_URL ────────────────────────────────────────────
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError(
        "DATABASE_URL is not set. "
        "Create a .env file in backend/ with: "
        "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/campusflow"
    )

# ─── Engine with production-grade connection pooling ───────────────────────────
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=10,         # steady-state connections kept open
    max_overflow=20,      # burst connections above pool_size
    pool_pre_ping=True,   # verify connections are alive before checkout
)

# ─── Session factory ───────────────────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ─── Declarative base for ORM models ──────────────────────────────────────────
Base = declarative_base()


# ─── FastAPI dependency ────────────────────────────────────────────────────────
def get_db():
    """Yields a DB session and ensures it is closed after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
