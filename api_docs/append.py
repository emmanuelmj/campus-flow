PATH = "C:/Users/Aditya/OneDrive/Desktop/CF/campus-flow/docs/APIs.md"

addition = """
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
"""

with open(PATH, "a", encoding="utf-8") as f:
    f.write(addition)
print("Done - APIs.md updated")
