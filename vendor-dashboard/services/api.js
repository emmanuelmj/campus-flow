const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── Toggle this to false once backend is running ────────────────────────────
const MOCK_MODE = false;

// ─── Mock data ───────────────────────────────────────────────────────────────
const MOCK_TRANSACTIONS = [
  { transaction_id: 'txn-v001', sender_id: 'uuid-001', amount: 120.00, status: 'COMPLETED', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
  { transaction_id: 'txn-v002', sender_id: 'uuid-003', amount: 85.50, status: 'COMPLETED', timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
  { transaction_id: 'txn-v003', sender_id: 'uuid-002', amount: 200.00, status: 'COMPLETED', timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { transaction_id: 'txn-v004', sender_id: 'uuid-004', amount: 45.00, status: 'COMPLETED', timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString() },
  { transaction_id: 'txn-v005', sender_id: 'uuid-001', amount: 310.00, status: 'COMPLETED', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString() },
  { transaction_id: 'txn-v006', sender_id: 'uuid-003', amount: 60.00, status: 'COMPLETED', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString() },
];

// ─── Real API helpers ─────────────────────────────────────────────────────────
function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : '';
}

function authHeaders() {
  return { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' };
}

async function handle(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    let msg = err.detail || `Request failed (${res.status})`;
    if (Array.isArray(msg)) {
      msg = msg.map(m => typeof m === 'object' ? m.msg || JSON.stringify(m) : m).join(', ');
    } else if (typeof msg === 'object') {
      msg = JSON.stringify(msg);
    }
    throw new Error(msg);
  }
  return res.json();
}

// ─── Exported functions ───────────────────────────────────────────────────────
export async function login(email, password) {
  if (MOCK_MODE) {
    if (email === 'canteen@campus.edu' && password === 'vendor123') {
      return { access_token: 'mock-vendor-token', role: 'VENDOR', user_id: 'uuid-005' };
    }
    throw new Error('Invalid credentials. Use canteen@campus.edu / vendor123');
  }
  return handle(await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }));
}

export async function requestPayment(data) {
  if (MOCK_MODE) {
    return { status: 'SUCCESS', request_id: `req-mock-${Date.now()}`, message: 'Payment request sent to student' };
  }
  return handle(await fetch(`${API_URL}/vendor/request-payment`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }));
}

export async function getTransactions() {
  if (MOCK_MODE) return MOCK_TRANSACTIONS;
  return handle(await fetch(`${API_URL}/vendor/transactions`, { headers: authHeaders() }));
}

// ─── Vendor deduct requests ───────────────────────────────────────────────────
const MOCK_VENDOR_DEDUCT_REQUESTS = [
  { id: 'vdr-001', student_name: 'Alice Johnson', student_identifier: 'CS-2024-001', amount: 250.00, reason: 'Unpaid cafeteria dues - March', status: 'PENDING', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), resolved_at: null },
  { id: 'vdr-002', student_name: 'Bob Smith', student_identifier: 'CS-2024-002', amount: 120.00, reason: 'Monthly subscription dues', status: 'APPROVED', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString() },
];

export async function requestAdminDeduct(data) {
  if (MOCK_MODE) {
    const newReq = { id: 'vdr-' + Date.now(), student_name: data.student_identifier, student_identifier: data.student_identifier, amount: data.amount, reason: data.reason, status: 'PENDING', created_at: new Date().toISOString(), resolved_at: null };
    MOCK_VENDOR_DEDUCT_REQUESTS.unshift(newReq);
    return { status: 'SUCCESS', request_id: newReq.id, message: 'Deduct request sent to admin for approval' };
  }
  return handle(await fetch(`${API_URL}/vendor/request-admin-deduct`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  }));
}

export async function getVendorDeductRequests() {
  if (MOCK_MODE) return MOCK_VENDOR_DEDUCT_REQUESTS;
  return handle(await fetch(`${API_URL}/vendor/deduct-requests`, { headers: authHeaders() }));
}
