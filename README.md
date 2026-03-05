# CampusFlow Hackathon Starter

This repository contains the complete scaffolding for **CampusFlow**, built for Invenza'26.

## Folder Structure

* `backend/`: FastAPI + PostgreSQL backend.
* `mobile-app/`: React Native (Expo) app for students.
* `admin-dashboard/`: Next.js portal for campus administration.
* `vendor-dashboard/`: Next.js portal for campus vendors.

## 1. Running the Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # (or venv\Scripts\activate on Windows)
pip install -r requirements.txt
uvicorn app.main:app --reload
```
API runs on `http://localhost:8000`. Swagger UI at `http://localhost:8000/docs`.

## 2. Running the Mobile App
```bash
cd mobile-app
npm install
npx expo start
```

## 3. Running Admin Dashboard
```bash
cd admin-dashboard
npm install
npm run dev
```
Runs on `http://localhost:3000`.

## 4. Running Vendor Dashboard
```bash
cd vendor-dashboard
npm install
npm run dev
```
Runs on `http://localhost:3001`.

## Example API Test (Using cURL)
```bash
curl -X POST "http://localhost:8000/auth/register" \
     -H "Content-Type: application/json" \
     -d '{"name":"Alice","email":"alice@uni.edu","password":"pass","role":"STUDENT"}'

curl -X GET "http://localhost:8000/wallet"
```
