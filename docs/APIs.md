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
    "user_id": "123e4567-e89b-12d3-a456-426614174000"
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
    "user_id": "123e4567-e89b-12d3-a456-426614174000"
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
    "wallet_id": "w-123e4567-e89b-12d3-a456-426614174000",
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
      "transaction_id": "txn-987e4567-e89b-12d3-a456-426614174000",
      "type": "VENDOR_PAYMENT",
      "amount": -150.00,
      "sender_id": "123e4567-e89b-12d3-a456-426614174000",
      "receiver_id": "456e4567-e89b-12d3-a456-426614174001",
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
    "transaction_id": "txn-988e4567-e89b-12d3-a456-426614174000",
    "new_balance": 1250.50
  }
  ```

### `POST /pay-vendor`
Makes a direct payment to a campus vendor using their unique Vendor ID code.
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
    "transaction_id": "txn-989e4567-e89b-12d3-a456-426614174000",
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
    "subscription_id": "sub-001e4567-e89b-12d3-a456-426614174000"
  }
  ```

### `GET /student/payment-requests`
Views pending payment requests initiated by vendors for the student.
* **Request Body:** None
* **Response:** (`200 OK`)
  ```json
  [
    {
      "request_id": "req-104e4567-e89b-12d3-a456-426614174000",
      "vendor_id": "stationery-01",
      "amount": 45.00,
      "description": "Notebooks and pens",
      "status": "PENDING"
    }
  ]
  ```

### `POST /student/approve-payment/{request_id}`
Approves a pending vendor's payment request, deducting funds from the wallet. `request_id` must be a valid UUID.
* **Request Body:** None
* **Response:** (`200 OK`)
  ```json
  {
    "status": "SUCCESS",
    "message": "Payment request approved",
    "transaction_id": "txn-990e4567-e89b-12d3-a456-426614174000",
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
      "fine_id": "fine-123e4567-e89b-12d3-a456-426614174000",
      "amount": 50.00,
      "reason": "Library late return",
      "status": "UNPAID",
      "issued_at": "2026-03-04T09:00:00Z"
    }
  ]
  ```

