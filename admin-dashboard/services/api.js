const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ─── Toggle this to false once backend is running ────────────────────────────
const MOCK_MODE = false;

// ─── Mock data ───────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: 'uuid-001', name: 'Alice Johnson', email: 'alice@uni.edu', student_id: 'CS-2024-001', role: 'STUDENT', wallet_balance: 1250.00, created_at: '2024-08-01T09:00:00' },
  { id: 'uuid-002', name: 'Bob Smith', email: 'bob@uni.edu', student_id: 'CS-2024-002', role: 'STUDENT', wallet_balance: 340.50, created_at: '2024-08-02T10:00:00' },
  { id: 'uuid-003', name: 'Carol White', email: 'carol@uni.edu', student_id: 'ME-2024-010', role: 'STUDENT', wallet_balance: 780.00, created_at: '2024-08-03T11:00:00' },
  { id: 'uuid-004', name: 'David Lee', email: 'david@uni.edu', student_id: 'EC-2024-005', role: 'STUDENT', wallet_balance: 0.00, created_at: '2024-08-04T08:30:00' },
  { id: 'uuid-005', name: 'Main Canteen', email: 'canteen@campus.edu', student_id: null, role: 'VENDOR', wallet_balance: 45200.00, created_at: '2024-07-15T09:00:00' },
  { id: 'uuid-006', name: 'Campus Cafe', email: 'cafe@campus.edu', student_id: null, role: 'VENDOR', wallet_balance: 18900.00, created_at: '2024-07-16T09:00:00' },
  { id: 'uuid-007', name: 'Admin User', email: 'admin@campus.edu', student_id: null, role: 'ADMIN', wallet_balance: 0.00, created_at: '2024-07-01T09:00:00' },
];

const MOCK_VENDORS = [
  { vendor_id: 'canteen-01', business_name: 'Main Canteen', user_id: 'uuid-005', created_at: '2024-07-15T09:00:00' },
  { vendor_id: 'cafe-01', business_name: 'Campus Cafe', user_id: 'uuid-006', created_at: '2024-07-16T09:00:00' },
];

const MOCK_TRANSACTIONS = [
  { transaction_id: 'txn-aaa1', type: 'TOP_UP', amount: 500.00, sender_id: null, receiver_id: 'uuid-001', status: 'COMPLETED', timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
  { transaction_id: 'txn-aaa2', type: 'VENDOR_PAYMENT', amount: 120.00, sender_id: 'uuid-001', receiver_id: 'uuid-005', status: 'COMPLETED', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { transaction_id: 'txn-aaa3', type: 'P2P', amount: 200.00, sender_id: 'uuid-001', receiver_id: 'uuid-002', status: 'COMPLETED', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { transaction_id: 'txn-aaa4', type: 'FINE', amount: 50.00, sender_id: 'uuid-003', receiver_id: null, status: 'COMPLETED', timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
  { transaction_id: 'txn-aaa5', type: 'TOP_UP', amount: 1000.00, sender_id: null, receiver_id: 'uuid-002', status: 'COMPLETED', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { transaction_id: 'txn-aaa6', type: 'VENDOR_PAYMENT', amount: 85.00, sender_id: 'uuid-003', receiver_id: 'uuid-006', status: 'COMPLETED', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
  { transaction_id: 'txn-aaa7', type: 'P2P', amount: 150.00, sender_id: 'uuid-002', receiver_id: 'uuid-003', status: 'COMPLETED', timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString() },
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
    if (email === 'admin@campus.edu' && password === 'admin123') {
      return { access_token: 'mock-admin-token', role: 'ADMIN', user_id: 'uuid-007' };
    }
    throw new Error('Invalid credentials. Use admin@campus.edu / admin123');
  }
  return handle(await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }));
}

export async function getUsers() {
  if (MOCK_MODE) return MOCK_USERS;
  return handle(await fetch(`${API_URL}/admin/users`, { headers: authHeaders() }));
}

export async function getVendors() {
  if (MOCK_MODE) return MOCK_VENDORS;
  return handle(await fetch(`${API_URL}/admin/vendors`, { headers: authHeaders() }));
}

export async function createVendor(data) {
  if (MOCK_MODE) {
    MOCK_VENDORS.push({ vendor_id: data.vendor_id, business_name: data.business_name, user_id: 'uuid-new', created_at: new Date().toISOString() });
    return { status: 'SUCCESS', message: 'Vendor created successfully' };
  }
  return handle(await fetch(`${API_URL}/admin/create-vendor`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }));
}

export async function addFine(data) {
  if (MOCK_MODE) {
    return { status: 'SUCCESS', fine_id: 'fine-mock-001', message: 'Fine issued', deducted: data.force_deduct };
  }
  return handle(await fetch(`${API_URL}/admin/add-fine`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }));
}

export async function getTransactions() {
  if (MOCK_MODE) return MOCK_TRANSACTIONS;
  return handle(await fetch(`${API_URL}/admin/transactions`, { headers: authHeaders() }));
}

// ─── Mock deduct requests ─────────────────────────────────────────────────────
const MOCK_DEDUCT_REQUESTS = [
  { id: 'dr-001', vendor_id: 'uuid-005', vendor_name: 'Main Canteen', student_id: 'uuid-001', student_name: 'Alice Johnson', student_identifier: 'CS-2024-001', amount: 250.00, reason: 'Unpaid cafeteria dues - March', status: 'PENDING', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), resolved_at: null },
  { id: 'dr-002', vendor_id: 'uuid-006', vendor_name: 'Campus Cafe', student_id: 'uuid-002', student_name: 'Bob Smith', student_identifier: 'CS-2024-002', amount: 120.00, reason: 'Monthly subscription dues', status: 'APPROVED', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString() },
  { id: 'dr-003', vendor_id: 'uuid-005', vendor_name: 'Main Canteen', student_id: 'uuid-003', student_name: 'Carol White', student_identifier: 'ME-2024-010', amount: 80.00, reason: 'Outstanding food bill', status: 'REJECTED', created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString() },
];

