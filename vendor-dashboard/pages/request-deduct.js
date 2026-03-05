import { useState, useEffect } from "react";
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
                      <td style={{ padding: "11px 16px", color: "#94a3b8", fontSize: 12 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "N/A"}</td>
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
