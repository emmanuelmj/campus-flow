# Backend Setup Guide

This guide is for frontend developers to set up and run the FastAPI backend locally so they can connect their Next.js dashboards.

## Prerequisites
- Python 3.10+
- Docker & Docker Compose (for PostgreSQL)

## 1. Setup Database
Start the PostgreSQL database:
```bash
docker rm -f campusflow-postgres
docker run --name campusflow-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=campusflow -p 5432:5432 -d postgres:15
```

## 2. Install Dependencies
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

## 3. Environment Variables
Create a `.env` file inside the `backend/` folder:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/campusflow
SECRET_KEY=yoursecretkeyhere
```

## 4. Run the Server
```bash
# Ensure you are still inside the backend/ directory with venv activated
uvicorn app.main:app --reload
```

## API Testing
Once running, open your browser and go to:
[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

You’ll see the Swagger UI where you can test all the endpoints.

**Note:** On the first run, the SQLAlchemy engine will automatically create all tables based on `models/__init__.py`. 
