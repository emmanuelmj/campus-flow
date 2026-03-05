
import os

BASE_ADMIN = "C:/Users/Aditya/OneDrive/Desktop/CF/campus-flow/admin-dashboard"
BASE_VENDOR = "C:/Users/Aditya/OneDrive/Desktop/CF/campus-flow/vendor-dashboard"

# ─── 1. Admin services/api.js ────────────────────────────────────────────────
ADMIN_API = BASE_ADMIN + "/services/api.js"

addition = r"""
// ─── Mock deduct requests ─────────────────────────────────────────────────────
const MOCK_DEDUCT_REQUESTS = [
  { id: 'dr-001', vendor_id: 'uuid-005', vendor_name: 'Main Canteen', student_id: 'uuid-001', student_name: 'Alice Johnson', student_identifier: 'CS-2024-001', amount: 250.00, reason: 'Unpaid cafeteria dues - March', status: 'PENDING', created_at: new Date(Date.now() - 1000*60*60*2).toISOString(), resolved_at: null },
  { id: 'dr-002', vendor_id: 'uuid-006', vendor_name: 'Campus Cafe', student_id: 'uuid-002', student_name: 'Bob Smith', student_identifier: 'CS-2024-002', amount: 120.00, reason: 'Monthly subscription dues', status: 'APPROVED', created_at: new Date(Date.now() - 1000*60*60*24).toISOString(), resolved_at: new Date(Date.now() - 1000*60*60*20).toISOString() },
  { id: 'dr-003', vendor_id: 'uuid-005', vendor_name: 'Main Canteen', student_id: 'uuid-003', student_name: 'Carol White', student_identifier: 'ME-2024-010', amount: 80.00, reason: 'Outstanding food bill', status: 'REJECTED', created_at: new Date(Date.now() - 1000*60*60*48).toISOString(), resolved_at: new Date(Date.now() - 1000*60*60*46).toISOString() },
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

export async function getStudentProfile(identifier) {
  if (MOCK_MODE) {
    const user = MOCK_USERS.find(u => u.role === 'STUDENT' && (u.student_id === identifier || u.email === identifier || u.name === identifier || u.id === identifier));
    if (!user) throw new Error('Student not found');
    const txns = MOCK_TRANSACTIONS.filter(t => t.sender_id === user.id || t.receiver_id === user.id)
      .map(t => ({ transaction_id: t.transaction_id, type: t.type, amount: t.sender_id === user.id ? -t.amount : t.amount, status: t.status, timestamp: t.timestamp }));
    return { user, transactions: txns, fines: [{ fine_id: 'fine-mock-1', amount: 50, reason: 'Library book overdue', status: 'UNPAID', issued_at: new Date(Date.now() - 1000*60*60*72).toISOString() }], subscriptions: [] };
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
"""

with open(ADMIN_API, "a") as f:
    f.write(addition)
print("1. admin services/api.js updated")


# ─── 2. Admin _app.js ─────────────────────────────────────────────────────────
ADMIN_APP = BASE_ADMIN + "/pages/_app.js"

with open(ADMIN_APP, "r") as f:
    src = f.read()

old_paths = "  analytics: 'M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z',\n};"
new_paths = "  deduct:    'M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z',\n  deducreq:  'M9 2a1 1 0 000 2h2a1 1 0 100-2H9z',\n  adduser:   'M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z',\n  analytics: 'M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z',\n};"
old_nav = "  { href: '/analytics',  label: 'Analytics', icon: PATHS.analytics },\n];"
new_nav = "  { href: '/add-user',        label: 'Add User',        icon: PATHS.adduser   },\n  { href: '/deduct',          label: 'Deduct Wallet',   icon: PATHS.deduct    },\n  { href: '/deduct-requests', label: 'Deduct Requests', icon: PATHS.deducreq  },\n  { href: '/analytics',       label: 'Analytics',       icon: PATHS.analytics },\n];"

src = src.replace(old_paths, new_paths).replace(old_nav, new_nav)
with open(ADMIN_APP, "w") as f:
    f.write(src)
print("2. admin _app.js updated")


