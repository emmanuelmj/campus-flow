# CampusFlow Backend

FastAPI backend for CampusFlow. 

## Setup
1. `python -m venv venv`
2. `source venv/bin/activate` or `venv\Scripts\activate` on Windows
3. `pip install -r requirements.txt`
4. Create `.env` file with `DATABASE_URL` and `SECRET_KEY`.
5. Run server: `uvicorn app.main:app --reload`