### `POST /student/pay-fine/{fine_id}`
Pays a specific fine from the student's wallet balance. `fine_id` must be a valid UUID.
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
    "request_id": "req-104e4567-e89b-12d3-a456-426614174000",
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
      "transaction_id": "txn-989e4567-e89b-12d3-a456-426614174000",
      "sender_id": "123e4567-e89b-12d3-a456-426614174000",
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
    "vendor_user_id": "456e4567-e89b-12d3-a456-426614174001"
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
      "user_id": "456e4567-e89b-12d3-a456-426614174001",
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
    "fine_id": "fine-123e4567-e89b-12d3-a456-426614174000",
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
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "John Doe",
      "email": "john@university.edu",
      "role": "STUDENT",
      "wallet_balance": 1500.50,
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
      "transaction_id": "txn-989e4567-e89b-12d3-a456-426614174000",
      "sender_id": "123e4567-e89b-12d3-a456-426614174000",
      "receiver_id": "456e4567-e89b-12d3-a456-426614174001",
      "type": "VENDOR_PAYMENT",
      "amount": 120.00,
      "timestamp": "2026-03-05T12:00:00Z",
      "status": "COMPLETED"
    }
  ]
  ```

---

## 5. New Admin APIs *(Sprint 2)*
*Requires `Authorization: Bearer <token>` (Role: `ADMIN`)*

### `POST /admin/create-user`
Creates a new user account of any role (STUDENT, VENDOR, or ADMIN). For VENDOR role, also creates a vendor profile automatically.
* **Request Body:**
  ```json
  {
    "username":      "Alice Smith",
    "email":         "alice@campus.edu",
    "password":      "securepass123",
    "role":          "STUDENT",
    "student_id":    "CS-2024-042",
    "vendor_code":   "VND-001",
    "business_name": "Campus Canteen"
  }
  ```
  > `student_id` required when `role = STUDENT`. `vendor_code` and `business_name` required when `role = VENDOR`.
* **Response:** (`201 Created`)
  ```json
  { "status": "SUCCESS", "message": "User created successfully", "user_id": "<uuid>" }
  ```

---

### `POST /admin/manual-deduct`
Manually deducts an amount from any user's wallet. Creates a `FEE` transaction (money leaves the system).
* **Request Body:**
  ```json
  {
    "user_identifier": "CS-2024-042",
    "amount":          250.00,
    "reason":          "Library fine"
  }
  ```
  > `user_identifier` can be email, student_id, or name.
* **Response:** (`200 OK`)
  ```json
  {
    "status":         "SUCCESS",
    "message":        "Deducted from Alice Smith",
    "new_balance":    750.00,
    "transaction_id": "txn-<uuid>"
  }
  ```

---

### `GET /admin/student/{identifier}`
Returns a full profile for a student: personal info, last 20 transactions, all fines, and active subscriptions.
* **Path Param:** `identifier` — student_id, email, or name
* **Response:** (`200 OK`)
  ```json
  {
    "user": {
      "id": "<uuid>", "name": "Alice", "email": "alice@campus.edu",
      "student_id": "CS-2024-042", "wallet_balance": 750.0,
      "created_at": "2025-01-15T10:30:00"
    },
    "transactions": [
      { "transaction_id": "txn-...", "type": "FEE", "amount": -250.0, "status": "COMPLETED", "timestamp": "..." }
    ],
    "fines": [
      { "fine_id": "fine-...", "amount": 50.0, "reason": "Late return", "status": "UNPAID", "issued_at": "..." }
    ],
    "subscriptions": [
      { "subscription_id": "sub-...", "plan_name": "Meal Plan", "amount": 500.0, "billing_cycle": "MONTHLY", "next_billing_date": "..." }
    ]
  }
  ```
  > Transaction amounts are signed: negative = outflow from student, positive = inflow. Only active subscriptions returned.

---

### `GET /admin/deduct-requests`
Lists all vendor-submitted deduct requests across all statuses (PENDING, APPROVED, REJECTED).
* **Response:** (`200 OK`)
  ```json
  [
    {
      "id":                 "<uuid>",
      "vendor_id":          "<uuid>",
      "vendor_name":        "Campus Canteen",
      "student_id":         "<uuid>",
      "student_name":       "Alice Smith",
      "student_identifier": "CS-2024-042",
      "amount":             150.0,
      "reason":             "Monthly meal dues",
      "status":             "PENDING",
      "created_at":         "2025-01-20T09:00:00",
      "resolved_at":        null
    }
  ]
  ```

---

### `POST /admin/deduct-requests/{request_id}/approve`
Approves a PENDING deduct request. Deducts from the student's wallet and credits the vendor. Creates a `VENDOR_PAYMENT` transaction.
* **Path Param:** `request_id` — UUID of the deduct request
* **Response:** (`200 OK`)
  ```json
  { "status": "SUCCESS", "message": "Deduct request approved and amount transferred", "transaction_id": "txn-<uuid>" }
  ```
  > Returns `400` if already resolved or student has insufficient balance.

---

### `POST /admin/deduct-requests/{request_id}/reject`
Rejects a PENDING deduct request. No money moves.
* **Path Param:** `request_id` — UUID of the deduct request
* **Response:** (`200 OK`)
  ```json
  { "status": "SUCCESS", "message": "Deduct request rejected" }
  ```

---

### `POST /admin/subscriptions`
Creates a recurring subscription for a student. Optionally charges the first billing immediately.
* **Request Body:**
  ```json
  {
    "student_identifier": "CS-2024-042",
    "plan_name":          "Meal Plan - Standard",
    "amount":             500.00,
    "billing_cycle":      "MONTHLY",
    "vendor_code":        "canteen-01",
    "immediate_charge":   true
  }
  ```
  > `billing_cycle` accepts: `WEEKLY`, `MONTHLY`, `SEMESTER`. `vendor_code` is optional. `immediate_charge` defaults to `true`.
* **Response:** (`201 Created`)
  ```json
  {
    "status":          "SUCCESS",
    "message":         "Subscription created",
    "subscription_id": "sub-<uuid>",
    "transaction_id":  "txn-<uuid>"
  }
  ```

---

### `GET /admin/subscriptions`
Lists all subscriptions (active and cancelled) with student and vendor details.
* **Response:** (`200 OK`)
  ```json
  [
    {
      "subscription_id":   "sub-<uuid>",
      "student_name":       "Alice Smith",
      "student_identifier": "CS-2024-042",
      "plan_name":          "Meal Plan - Standard",
      "amount":             500.0,
      "billing_cycle":      "MONTHLY",
      "next_billing_date":  "2025-02-01T00:00:00",
      "vendor_name":        "Main Canteen",
      "is_active":          true
    }
  ]
  ```

---

### `POST /admin/subscriptions/{sub_id}/cancel`
Cancels an active subscription. No refund is issued.
* **Path Param:** `sub_id` — UUID of the subscription (without the `sub-` prefix)
* **Response:** (`200 OK`)
  ```json
  { "status": "SUCCESS", "message": "Subscription cancelled" }
  ```

---

## 6. New Vendor APIs *(Sprint 2)*
*Requires `Authorization: Bearer <token>` (Role: `VENDOR`)*

### `POST /vendor/request-admin-deduct`
Submits a deduct request to admin to collect dues from a student's wallet. No money moves until admin approves.
* **Request Body:**
  ```json
  {
    "student_identifier": "CS-2024-042",
    "amount":             150.00,
    "reason":             "Monthly meal dues Jan 2025"
  }
  ```
  > `student_identifier` can be email, student_id, or name.
* **Response:** (`200 OK`)
  ```json
  {
    "status":     "SUCCESS",
    "request_id": "<uuid>",
    "message":    "Deduct request sent to admin for approval"
  }
  ```

---

### `GET /vendor/deduct-requests`
Lists all deduct requests submitted by the authenticated vendor.
* **Response:** (`200 OK`)
  ```json
  [
    {
      "id":                 "<uuid>",
      "student_name":       "Alice Smith",
      "student_identifier": "CS-2024-042",
      "amount":             150.0,
      "reason":             "Monthly meal dues Jan 2025",
      "status":             "PENDING",
      "created_at":         "2025-01-20T09:00:00",
      "resolved_at":        null
    }
  ]
  ```

---

## Transaction Type Reference

| Type | Description |
|------|-------------|
| `P2P` | Student-to-student transfer |
| `VENDOR_PAYMENT` | Payment to a vendor (direct or via deduct request approval) |
| `SUB` | Subscription billing charge |
| `FINE` | Fine issued by admin (money leaves system) |
| `FEE` | Manual deduction by admin (money leaves system) |
| `TOP_UP` | Wallet top-up |