export async function createUser(data) {
  if (MOCK_MODE) {
    const newUser = { id: 'uuid-new-' + Date.now(), name: data.username, email: data.email, role: data.role.toUpperCase(), student_id: data.student_id || null, wallet_balance: 0, created_at: new Date().toISOString() };
    MOCK_USERS.push(newUser);
    return { status: 'SUCCESS', message: 'User created successfully', user_id: newUser.id };
  }
  return handle(await fetch(`${API_URL}/admin/create-user`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  }));
}

export async function bulkCreateUsers(data) {
  if (MOCK_MODE) {
    return { status: 'SUCCESS', message: `Mock imported ${data.users.length} users.` };
  }
  return handle(await fetch(`${API_URL}/admin/bulk-create-users`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  }));
}

export async function manualDeduct(data) {
  if (MOCK_MODE) {
    const user = MOCK_USERS.find(u => u.email === data.user_identifier || u.student_id === data.user_identifier || u.name === data.user_identifier);
    if (!user) throw new Error('User not found');
    if (user.wallet_balance < data.amount) throw new Error('Insufficient balance');
    user.wallet_balance -= data.amount;
    return { status: 'SUCCESS', message: 'Deducted from ' + user.name, new_balance: user.wallet_balance };
  }
  return handle(await fetch(`${API_URL}/admin/manual-deduct`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  }));
}

export async function manualTopUp(data) {
  if (MOCK_MODE) {
    const user = MOCK_USERS.find(u => u.email === data.user_identifier || u.student_id === data.user_identifier || u.name === data.user_identifier);
    if (!user) throw new Error('User not found');
    user.wallet_balance += data.amount;
    return { status: 'SUCCESS', message: 'Added to ' + user.name, new_balance: user.wallet_balance };
  }
  return handle(await fetch(`${API_URL}/admin/manual-topup`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  }));
}

export async function getStudentProfile(identifier) {
  if (MOCK_MODE) {
    const user = MOCK_USERS.find(u => u.role === 'STUDENT' && (u.student_id === identifier || u.email === identifier || u.name === identifier || u.id === identifier));
    if (!user) throw new Error('Student not found');
    const txns = MOCK_TRANSACTIONS.filter(t => t.sender_id === user.id || t.receiver_id === user.id)
      .map(t => ({ transaction_id: t.transaction_id, type: t.type, amount: t.sender_id === user.id ? -t.amount : t.amount, status: t.status, timestamp: t.timestamp }));
    return { user, transactions: txns, fines: [{ fine_id: 'fine-mock-1', amount: 50, reason: 'Library book overdue', status: 'UNPAID', issued_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() }], subscriptions: [] };
  }
  return handle(await fetch(`${API_URL}/admin/student/${encodeURIComponent(identifier)}`, { headers: authHeaders() }));
}

export async function getDeductRequests() {
  if (MOCK_MODE) return MOCK_DEDUCT_REQUESTS;
  return handle(await fetch(`${API_URL}/admin/deduct-requests`, { headers: authHeaders() }));
}

