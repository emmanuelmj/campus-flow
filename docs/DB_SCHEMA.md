# CampusFlow Database Schema

> **Status:** ✅ Implemented & Live (PostgreSQL via Docker)
> **Last updated:** 2026-03-05 — Phase 1 Backend complete

All primary and foreign keys use **UUID** (`uuid4`). The database is managed via SQLAlchemy ORM
with `create_all` on startup (hackathon mode). All tables are live in the `campusflow` PostgreSQL database.

---

## 1. Users Table
Handles authentication and core balances for ALL roles (Student, Vendor, Admin).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Unique identifier (uuid4) |
| `name` | String | Not Null | Full name of the user |
| `email` | String | Unique, Not Null | Login email |
| `password_hash` | String | Not Null | bcrypt hashed password |
| `role` | Enum | Not Null | `STUDENT`, `VENDOR`, `ADMIN` |
| `wallet_balance` | Float | Default 0.0 | Current wallet balance (INR) |
| `student_id` | String | Unique, Nullable | Student roll number e.g. `CS-2024-001` |
| `created_at` | Timestamp | Default NOW() | Account creation time |

---

## 2. Vendor_Profiles Table (`vendor_profiles`)
Stores vendor-specific data. Links 1-to-1 with the Users table via `VENDOR` role user.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Profile ID |
| `user_id` | UUID | Foreign Key (users.id) | Links to login account |
| `vendor_name` | String | Not Null | Display name (e.g., "Main Canteen") |
| `vendor_code` | String | Unique, Not Null | Short code e.g. `canteen-01` |
| `created_at` | Timestamp | Default NOW() | Creation time |

---

## 3. Transactions Table
The immutable ledger of all money movement.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Transaction ID |
| `sender_id` | UUID | FK (users.id), Nullable | Null for TOP_UP (system credit) |
| `receiver_id` | UUID | FK (users.id), Nullable | Null for FINE (system debit) |
| `amount` | Float | Not Null | Transaction amount (INR) |
| `type` | Enum | Not Null | `P2P`, `VENDOR_PAYMENT`, `SUB`, `FINE`, `FEE`, `TOP_UP` |
| `status` | Enum | Not Null | `COMPLETED`, `FAILED`, `PENDING` |
| `timestamp` | Timestamp | Default NOW() | Time of transaction |

---

## 4. Payment_Requests Table
Tracks when a vendor initiates a charge to a student (pending student approval).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Request ID |
| `vendor_id` | UUID | FK (users.id) | The vendor requesting payment |
| `student_id` | UUID | FK (users.id) | The student being charged |
| `amount` | Float | Not Null | Amount requested (INR) |
| `description` | String | Nullable | Item/service description |
| `status` | String | Default `PENDING` | `PENDING`, `PAID`, `DECLINED` |
| `created_at` | Timestamp | Default NOW() | Time of request |

---

## 5. Fines Table
Tracks campus fines issued by admins to students.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Fine ID |
| `user_id` | UUID | FK (users.id) | Student receiving the fine |
| `reason` | String | Not Null | Reason e.g. "Library late return" |
| `amount` | Float | Not Null | Fine amount (INR) |
| `status` | Enum | Default `UNPAID` | `UNPAID`, `PAID` |
| `created_by_admin` | UUID | FK (users.id) | Admin who issued it |
| `timestamp` | Timestamp | Default NOW() | Issue time |

---

## 6. Subscriptions Table
Tracks recurring payments (meal plans, gym, laundry etc.)

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Subscription ID |
| `user_id` | UUID | FK (users.id) | Subscribed student |
| `vendor_id` | UUID | FK (users.id), Nullable | Vendor providing the service |
| `plan_name` | String | Not Null | Name of the plan |
| `amount` | Float | Not Null | Recurring deduction amount |
| `billing_cycle` | Enum | Not Null | `WEEKLY`, `MONTHLY`, `SEMESTER` |
| `next_billing_date` | Timestamp | Nullable | Date of next deduction |
| `is_active` | Boolean | Default TRUE | Whether sub is currently active |