# CampusFlow API Specification

All endpoints communicate using JSON over HTTPS. Authentication is handled via JWT bearer tokens.

---

## 1. Authentication APIs

### `POST /auth/register`
Creates a new user account (Student/Vendor/Admin).
* **Request Body:**
  ```json
  {
    "username": "johndoe",
    "email": "john@university.edu",
    "password": "securepassword",
    "role": "STUDENT",
    "student_id": "CS-2024-001"
  }
  ```
* **Response:** `201 Created`

### `POST /auth/login`
Authenticates a user and returns a JWT token.
* **Request Body:**
  ```json
  {
    "email": "john@university.edu",
    "password": "securepassword"
  }
  ```
* **Response:** `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1...",
    "token_type": "bearer",
    "role": "STUDENT"
  }
  ```

---

## 2. Student APIs
*Requires `Authorization: Bearer <token>` (Role: `STUDENT`)*

### `GET /wallet`
Retrieves current wallet balance and status.
* **Response:** `200 OK`
  ```json
  {
    "wallet_id": "w-12345",
    "balance": 1500.50,
    "currency": "INR",
    "status": "ACTIVE"
  }
  ```

### `GET /transactions`
Retrieves the user's transaction history.
* **Response:** `200 OK`
  ```json
  [
    {
      "transaction_id": "txn-987",
      "type": "VENDOR_PAYMENT",
      "amount": -150.00,
      "recipient": "canteen-01",
      "timestamp": "2026-03-05T10:30:00Z"
    }
  ]
  ```

### `POST /transfer`
Initiates a P2P transfer to another student.
* **Request Body:**
  ```json
  {
    "recipient_identifier": "CS-2024-055",
    "amount": 250.00,
    "note": "Lunch split"
  }
  ```
* **Response:** `200 OK`
  ```json
  {
    "status": "SUCCESS",
    "transaction_id": "txn-988",
    "new_balance": 1250.50
  }
  ```

### `POST /pay-vendor`
Pays a campus vendor using their Vendor ID.
* **Request Body:**
  ```json
  {
    "vendor_id": "canteen-01",
    "amount": 120.00
  }
  ```
* **Response:** `200 OK`
  ```json
  {
    "status": "SUCCESS",
    "transaction_id": "txn-989",
    "new_balance": 1130.50
  }
  ```

### `POST /subscribe`
Subscribes to a recurring campus service.
* **Request Body:**
  ```json
  {
    "service_id": "gym-monthly",
    "auto_renew": true
  }
  ```
* **Response:** `200 OK`

---

## 3. Vendor APIs
*Requires `Authorization: Bearer <token>` (Role: `VENDOR`)*

### `POST /vendor/request-payment`
Sends a payment request to a specific student's app.
* **Request Body:**
  ```json
  {
    "student_identifier": "CS-2024-001",
    "amount": 45.00,
    "description": "Stationery supplies"
  }
  ```
* **Response:** `200 OK`

### `GET /vendor/transactions`
Retrieves daily transaction ledger for the vendor.
* **Response:** `200 OK`
  ```json
  [
    {
      "transaction_id": "txn-989",
      "sender_id": "CS-2024-001",
      "amount": 120.00,
      "timestamp": "2026-03-05T12:00:00Z"
    }
  ]
  ```

---

## 4. Admin APIs
*Requires `Authorization: Bearer <token>` (Role: `ADMIN`)*

### `POST /admin/create-vendor`
Registers a new vendor onto the platform.
* **Request Body:**
  ```json
  {
    "business_name": "Main Canteen",
    "vendor_id": "canteen-01",
    "contact_email": "canteen@university.edu"
  }
  ```
* **Response:** `201 Created`

### `POST /admin/add-fine`
Triggers the AutoPay system to deduct a fine from a student.
* **Request Body:**
  ```json
  {
    "student_id": "CS-2024-001",
    "amount": 50.00,
    "reason": "Library late return",
    "force_deduct": true
  }
  ```
* **Response:** `200 OK`
  ```json
  {
    "status": "SUCCESS",
    "deducted": 50.00
  }
  ```

### `GET /admin/transactions`
Retrieves a global ledger of all campus transactions.
* **Response:** `200 OK` (Paginated list of transactions)

### `GET /admin/users`
Retrieves a list of all registered users, students, and vendors.
* **Response:** `200 OK`
