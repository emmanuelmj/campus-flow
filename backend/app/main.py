from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import database, models
from app.routers import auth, student, vendor, admin

# Create tables for dev/hackathon environment
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="CampusFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(student.router)
app.include_router(vendor.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to CampusFlow API. Go to /docs for Swagger UI"}