# ─── 3. Admin users.js ────────────────────────────────────────────────────────
ADMIN_USERS = BASE_ADMIN + "/pages/users.js"

with open(ADMIN_USERS, "r") as f:
    src = f.read()

if "useRouter" not in src:
    src = src.replace(
        'import { getUsers } from "../services/api";',
        'import { useRouter } from "next/router";\nimport { getUsers } from "../services/api";'
    )

if "const router = useRouter();" not in src:
    src = src.replace(
        "export default function Users() {\n  const [users,",
        "export default function Users() {\n  const router = useRouter();\n  const [users,"
    )

src = src.replace(
    '              {["Name", "Email", "Student ID", "Role", "Balance", "Joined"].map(h => (',
    '              {["Name", "Email", "Student ID", "Role", "Balance", "Joined", ""].map(h => ('
)

old_last_cell = '                    <td style={{ padding: "12px 18px", color: "#94a3b8", fontSize: 12 }}>\n                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "\u2014"}\n                    </td>\n                  </tr>'
new_last_cell = '                    <td style={{ padding: "12px 18px", color: "#94a3b8", fontSize: 12 }}>\n                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "\u2014"}\n                    </td>\n                    <td style={{ padding: "10px 18px" }}>\n                      {u.role === "STUDENT" && (\n                        <button onClick={() => router.push("/student-profile?id=" + u.id)} style={{ padding: "4px 12px", background: "#ede9fe", color: "#5b21b6", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>View</button>\n                      )}\n                    </td>\n                  </tr>'

src = src.replace(old_last_cell, new_last_cell)
with open(ADMIN_USERS, "w") as f:
    f.write(src)
print("3. admin users.js updated")


# ─── 4. New admin pages ───────────────────────────────────────────────────────
add_user = """import { useState } from "react";
import { useRouter } from "next/router";
import { createUser } from "../services/api";

const ROLES = ["STUDENT", "VENDOR", "ADMIN"];

export default function AddUser() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "STUDENT", student_id: "", vendor_code: "", business_name: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError(""); setResult(null);
    try {
      const payload = { username: form.username, email: form.email, password: form.password, role: form.role };
      if (form.role === "STUDENT" && form.student_id) payload.student_id = form.student_id;
      if (form.role === "VENDOR") { payload.vendor_code = form.vendor_code; payload.business_name = form.business_name; }
      const res = await createUser(payload);
      setResult(res);
      setForm({ username: "", email: "", password: "", role: "STUDENT", student_id: "", vendor_code: "", business_name: "" });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inp = { padding: "9px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, width: "100%", outline: "none", background: "#fff", color: "#0f172a", boxSizing: "border-box" };
  const lbl = { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Add User</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Create a new student, vendor, or admin account.</p>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Role</label>
            <div style={{ display: "flex", gap: 8 }}>
              {ROLES.map(r => (
                <button key={r} type="button" onClick={() => set("role", r)} style={{
                  padding: "7px 16px", borderRadius: 8, border: "1px solid",
                  borderColor: form.role === r ? "#6366f1" : "#e2e8f0",
                  background: form.role === r ? "#6366f1" : "#fff",
                  color: form.role === r ? "#fff" : "#64748b",
                  fontWeight: 500, fontSize: 13, cursor: "pointer"
                }}>{r}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Full Name</label>
            <input style={inp} placeholder="e.g. Alice Johnson" value={form.username} onChange={e => set("username", e.target.value)} required />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Email</label>
            <input style={inp} type="email" placeholder="alice@uni.edu" value={form.email} onChange={e => set("email", e.target.value)} required />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Password</label>
            <input style={inp} type="password" placeholder="Set a password" value={form.password} onChange={e => set("password", e.target.value)} required />
          </div>
          {form.role === "STUDENT" && (
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Student ID <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></label>
              <input style={inp} placeholder="e.g. CS-2024-042" value={form.student_id} onChange={e => set("student_id", e.target.value)} />
            </div>
          )}
          {form.role === "VENDOR" && (<>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Business Name</label>
              <input style={inp} placeholder="e.g. North Canteen" value={form.business_name} onChange={e => set("business_name", e.target.value)} required />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Vendor Code</label>
              <input style={inp} placeholder="e.g. canteen-north-01" value={form.vendor_code} onChange={e => set("vendor_code", e.target.value)} required />
            </div>
          </>)}
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{error}</div>}
          {result && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ color: "#166534", fontWeight: 600, fontSize: 13 }}>User created successfully!</div>
              <div style={{ color: "#15803d", fontSize: 12, marginTop: 4 }}>ID: {result.user_id}</div>
            </div>
          )}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "11px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
}
"""