export async function approveDeductRequest(id) {
  if (MOCK_MODE) {
    const r = MOCK_DEDUCT_REQUESTS.find(x => x.id === id);
    if (r) { r.status = 'APPROVED'; r.resolved_at = new Date().toISOString(); }
    return { status: 'SUCCESS', message: 'Approved' };
  }
  return handle(await fetch(`${API_URL}/admin/deduct-requests/${id}/approve`, { method: 'POST', headers: authHeaders() }));
}

export async function rejectDeductRequest(id) {
  if (MOCK_MODE) {
    const r = MOCK_DEDUCT_REQUESTS.find(x => x.id === id);
    if (r) { r.status = 'REJECTED'; r.resolved_at = new Date().toISOString(); }
    return { status: 'SUCCESS', message: 'Rejected' };
  }
  return handle(await fetch(`${API_URL}/admin/deduct-requests/${id}/reject`, { method: 'POST', headers: authHeaders() }));
}

// ─── Mock subscriptions ───────────────────────────────────────────────────────
const MOCK_SUBSCRIPTIONS = [
  { subscription_id: 'sub-001', student_name: 'Alice Johnson', student_identifier: 'CS-2024-001', plan_name: 'Meal Plan - Standard', amount: 500, billing_cycle: 'MONTHLY', next_billing_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(), vendor_name: 'Main Canteen', is_active: true },
  { subscription_id: 'sub-002', student_name: 'Bob Smith', student_identifier: 'CS-2024-002', plan_name: 'Gym Membership', amount: 200, billing_cycle: 'MONTHLY', next_billing_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(), vendor_name: null, is_active: true },
  { subscription_id: 'sub-003', student_name: 'Carol White', student_identifier: 'ME-2024-010', plan_name: 'Semester Bus Pass', amount: 800, billing_cycle: 'SEMESTER', next_billing_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(), vendor_name: null, is_active: false },
];

export async function createSubscription(data) {
  if (MOCK_MODE) {
    const student = MOCK_USERS.find(u => u.role === 'STUDENT' && (u.student_id === data.student_identifier || u.email === data.student_identifier || u.name === data.student_identifier));
    if (!student) throw new Error('Student not found');
    if (data.immediate_charge && student.wallet_balance < data.amount) throw new Error('Insufficient balance');
    if (data.immediate_charge) student.wallet_balance -= data.amount;
    const newSub = { subscription_id: 'sub-' + Date.now(), student_name: student.name, student_identifier: student.student_id, plan_name: data.plan_name, amount: data.amount, billing_cycle: data.billing_cycle, next_billing_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), vendor_name: data.vendor_code || null, is_active: true };
    MOCK_SUBSCRIPTIONS.push(newSub);
    return { status: 'SUCCESS', message: 'Subscription created', subscription_id: newSub.subscription_id };
  }
  return handle(await fetch(`${API_URL}/admin/subscriptions`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }));
}

export async function getSubscriptions() {
  if (MOCK_MODE) return MOCK_SUBSCRIPTIONS;
  return handle(await fetch(`${API_URL}/admin/subscriptions`, { headers: authHeaders() }));
}

export async function cancelSubscription(subId) {
  if (MOCK_MODE) {
    const s = MOCK_SUBSCRIPTIONS.find(x => x.subscription_id === subId);
    if (s) s.is_active = false;
    return { status: 'SUCCESS', message: 'Subscription cancelled' };
  }
  const id = subId.replace('sub-', '');
  return handle(await fetch(`${API_URL}/admin/subscriptions/${id}/cancel`, { method: 'POST', headers: authHeaders() }));
}

// ─── Library Management ───────────────────────────────────────────────────────

export async function getBooks() {
  return handle(await fetch(`${API_URL}/admin/library/books`, { headers: authHeaders() }));
}

export async function addBook(data) {
  return handle(await fetch(`${API_URL}/admin/library/books`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(data),
  }));
}

export async function updateBook(id, data) {
  return handle(await fetch(`${API_URL}/admin/library/books/${id}`, {
    method: 'PUT', headers: authHeaders(), body: JSON.stringify(data),
  }));
}

export async function deleteBook(id) {
  return handle(await fetch(`${API_URL}/admin/library/books/${id}`, {
    method: 'DELETE', headers: authHeaders(),
  }));
}

export async function processReturn(rentalId) {
  return handle(await fetch(`${API_URL}/admin/library/rentals/${rentalId}/return`, {
    method: 'POST', headers: authHeaders(),
  }));
}
