"""
CampusFlow E2E Test — Full flow: Register → Login → Create Vendor → Top-up → Pay Vendor → Verify Balance
Run: python test_e2e.py  (with server at http://127.0.0.1:8000)
"""
import sys
import uuid
import requests

BASE = "http://127.0.0.1:8000"

# ANSI colors
G = "\033[92m"  # green
R = "\033[91m"  # red
B = "\033[1m"   # bold
N = "\033[0m"   # reset

# Unique suffix to avoid duplicate-email conflicts on re-runs
TAG = uuid.uuid4().hex[:6]

ADMIN_EMAIL = f"admin-{TAG}@test.com"
STUDENT_EMAIL = f"student-{TAG}@test.com"
VENDOR_EMAIL = f"vendor-{TAG}@test.com"
VENDOR_CODE = f"vend-{TAG}"
PASSWORD = "TestPass123"


def step(label: str, method: str, path: str, *, json=None, token=None, expect=(200, 201)):
    """Fire a request, print result, halt on failure."""
    url = f"{BASE}{path}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    resp = getattr(requests, method)(url, json=json, headers=headers)

    if resp.status_code in expect:
        print(f"  {G}✓ {label}{N}  [{resp.status_code}]")
    else:
        print(f"  {R}✗ {label}{N}  [{resp.status_code}]")
        try:
            print(f"    Response: {resp.json()}")
        except Exception:
            print(f"    Response: {resp.text}")
        sys.exit(1)

    return resp.json()


# ═══════════════════════════════════════════════════════════════════════════════
print(f"\n{B}═══ CampusFlow E2E Test ═══{N}\n")

# 1. Register ADMIN
print(f"{B}Step 1: Register Admin{N}")
step("POST /auth/register (ADMIN)", "post", "/auth/register", json={
    "username": "TestAdmin",
    "email": ADMIN_EMAIL,
    "password": PASSWORD,
    "role": "ADMIN",
})

# 2. Register STUDENT
print(f"\n{B}Step 2: Register Student{N}")
step("POST /auth/register (STUDENT)", "post", "/auth/register", json={
    "username": "TestStudent",
    "email": STUDENT_EMAIL,
    "password": PASSWORD,
    "role": "STUDENT",
    "student_id": f"CS-{TAG}",
})

# 3. Login ADMIN → Create Vendor
print(f"\n{B}Step 3: Admin Login + Create Vendor{N}")
admin_login = step("POST /auth/login (ADMIN)", "post", "/auth/login", json={
    "email": ADMIN_EMAIL,
    "password": PASSWORD,
})
admin_token = admin_login["access_token"]

step("POST /admin/create-vendor", "post", "/admin/create-vendor", token=admin_token, json={
    "name": "TestVendor",
    "email": VENDOR_EMAIL,
    "password": PASSWORD,
    "vendor_name": "Test Canteen",
    "vendor_code": VENDOR_CODE,
}, expect=(201,))

# 4. Login STUDENT
print(f"\n{B}Step 4: Student Login{N}")
student_login = step("POST /auth/login (STUDENT)", "post", "/auth/login", json={
    "email": STUDENT_EMAIL,
    "password": PASSWORD,
})
student_token = student_login["access_token"]

# 5. Top-up wallet (+1000)
print(f"\n{B}Step 5: Top-up Wallet{N}")
topup = step("POST /wallet/top-up (+1000)", "post", "/wallet/top-up", token=student_token, json={
    "amount": 1000.00,
})
print(f"    Balance after top-up: {topup['new_balance']}")

# 6. Pay vendor (250)
print(f"\n{B}Step 6: Pay Vendor{N}")
pay = step("POST /pay-vendor (250)", "post", "/pay-vendor", token=student_token, json={
    "vendor_id": VENDOR_CODE,
    "amount": 250.00,
})
print(f"    Balance after payment: {pay['new_balance']}")

# 7. Verify final balance == 750
print(f"\n{B}Step 7: Verify Wallet Balance{N}")
wallet = step("GET /wallet", "get", "/wallet", token=student_token)
balance = wallet["balance"]

if balance == 750.0:
    print(f"    {G}✓ Balance verified: ₹{balance} (expected ₹750.00){N}")
else:
    print(f"    {R}✗ Balance mismatch: got ₹{balance}, expected ₹750.00{N}")
    sys.exit(1)


# ═══════════════════════════════════════════════════════════════════════════════
print(f"\n{B}{G}═══ ALL 7 STEPS PASSED ═══{N}\n")