deduct_page = """import { useState } from "react";
import { manualDeduct } from "../services/api";

export default function DeductWallet() {
  const [form, setForm] = useState({ user_identifier: "", amount: "", reason: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) { setError("Enter a valid positive amount"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await manualDeduct({ user_identifier: form.user_identifier, amount: Number(form.amount), reason: form.reason });
      setResult(res); setForm({ user_identifier: "", amount: "", reason: "" });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inp = { padding: "9px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, width: "100%", outline: "none", background: "#fff", color: "#0f172a", boxSizing: "border-box" };
  const lbl = { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" };

  return (
    <div style={{ maxWidth: 520 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Deduct Wallet</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Manually deduct from any user wallet. Creates a FEE transaction.</p>
      </div>
      <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>User Identifier</label>
            <input style={inp} placeholder="Email, Student ID, or Name" value={form.user_identifier} onChange={e => set("user_identifier", e.target.value)} required />
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Works for any role (student, vendor, admin)</div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={lbl}>Amount (INR)</label>
            <input style={inp} type="number" min="1" step="0.01" placeholder="0.00" value={form.amount} onChange={e => set("amount", e.target.value)} required />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>Reason</label>
            <input style={inp} placeholder="e.g. Outstanding fee payment" value={form.reason} onChange={e => set("reason", e.target.value)} required />
          </div>
          {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{error}</div>}
          {result && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ color: "#166534", fontWeight: 600, fontSize: 13 }}>{result.message}</div>
              <div style={{ color: "#15803d", fontSize: 12, marginTop: 4 }}>New balance: INR {result.new_balance?.toFixed(2)}</div>
            </div>
          )}
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "11px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Processing..." : "Deduct Amount"}
          </button>
        </form>
      </div>
    </div>
  );
}
"""

