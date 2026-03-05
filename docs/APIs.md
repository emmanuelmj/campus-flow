# CampusFlow API Specification

All endpoints communicate using JSON over HTTPS. Authentication is handled via JWT bearer tokens. 
All protected routes verify the token and check for the correct `role` associated with the request (STUDENT, VENDOR, ADMIN).

---

## 1. Authentication APIs
Endpoints for user registration and login.

### `POST /auth/register`
Creates a new user account on the platform. Roles determine access levels.
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
* **Response:** (`201 Created`)
  ```json
  {
    "message": "User registered successfully",
    "user_id": 1
  }
  ```

### `POST /auth/login`
Authenticates a user and returns a JWT token for subsequent requests.
* **Request Body:**
  ```json
  {
    "email": "john@university.edu",
    "password": "securepassword"
  }
  ```
* **Response:** (`200 OK`)
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1...",
    "token_type": "bearer",
    "role": "STUDENT",
    "user_id": 1
  }
  ```

---

## 2. Student APIs
*Requires `Authorization: Bearer <token>` (Role: `STUDENT`)*

### `POST /wallet/top-up`
Simulates adding funds to a student's CampusFlow wallet.
* **Request Body:**
  ```json
  {
    "amount": 500.00
  }
  ```
* **Response:** (`200 OK`)
  ```json
  {
    "message": "Wallet topped up successfully",
    "new_balance": 1500.50
  }
  ```

### `GET /wallet`
Retrieves the student's current wallet balance and status.
* **Request Body:** None
* **Response:** (`200 OK`)
  ```json
  {
    "wallet_id": "w-12345",
    "balance": 1500.50,
    "currency": "INR",
    "status": "ACTIVE"
  }
  ```

### `GET /transactions`
Retrieves the student's entire transaction history (payments, transfers, fines, etc.).
* **Request Body:** None
* **Response:** (`200 OK`)
  ```json
  [
    {
      "transaction_id": "txn-987",
      "type": "VENDOR_PAYMENT",
      "amount": -150.00,
      "recipient": "canteen-01",
      "timestamp": "2026-03-05T10:30:00Z",
      "status": "COMPLETED"
    }
  ]
  ```

### `POST /transfer`
Initiates a peer-to-peer (P2P) transfer from the student to another student.
* **Request Body:**
  ```json
  {
    "recipient_identifier": "CS-2024-055",
    "amount": 250.00,
    "note": "Lunch split"
  }
  ```
* **Response:** (`200 OK`)
  ```json
  {
    "status": "SUCCESS",
    "transaction_id": "txn-988",
    "new_balance": 1250.50
  }
  ```

### `POST /pay-vendor`
Makes a direct payment to a campus vendor using their unique Vendor ID.
* **Request Body:**
  ```json
  {
    "vendor_id": "canteen-01",
    "amount": 120.00
  }
  ```
* **Response:** (`200 OK`)
  ```json
  {
    "status": "SUCCESS",
    "transaction_id": "txn-989",
    "new_balance": 1130.50
  }
  ```

### `POST /subscribe`
Subscribes the student to a recurring campus service or plan.
* **Request Body:**
  ```json
  {
    "service_id": "gym-monthly",
    "auto_renew": true
  }
  ```
* **Response:** (`200 OK`)
  ```json
  {
    "status": "SUCCESS",
    "message": "Subscribed to gym-monthly",
    "subscription_id": "sub-001"
  }
  ```

### `GET /student/payment-requests`
Views pending payment requests initiated by vendors.
* **Request Body:** None
* **Response:** (`200 OK`)
  ```json
  [
    {
      "request_id": "req-104",
      "vendor_id": "stationery-01",
      "amount": 45.00,
      "description": "Notebooks and pens",
      "status": "PENDING"
    }
  ]
  ```

### `POST /student/approve-payment/{request_id}`
Approves a pending vendor's payment request, deducting funds from the wallet.
* **Request Body:** None
* **Response:** (`200 OK`)
  ```json
  {
    "status": "SUCCESS",
    "message": "Payment request approved",
    "transaction_id": "txn-990",
    "new_balance": 1085.50
  }
  ```

### `GET /student/fines`
Views a list of all unpaid and paid administrative fines issued to the student.
* **Request Body:** None
* **Response:** (`200 OK`)
  ```json
  [
    {
      "fine_id": "fine-12",
      "amount": 50.00,
      "reason": "Library late return",
      "status": "UNPAID",
      "issued_at": "2026-03-04T09:00:00Z"
    }
  ]
  ```

### `POST /student/pay-fine/{fine_id}`
Pays a specific fine from the student's wallet balance.
* **Request Body:** None
* **Response:** (`200 OK`)
  ```json
  {
    "status": "SUCCESS",
    "message": "Fine paid successfully",
    "new_balance": 1035.50
  }
  ```

---

## 3. Vendor APIs
*Requires `Authorization: Bearer <token>` (Role: `VENDOR`)*

### `POST /vendor/request-payment`
Initiates a payment charge (request) to a specific student's app.
* **Request Body:**
  ```json
  {
    "student_identifier": "CS-2024-001",
    "amount": 45.00,
    "description": "Stationery supplies"
  }
  ```
* **Response:** (`200 OK`)
  ```json
  {
    "status": "SUCCESS",
    "request_id": "req-104",
    "message": "Payment request sent to student"
  }
  ```

### `GET /vendor/transactions`
Retrieves the vendor's transaction ledger / received payments history.
* **Request Body:** None
* **Response:** (`200 OK`)
  ```json
  [
    {
      "transaction_id": "txn-989",
      "sender_id": "CS-2024-001",
      "amount": 120.00,
      "timestamp": "2026-03-05T12:00:00Z",
      "status": "COMPLETED"
    }
  ]
  ```

---

## 4. Admin APIs
*Requires `Authorization: Bearer <token>` (Role: `ADMIN`)*

### `POST /admin/create-vendor`
Registers a new campus vendor profile onto the system.
* **Request Body:**
  ```json
  {
    "business_name": "Main Canteen",
    "vendor_id": "canteen-01",
    "contact_email": "canteen@university.edu"
  }
  ```
* **Response:** (`201 Created`)
  ```json
  {
    "status": "SUCCESS",
    "message": "Vendor created successfully",
    "vendor_user_id": 42
  }
  ```

### `GET /admin/vendors`
Lists all active vendors on the campus.
* **Request Body:** None
* **Response:** (`200 OK`)
  ```json
  [
    {
      "vendor_id": "canteen-01",
      "business_name": "Main Canteen",
      "created_at": "2026-02-14T08:00:00Z"
    }
  ]
  ```

### `POST /admin/add-fine`
Issues a monetary fine to a specific student.
* **Request Body:**
  ```json
  {
    "student_identifier": "CS-2024-001",
    "amount": 50.00,
    "reason": "Library late return",
    "force_deduct": false
  }
  ```
* **Response:** (`200 OK`)
  ```json
  {
    "status": "SUCCESS",
    "fine_id": "fine-12",
    "message": "Fine issued"
  }
  ```

### `GET /admin/users`
Lists all registered users (students, vendors, admins) inside the system.
* **Request Body:** None
* **Response:** (`200 OK`)
  ```json
  [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@university.edu",
      "role": "STUDENT",
      "student_id": "CS-2024-001",
      "created_at": "2026-01-10T14:22:00Z"
    }
  ]
  ```

### `GET /admin/transactions`
Retrieves a complete global ledger of all campus transactions for oversight.
* **Request Body:** None
* **Response:** (`200 OK`)
  ```json
  [
    {
      "transaction_id": "txn-989",
      "sender_id": 1,
      "receiver_id": 42,
      "type": "VENDOR_PAYMENT",
      "amount": 120.00,
      "timestamp": "2026-03-05T12:00:00Z",
      "status": "COMPLETED"
    }
  ]
  ```
