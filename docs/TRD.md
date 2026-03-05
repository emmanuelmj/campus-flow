# Technical Requirements Document (TRD)
**Project Name:** CampusFlow
**Event:** Invenza'26 Hackathon

## 1. System Architecture
CampusFlow utilizes a centralized, single-backend API architecture to ensure strict data consistency and real-time ledger updates across all platforms.
* **Mobile App (Students):** Communicates with Backend API via REST.
* **Vendor Dashboard:** Communicates with Backend API via REST.
* **Admin Dashboard:** Communicates with Backend API via REST.
* **Backend API:** Central orchestrator for all business logic, authorization, database I/O, and transaction processing.

## 2. Technology Stack
* **Frontend - Student App:** React Native (Expo) - enables rapid cross-platform development (iOS & Android) with a deeply integrated ecosystem.
* **Frontend - Vendor & Admin Dashboards:** Next.js (React) - chosen for dynamic rendering, modular component architecture, and high performance.
* **Backend:** FastAPI (Python) - delivers exceptional speed, asynchronous concurrency, and automatic interactive Swagger UI documentation out-of-the-box.
* **Database:** PostgreSQL - chosen for strict ACID compliance, which is a non-negotiable requirement for an application handling financial records.
* **ORM:** SQLAlchemy or SQLModel for type-safe database access and schema migrations.

## 3. Database Schema Overview
Core tables defined in PostgreSQL will include:
* **`users`**: Base table for all entities (`id`, `username`, `email`, `password_hash`, `role`).
* **`wallets`**: `id`, `user_id` (foreign key), `balance`, `currency`. 
* **`transactions`**: `id`, `sender_wallet_id`, `receiver_wallet_id`, `amount`, `transaction_type` (P2P, VENDOR, FINE, SUBSCRIPTION, FEE), `status`, `timestamp`.
* **`vendors`**: `user_id`, `vendor_id` (e.g., `canteen-01`), `business_name`.
* **`subscriptions`**: `id`, `student_id`, `service_name`, `amount`, `billing_cycle`, `next_billing_date`.
* **`fines`**: `id`, `student_id`, `amount`, `reason`, `status` (PENDING, PAID).

## 4. Backend Structure (FastAPI)
The backend codebase will follow domain-oriented design principles:
* `/app/api/`: Route definitions segregated by domain (e.g., `/auth`, `/student`, `/vendor`, `/admin`).
* `/app/core/`: Application settings, security configurations, JWT handlers.
* `/app/models/`: SQLAlchemy ORM definitions mapping to PostgreSQL.
* `/app/schemas/`: Pydantic models for incoming request validation and outgoing response serialization.
* `/app/services/`: Isolated business logic. Wallet deductions occur here inside explicit database transactions to prevent race conditions.

## 5. Frontend Architecture
### React Native (Student App)
* **State Management:** Zustand for lightweight global state (managing session token and current wallet balance).
* **Navigation:** React Navigation (Tab routing for Home, History, Settings; Stack routing for the payment/transfer flow).
* **Styling:** NativeWind (Tailwind mapped for React Native) to ensure rapid layout styling consistent with the web dashboards.

### Next.js (Admin & Vendor Dashboards)
* **Structure:** App Router utilizing nested layouts for authenticated dashboard views (`/app/vendor/layout.tsx`, `/app/admin/layout.tsx`).
* **Data Fetching:** React Query for client-side fetches, caching, and real-time polling of new payment requests.
* **Components:** Shadcn/ui or Tailwind CSS for a professional, accessible, and fast UI built from atomic components.

## 6. Authentication and Authorization
* **Mechanism:** JSON Web Tokens (JWT).
* **Workflow:** Upon successful login, the API issues a token containing the user's ID and `role`. 
* **Role-Based Access Control (RBAC):** FastAPI dependencies (e.g., `get_current_admin_user`) will inspect the JWT claim before allowing execution on protected routes. Attempting to hit an admin route with a student token will yield a `403 Forbidden`.

## 7. Scalability Considerations
* **Data Consistency:** Database transactions are heavily utilized for payments. We will leverage row-level locking (`SELECT ... FOR UPDATE`) in PostgreSQL when debiting wallets to strictly prevent double-spending anomalies.
* **Background Processing:** The AutoPay and subscription engine involves recurring checks. We'll utilize tools like Celery or APScheduler to manage cron jobs that run off the main event loop.
* **Indexing:** Optimizing performance via database indexes on heavily queried columns like `student_id`, `vendor_id`, and `timestamp`.

## 8. Security Considerations
* **Environment Secrets:** Secrets like JWT signing keys and DB connection strings will reside exclusively in non-committed `.env` files.
* **Password Encryption:** Passwords strongly hashed using `bcrypt` or `argon2`.
* **Input Validation:** Strict Pydantic validators on all input models (preventing negative transfer amounts, SQL injection strings).
* **Rate Limiting:** IP-based throttling on sensitive endpoints (like `/auth/login`) to mitigate brute-force attacks.

## 9. Deployment Considerations (Hackathon Scope)
* **Backend API & Database:** Deployable via Render or Railway for instant HTTPS CI/CD straight from the GitHub repository.
* **Web Dashboards:** Hosted on Vercel for instantaneous deployments and edge caching.
* **Mobile Application:** Distributed via Expo Go, allowing judges and teammates to test the app via QR code without publishing to app stores.