deduct_req_page = """import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getDeductRequests, approveDeductRequest, rejectDeductRequest } from "../services/api";

const STATUS_STYLE = {
  PENDING:  { bg: "#fef3c7", color: "#92400e" },
  APPROVED: { bg: "#d1fae5", color: "#065f46" },
  REJECTED: { bg: "#fee2e2", color: "#991b1b" },
};

export default function DeductRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    getDeductRequests().then(r => { setRequests(r); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const showToast = (msg, ok) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3000); };

  const handleApprove = async id => {
    setActionLoading(id + "-a");
    try {
      await approveDeductRequest(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "APPROVED", resolved_at: new Date().toISOString() } : r));
      showToast("Approved — amount deducted from student", true);
    } catch (e) { showToast(e.message, false); }
    finally { setActionLoading(null); }
  };

  const handleReject = async id => {
    setActionLoading(id + "-r");
    try {
      await rejectDeductRequest(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "REJECTED", resolved_at: new Date().toISOString() } : r));
      showToast("Request rejected", true);
    } catch (e) { showToast(e.message, false); }
    finally { setActionLoading(null); }
  };

  const filtered = filter === "ALL" ? requests : requests.filter(r => r.status === filter);
  const pending = requests.filter(r => r.status === "PENDING").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Vendor Deduct Requests</h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Vendors requesting admin-mediated deduction from students.</p>
        </div>
        {pending > 0 && <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 16px", color: "#92400e", fontWeight: 600, fontSize: 13 }}>{pending} pending</div>}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "7px 14px", borderRadius: 8, border: "1px solid",
            borderColor: filter === s ? "#6366f1" : "#e2e8f0",
            background: filter === s ? "#6366f1" : "#fff",
            color: filter === s ? "#fff" : "#64748b",
            fontWeight: 500, fontSize: 13, cursor: "pointer"
          }}>{s} {s !== "ALL" ? "(" + requests.filter(r => r.status === s).length + ")" : ""}</button>
        ))}
      </div>

      {toast && <div style={{ position: "fixed", top: 24, right: 24, background: toast.ok ? "#166534" : "#dc2626", color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 500, fontSize: 13, zIndex: 1000, boxShadow: "0 4px 16px rgba(0,0,0,0.15)" }}>{toast.msg}</div>}

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
        {loading ? <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading...</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#f8fafc" }}>
              {["Vendor", "Student", "Amount", "Reason", "Status", "Date", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No requests found</td></tr>
              ) : filtered.map((r, i) => {
                const ss = STATUS_STYLE[r.status] || { bg: "#f1f5f9", color: "#475569" };
                return (
                  <tr key={i} style={{ borderTop: "1px solid #f8fafc" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#0f172a" }}>{r.vendor_name}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 500, color: "#0f172a" }}>{r.student_name || "—"}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{r.student_identifier}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#dc2626" }}>INR {(r.amount || 0).toFixed(0)}</td>
                    <td style={{ padding: "12px 16px", color: "#475569", maxWidth: 180 }}>{r.reason}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: ss.bg, color: ss.color, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{r.status}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {r.status === "PENDING" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => handleApprove(r.id)} disabled={actionLoading === r.id + "-a"} style={{ padding: "4px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 500, opacity: actionLoading === r.id + "-a" ? 0.6 : 1 }}>Approve</button>
                          <button onClick={() => handleReject(r.id)} disabled={actionLoading === r.id + "-r"} style={{ padding: "4px 12px", background: "#f1f5f9", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 500, opacity: actionLoading === r.id + "-r" ? 0.6 : 1 }}>Reject</button>
                        </div>
                      ) : <span style={{ color: "#94a3b8", fontSize: 12 }}>{r.resolved_at ? new Date(r.resolved_at).toLocaleDateString() : "—"}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
"""

student_profile_page = """import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getStudentProfile } from "../services/api";

const TYPE_BADGE = {
  P2P: { bg: "#dbeafe", color: "#1d4ed8" }, VENDOR_PAYMENT: { bg: "#fef3c7", color: "#b45309" },
  TOP_UP: { bg: "#d1fae5", color: "#065f46" }, FINE: { bg: "#fee2e2", color: "#991b1b" },
  FEE: { bg: "#fce7f3", color: "#9d174d" }, SUB: { bg: "#ede9fe", color: "#5b21b6" },
};

export default function StudentProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    getStudentProfile(id).then(d => { setData(d); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); });
  }, [id]);

  const fmt = n => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });

  if (loading) return <div style={{ padding: 40, color: "#94a3b8" }}>Loading profile...</div>;
  if (error) return <div style={{ padding: 40, color: "#dc2626" }}>Error: {error}</div>;
  if (!data) return null;

  const { user, transactions, fines, subscriptions } = data;
  const unpaidFines = fines.filter(f => f.status === "UNPAID");
  const totalFines = fines.reduce((s, f) => s + (f.amount || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button onClick={() => router.back()} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 14px", cursor: "pointer", color: "#475569", fontSize: 13, fontWeight: 500 }}>Back</button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Student Profile</h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Full view for {user.name}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Wallet Balance", value: "INR " + fmt(user.wallet_balance), color: "#10b981" },
          { label: "Transactions", value: transactions.length, color: "#6366f1" },
          { label: "Total Fines", value: "INR " + fmt(totalFines), color: "#f59e0b" },
          { label: "Unpaid Fines", value: unpaidFines.length, color: "#dc2626" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", marginBottom: 14 }}>Personal Information</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
          {[["Name", user.name], ["Email", user.email], ["Student ID", user.student_id || "—"], ["Joined", user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"]].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{k}</div>
              <div style={{ fontSize: 14, color: "#0f172a", marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 22px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, fontSize: 14, color: "#0f172a" }}>Fines ({fines.length})</div>
        {fines.length === 0 ? <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No fines on record</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#f8fafc" }}>
              {["Reason", "Amount", "Status", "Date"].map(h => <th key={h} style={{ padding: "9px 18px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {fines.map((f, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f8fafc" }}>
                  <td style={{ padding: "11px 18px", color: "#0f172a" }}>{f.reason}</td>
                  <td style={{ padding: "11px 18px", fontWeight: 600, color: "#dc2626" }}>INR {f.amount}</td>
                  <td style={{ padding: "11px 18px" }}>
                    <span style={{ background: f.status === "PAID" ? "#d1fae5" : "#fef3c7", color: f.status === "PAID" ? "#065f46" : "#92400e", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{f.status}</span>
                  </td>
                  <td style={{ padding: "11px 18px", color: "#94a3b8", fontSize: 12 }}>{f.issued_at ? new Date(f.issued_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
        <div style={{ padding: "14px 22px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, fontSize: 14, color: "#0f172a" }}>Recent Transactions ({transactions.length})</div>
        {transactions.length === 0 ? <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No transactions yet</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#f8fafc" }}>
              {["Type", "Amount", "Status", "Date"].map(h => <th key={h} style={{ padding: "9px 18px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {transactions.map((t, i) => {
                const badge = TYPE_BADGE[t.type] || { bg: "#f1f5f9", color: "#475569" };
                return (
                  <tr key={i} style={{ borderTop: "1px solid #f8fafc" }}>
                    <td style={{ padding: "11px 18px" }}>
                      <span style={{ background: badge.bg, color: badge.color, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{t.type}</span>
                    </td>
                    <td style={{ padding: "11px 18px", fontWeight: 600, color: t.amount >= 0 ? "#10b981" : "#dc2626" }}>
                      {t.amount >= 0 ? "+" : ""}INR {Math.abs(t.amount).toFixed(0)}
                    </td>
                    <td style={{ padding: "11px 18px" }}>
                      <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{t.status}</span>
                    </td>
                    <td style={{ padding: "11px 18px", color: "#94a3b8", fontSize: 12 }}>{t.timestamp ? new Date(t.timestamp).toLocaleDateString() : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
"""

