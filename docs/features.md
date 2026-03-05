# CampusFlow Features

Below is a detailed breakdown of the core features powering the CampusFlow ecosystem.

## 1. Peer-to-Peer (P2P) Transfers
Students can instantly transfer money to their peers without needing external banking apps. 
* **Identifiers:** Transfers can be initiated using a Student ID, username, or registered phone number.
* **Use Cases:** Splitting the canteen bill, contributing to a club event, or just paying a friend back.
* **User Flow:** 
  1. Open App → Tap "Send Money".
  2. Search for peer via Student ID/Username.
  3. Enter amount and optional note.
  4. Confirm via PIN/Biometrics → Instant transfer.

## 2. Vendor Payments
A frictionless payment system for internal campus vendors (canteens, stationery shops, library tech).
* **Vendor IDs over QR Codes:** To speed up transactions, vendors are assigned easy-to-remember IDs (e.g., `canteen-01`, `stationery-01`).
* **User Flow:**
  1. Open App → Tap "Pay Vendor".
  2. Enter the Vendor ID (e.g., `canteen-02`).
  3. Enter the payment amount.
  4. Swipe to confirm checkout.

## 3. Automated Deductions (AutoPay System)
A programmable compliance and fee collection tool for the university administration.
* **Rules-Based Engine:** Admins can set up rules that automatically deduct funds from a student's wallet based on campus events.
* **Examples:** Library late fees, hostel curfew penalties, or laboratory breakage charges.
* **Use Case Example:** `IF` book is returned 2 days late `THEN` deduct ₹20 from wallet and notify student.

## 4. Campus Subscriptions
Management of recurring campus services directly through the digital wallet.
* **Services:** Monthly meal plans (mess fees), gym memberships, premium library access, or printing quotas.
* **Automated Billing:** The system automatically deducts the subscription amount based on the configured billing cycle (weekly, monthly, semesterly).
* **User Flow:** 
  1. Browse available campus subscriptions.
  2. Select "Hostel Mess - Monthly Plan".
  3. Authorize recurring deduction → Subscription Active.

## 5. Fee Payments
A centralized portal for one-off university payments.
* **Capabilities:** Pay for event registrations, semester exams, hostel fees, and ad-hoc campus services.
* **Visibility:** Payments are instantly reflected in the student's history and recorded in the Admin Dashboard for easy auditing.

## 6. Transaction History
Comprehensive financial tracking for all user roles.
* **Students:** View a chronological ledger of all P2P payments, vendor payments, auto-deductions, and active subscriptions.
* **Categorization:** Expenses are easily trackable to help students manage their campus budget.

## 7. Vendor Dashboard Capabilities
A dedicated web portal for campus vendors to manage their business.
* **Payment Requests:** Initiate payment requests directly to a student's ID.
* **Ledger View:** See real-time transaction history and daily revenue summaries.
* **Amount Entry:** The vendor can enter the checkout amount directly, generating a notification to the student to approve.

## 8. Admin Management
A master control panel for the university's financial department.
* **User & Vendor Management:** Onboard new students, create/suspend vendor accounts, and manage role-based access.
* **Financial Operations:** Issue manual fines, configure subscription services, and oversee the AutoPay engine.
* **System Analytics:** Monitor transaction analytics, usage volume, and economic health on campus.
