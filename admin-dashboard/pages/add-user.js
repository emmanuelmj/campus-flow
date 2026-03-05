import { useState } from "react";
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