for path, content in [
    (BASE_ADMIN + "/pages/add-user.js", add_user),
    (BASE_ADMIN + "/pages/deduct.js", deduct_page),
    (BASE_ADMIN + "/pages/deduct-requests.js", deduct_req_page),
    (BASE_ADMIN + "/pages/student-profile.js", student_profile_page),
]:
    with open(path, "w") as f:
        f.write(content)
    print("4. Created:", path.split("/")[-1])


# ─── 5. Vendor services/api.js ────────────────────────────────────────────────
VENDOR_API = BASE_VENDOR + "/services/api.js"

vendor_api_add = """
// ─── Vendor deduct requests ───────────────────────────────────────────────────
const MOCK_VENDOR_DEDUCT_REQUESTS = [
  { id: 'vdr-001', student_name: 'Alice Johnson', student_identifier: 'CS-2024-001', amount: 250.00, reason: 'Unpaid cafeteria dues - March', status: 'PENDING', created_at: new Date(Date.now() - 1000*60*60*2).toISOString(), resolved_at: null },
  { id: 'vdr-002', student_name: 'Bob Smith', student_identifier: 'CS-2024-002', amount: 120.00, reason: 'Monthly subscription dues', status: 'APPROVED', created_at: new Date(Date.now() - 1000*60*60*24).toISOString(), resolved_at: new Date(Date.now() - 1000*60*60*20).toISOString() },
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
"""

with open(VENDOR_API, "a") as f:
    f.write(vendor_api_add)
print("5. vendor services/api.js updated")


# ─── 6. Vendor _app.js ────────────────────────────────────────────────────────
VENDOR_APP = BASE_VENDOR + "/pages/_app.js"

with open(VENDOR_APP, "r") as f:
    src = f.read()

