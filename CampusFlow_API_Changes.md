**CampusFlow**

Backend API Changes \-- Developer Handoff

March 05, 2026

# **1\. Overview**

This document describes all new backend endpoints, models, and schemas added as part of the latest feature sprint for the CampusFlow admin and vendor dashboards. No existing endpoints were modified \-- all changes are purely additive.

* 4 new features implemented across Admin and Vendor roles  
* 8 new API endpoints total  
* 1 new database table: admin\_deduct\_requests  
* 3 new Pydantic request schemas

# **2\. New Database Model**

## **AdminDeductRequest**

Stores deduct requests submitted by vendors. Admin reviews and approves or rejects them. Table name: admin\_deduct\_requests

class AdminDeductRequest(Base):  
    \_\_tablename\_\_ \= 'admin\_deduct\_requests'

    id          \= Column(UUID, primary\_key=True, default=uuid.uuid4)  
    vendor\_id   \= Column(UUID, ForeignKey('users.id'))  
    student\_id  \= Column(UUID, ForeignKey('users.id'))  
    amount      \= Column(Float, nullable=False)  
    reason      \= Column(String, nullable=False)  
    status      \= Column(String, default='PENDING')  \# PENDING | APPROVED | REJECTED  
    created\_at  \= Column(DateTime, default=datetime.utcnow)  
    resolved\_at \= Column(DateTime, nullable=True)  
    resolved\_by \= Column(UUID, ForeignKey('users.id'), nullable=True)

    vendor   \= relationship('User', foreign\_keys=\[vendor\_id\])  
    student  \= relationship('User', foreign\_keys=\[student\_id\])  
    resolver \= relationship('User', foreign\_keys=\[resolved\_by\])

IMPORTANT: This table is new and must be created via migration (or recreate the DB in dev). Run alembic autogenerate or ensure Base.metadata.create\_all() is called on startup.

**Status lifecycle:** PENDING \-\> APPROVED or REJECTED. Once resolved, the record is immutable.

# **3\. New Pydantic Schemas**

File: backend/app/schemas/\_\_init\_\_.py

### **AdminUserCreate**

Used by POST /admin/create-user to create any user type.

class AdminUserCreate(BaseModel):  
    username:      str  
    email:         str  
    password:      str  
    role:          str            \# 'STUDENT' | 'VENDOR' | 'ADMIN'  
    student\_id:    Optional\[str\]  \# required when role \== STUDENT  
    vendor\_code:   Optional\[str\]  \# required when role \== VENDOR  
    business\_name: Optional\[str\]  \# required when role \== VENDOR

### **ManualDeductRequest**

Used by POST /admin/manual-deduct.

class ManualDeductRequest(BaseModel):  
    user\_identifier: str    \# email, student\_id, or name  
    amount:          float  
    reason:          str

### **AdminDeductRequestCreate**

Used by POST /vendor/request-admin-deduct.

class AdminDeductRequestCreate(BaseModel):  
    student\_identifier: str   \# email, student\_id, or name  
    amount:             float  
    reason:             str

# **4\. New Admin Endpoints**

All endpoints require:  Authorization: Bearer \<admin\_jwt\_token\>

## **4.1  Create User**

 **POST   /admin/create-user**   \-   Create a STUDENT, VENDOR, or ADMIN account

**Request body (JSON):**

{  
  "username":      "Alice Smith",  
  "email":         "alice@campus.edu",  
  "password":      "securepass123",  
  "role":          "STUDENT",  
  "student\_id":    "CS-2024-042",      // only for STUDENT  
  "vendor\_code":   "VND-001",          // only for VENDOR  
  "business\_name": "Campus Canteen"    // only for VENDOR  
}

**Success response (201):**

{ "status": "SUCCESS", "message": "User created successfully", "user\_id": "\<uuid\>" }

**Notes:**

* For VENDOR role, a vendor\_profiles row is also created automatically.  
* Duplicate email or student\_id/vendor\_code returns 400\.  
* role is case-insensitive.

## **4.2  Manual Wallet Deduction**

 **POST   /admin/manual-deduct**   \-   Deduct an amount from any user's wallet

**Request body (JSON):**

{  
  "user\_identifier": "CS-2024-042",  // email, student\_id, or name  
  "amount":          250.00,  
  "reason":          "Library fine"  
}

**Success response (200):**

{  
  "status":         "SUCCESS",  
  "message":        "Deducted from Alice Smith",  
  "new\_balance":    750.00,  
  "transaction\_id": "txn-\<uuid\>"  
}

**Notes:**

* Creates a Transaction with type='FEE', status='COMPLETED', receiver\_id=NULL.  
* Returns 400 if amount \<= 0 or insufficient balance.  
* Returns 404 if user\_identifier matches no user.

## **4.3  Student Profile Lookup**

 **GET   /admin/student/{identifier}**   \-   Full profile of a student

**Path parameter:**

* {identifier} \-- student\_id (e.g. CS-2024-042), email, or name

**Success response (200):**

{  
  "user": { "id": "\<uuid\>", "name": "Alice", "email": "...",  
             "student\_id": "CS-2024-042", "wallet\_balance": 750.0,  
             "created\_at": "2025-01-15T10:30:00" },  
  "transactions": \[  
    { "transaction\_id": "txn-...", "type": "FEE",  
      "amount": \-250.0, "status": "COMPLETED", "timestamp": "..." }  
  \],  
  "fines": \[  
    { "fine\_id": "fine-...", "amount": 50.0, "reason": "Late return",  
      "status": "UNPAID", "issued\_at": "..." }  
  \],  
  "subscriptions": \[  
    { "subscription\_id": "sub-...", "plan\_name": "Meal Plan",  
      "amount": 500.0, "billing\_cycle": "MONTHLY",  
      "next\_billing\_date": "2025-02-01" }  
  \]  
}

