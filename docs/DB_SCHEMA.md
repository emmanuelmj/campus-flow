# CampusFlow Database Schema

## 1. Users Table
Handles authentication and core balances for ALL roles (Student, Vendor, Admin).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Unique identifier |
| `name` | String | Not Null | Full name of the user |
| `email` | String | Unique, Not Null | Login email |
| `password_hash` | String | Not Null | Hashed password |
| `role` | Enum | Not Null | `STUDENT`, `VENDOR`, `ADMIN` |
| `wallet_balance` | Decimal | Default 0.00 | Current wallet balance |
| `created_at` | Timestamp | Default NOW() | Account creation time |

## 2. Vendor_Profiles Table
Stores vendor-specific data. Links 1-to-1 with the Users table.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Profile ID |
| `user_id` | UUID | Foreign Key (Users.id) | Links to login account |
| `vendor_name` | String | Not Null | Display name (e.g., "Main Canteen") |
| `vendor_code` | String | Unique, Not Null | Short code for quick payments (e.g., "CANT01") |

## 3. Transactions Table
The immutable ledger of all money movement.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Transaction ID |
| `sender_id` | UUID | Foreign Key (Users.id) | Who sent the money (Null for top-ups) |
| `receiver_id` | UUID | Foreign Key (Users.id) | Who received the money |
| `amount` | Decimal | Not Null | Transaction amount |
| `type` | Enum | Not Null | `P2P`, `VENDOR`, `SUB`, `FINE`, `FEE`, `TOP_UP` |
| `status` | Enum | Not Null | `SUCCESS`, `FAILED`, `PENDING` |
| `timestamp` | Timestamp | Default NOW() | Time of transaction |

## 4. Payment_Requests Table
Tracks when a vendor initiates a charge to a student.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Request ID |
| `vendor_id` | UUID | Foreign Key (Users.id) | The vendor requesting payment |
| `student_id` | UUID | Foreign Key (Users.id) | The student being charged |
| `amount` | Decimal | Not Null | Amount requested |
| `status` | Enum | Default 'PENDING' | `PENDING`, `PAID`, `DECLINED` |
| `created_at` | Timestamp | Default NOW() | Time of request |

## 5. Fines Table
Tracks campus fines issued by admins.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Fine ID |
| `student_id` | UUID | Foreign Key (Users.id) | Student receiving the fine |
| `reason` | String | Not Null | Reason (e.g., "Late Library Book") |
| `amount` | Decimal | Not Null | Fine amount |
| `admin_id` | UUID | Foreign Key (Users.id) | Admin who issued it |
| `status` | Enum | Default 'UNPAID' | `UNPAID`, `PAID` |
| `timestamp` | Timestamp | Default NOW() | Issue time |

## 6. Subscriptions Table
Tracks recurring payments (e.g., meal plans, laundry).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Subscription ID |
| `student_id` | UUID | Foreign Key (Users.id) | Subscribed student |
| `vendor_id` | UUID | Foreign Key (Users.id) | Vendor providing the service |
| `plan_name` | String | Not Null | Name of the plan |
| `amount` | Decimal | Not Null | Recurring deduction amount |
| `billing_cycle`| Enum | Not Null | `WEEKLY`, `MONTHLY`, `SEMESTER` |
| `next_billing` | Timestamp | Not Null | Date of next deduction |
| `is_active` | Boolean | Default TRUE | Whether sub is currently active |