src = src.replace(
    "  request:    'M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z',\n  ledger:",
    "  request:    'M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z',\n  deduct:     'M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z',\n  ledger:"
)
src = src.replace(
    "  { href: '/transactions',      label: 'Transactions',   icon: PATHS.ledger    },\n];",
    "  { href: '/request-deduct',    label: 'Request Deduct', icon: PATHS.deduct    },\n  { href: '/transactions',      label: 'Transactions',   icon: PATHS.ledger    },\n];"
)
with open(VENDOR_APP, "w") as f:
    f.write(src)
print("6. vendor _app.js updated")


# ─── 7. Vendor request-deduct.js ─────────────────────────────────────────────
VREQ = BASE_VENDOR + "/pages/request-deduct.js"

vreq = """import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { requestAdminDeduct, getVendorDeductRequests } from "../services/api";

const STATUS_STYLE = {
  PENDING:  { bg: "#fef3c7", color: "#92400e" },
  APPROVED: { bg: "#d1fae5", color: "#065f46" },
  REJECTED: { bg: "#fee2e2", color: "#991b1b" },
};

export default function RequestDeduct() {
  const router = useRouter();
  const [form, setForm] = useState({ student_identifier: "", amount: "", reason: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    getVendorDeductRequests().then(r => { setHistory(r); setHistLoading(false); }).catch(() => setHistLoading(false));
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) { setError("Enter a valid positive amount"); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await requestAdminDeduct({ student_identifier: form.student_identifier, amount: Number(form.amount), reason: form.reason });
      setResult(res); setForm({ student_identifier: "", amount: "", reason: "" });
      getVendorDeductRequests().then(r => setHistory(r));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inp = { padding: "9px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, width: "100%", outline: "none", background: "#fff", color: "#0f172a", boxSizing: "border-box" };
  const lbl = { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Request Deduct</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Ask admin to deduct outstanding dues from a student wallet.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 24, alignItems: "start" }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a", marginBottom: 18 }}>New Request</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Student Identifier</label>
              <input style={inp} placeholder="Student ID, email, or name" value={form.student_identifier} onChange={e => set("student_identifier", e.target.value)} required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Amount (INR)</label>
              <input style={inp} type="number" min="1" step="0.01" placeholder="0.00" value={form.amount} onChange={e => set("amount", e.target.value)} required />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Reason</label>
              <input style={inp} placeholder="e.g. March cafeteria dues" value={form.reason} onChange={e => set("reason", e.target.value)} required />
            </div>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400e", marginBottom: 16 }}>
              This sends a request to admin. Deduction only happens after admin approves.
            </div>
            {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 14 }}>{error}</div>}
            {result && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 14px", color: "#166534", fontSize: 13, fontWeight: 500, marginBottom: 14 }}>Request sent! ID: {result.request_id}</div>}
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "11px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Sending..." : "Send Request to Admin"}
            </button>
          </form>
        </div>

        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
          <div style={{ padding: "14px 22px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, fontSize: 14, color: "#0f172a" }}>Your Requests</div>
          {histLoading ? <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Loading...</div> :
           history.length === 0 ? <div style={{ padding: 24, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No requests yet</div> : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ background: "#f8fafc" }}>
                {["Student", "Amount", "Reason", "Status", "Date"].map(h => <th key={h} style={{ padding: "9px 16px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {history.map((r, i) => {
                  const ss = STATUS_STYLE[r.status] || { bg: "#f1f5f9", color: "#475569" };
                  return (
                    <tr key={i} style={{ borderTop: "1px solid #f8fafc" }}>
                      <td style={{ padding: "11px 16px" }}>
                        <div style={{ fontWeight: 500, color: "#0f172a" }}>{r.student_name || r.student_identifier}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{r.student_identifier}</div>
                      </td>
                      <td style={{ padding: "11px 16px", fontWeight: 700, color: "#dc2626" }}>INR {(r.amount || 0).toFixed(0)}</td>
                      <td style={{ padding: "11px 16px", color: "#475569", maxWidth: 140 }}>{r.reason}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ background: ss.bg, color: ss.color, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{r.status}</span>
                      </td>
                      <td style={{ padding: "11px 16px", color: "#94a3b8", fontSize: 12 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
"""

with open(VREQ, "w") as f:
    f.write(vreq)
print("7. vendor request-deduct.js created")

print("\\nAll done!")