**Notes:**

* Transaction amounts are signed: negative \= outflow from student, positive \= inflow.  
* Returns up to 20 most recent transactions, newest first.  
* Only active subscriptions (is\_active=True) are returned.

## **4.4  List Deduct Requests**

 **GET   /admin/deduct-requests**   \-   List all vendor deduct requests (all statuses)

**Success response (200) \-- array:**

\[  
  {  
    "id":                 "\<uuid\>",  
    "vendor\_id":          "\<uuid\>",  
    "vendor\_name":        "Campus Canteen",  
    "student\_id":         "\<uuid\>",  
    "student\_name":       "Alice Smith",  
    "student\_identifier": "CS-2024-042",  
    "amount":             150.0,  
    "reason":             "Monthly meal dues",  
    "status":             "PENDING",  
    "created\_at":         "2025-01-20T09:00:00",  
    "resolved\_at":        null  
  }  
\]

## **4.5  Approve Deduct Request**

 **POST   /admin/deduct-requests/{request\_id}/approve**   \-   Approve and execute transfer

**What happens on approval:**

* student.wallet\_balance \-= amount  
* vendor\_user.wallet\_balance \+= amount  
* Request status \-\> APPROVED, resolved\_at and resolved\_by are populated  
* Transaction created: type='VENDOR\_PAYMENT', sender=student, receiver=vendor

**Success response (200):**

{  
  "status":         "SUCCESS",  
  "message":        "Deduct request approved and amount transferred",  
  "transaction\_id": "txn-\<uuid\>"  
}

* Returns 400 if request is not PENDING or student has insufficient balance.

## **4.6  Reject Deduct Request**

 **POST   /admin/deduct-requests/{request\_id}/reject**   \-   Reject without any transfer

No money moves. Status is set to REJECTED, resolved\_at and resolved\_by are populated.

**Success response (200):**

{ "status": "SUCCESS", "message": "Deduct request rejected" }

# **5\. New Vendor Endpoints**

All endpoints require:  Authorization: Bearer \<vendor\_jwt\_token\>

## **5.1  Submit Deduct Request to Admin**

 **POST   /vendor/request-admin-deduct**   \-   Ask admin to deduct student wallet for dues

**Request body (JSON):**

{  
  "student\_identifier": "CS-2024-042",  // email, student\_id, or name  
  "amount":             150.00,  
  "reason":             "Monthly meal dues Jan 2025"  
}

**Success response (200):**

{  
  "status":     "SUCCESS",  
  "request\_id": "\<uuid\>",  
  "message":    "Deduct request sent to admin for approval"  
}

**Notes:**

* Creates a new AdminDeductRequest with status=PENDING. No money moves yet.  
* Returns 404 if student\_identifier matches no student.  
* Returns 400 if amount \<= 0\.

## **5.2  List Own Deduct Requests**

 **GET   /vendor/deduct-requests**   \-   List this vendor's submitted deduct requests

**Success response (200) \-- array:**

\[  
  {  
    "id":                 "\<uuid\>",  
    "student\_name":       "Alice Smith",  
    "student\_identifier": "CS-2024-042",  
    "amount":             150.0,  
    "reason":             "Monthly meal dues Jan 2025",  
    "status":             "PENDING",  
    "created\_at":         "2025-01-20T09:00:00",  
    "resolved\_at":        null  
  }  
\]

# **6\. Authentication**

All new endpoints use Bearer JWT auth \-- same as existing endpoints. No changes to auth flow.

Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

* Admin endpoints reject non-ADMIN tokens with 403\.  
* Vendor endpoints reject non-VENDOR tokens with 403\.  
* Token expiry: 300 minutes (unchanged).

# **7\. Error Reference**

| HTTP Status | Error detail | Endpoint(s) |
| :---- | :---- | :---- |
| **400** | Invalid role | POST /admin/create-user |
| **400** | Email already registered | POST /admin/create-user |
| **400** | Student ID already registered | POST /admin/create-user |
| **400** | vendor\_code and business\_name required | POST /admin/create-user |
| **400** | Vendor code already exists | POST /admin/create-user |
| **400** | Amount must be positive | POST /admin/manual-deduct, /vendor/request-admin-deduct |
| **400** | Insufficient balance | POST /admin/manual-deduct |
| **400** | Student has insufficient balance | POST /admin/deduct-requests/{id}/approve |
| **400** | Request already resolved | POST /admin/deduct-requests/{id}/approve|reject |
| **404** | User not found | POST /admin/manual-deduct |
| **404** | Student not found | GET /admin/student/{id}, /vendor/request-admin-deduct |
| **404** | Request not found | POST /admin/deduct-requests/{id}/approve|reject |

# **8\. Transaction Type Reference**

| type | Description |
| :---- | :---- |
| **P2P** | Student-to-student transfer |
| **VENDOR\_PAYMENT** | Payment to a vendor (direct or via deduct request approval) |
| **SUB** | Subscription billing |
| **FINE** | Fine issued by admin (money leaves system) |
| **FEE** | Manual deduction by admin (money leaves system) |
| **TOP\_UP** | Wallet top-up |

# **9\. Migration / Setup Note**

**The admin\_deduct\_requests table is brand new and must be created before starting the server.**

* Dev (SQLite): Ensure Base.metadata.create\_all(bind=engine) is called in main.py on startup.  
* Prod (PostgreSQL): Run alembic revision \--autogenerate \-m 'add\_admin\_deduct\_requests' then alembic upgrade head

No existing tables were altered. All other migrations remain valid.

CampusFlow  |  Invenza'26 Hackathon  |  Confidential