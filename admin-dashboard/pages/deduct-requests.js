import { useState, useEffect } from "react";
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
      showToast("Approved - amount deducted from student", true);
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
                      <div style={{ fontWeight: 500, color: "#0f172a" }}>{r.student_name || "N/A"}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>{r.student_identifier}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: "#dc2626" }}>INR {(r.amount || 0).toFixed(0)}</td>
                    <td style={{ padding: "12px 16px", color: "#475569", maxWidth: 180 }}>{r.reason}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: ss.bg, color: ss.color, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{r.status}</span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "N/A"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {r.status === "PENDING" ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => handleApprove(r.id)} disabled={actionLoading === r.id + "-a"} style={{ padding: "4px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 500, opacity: actionLoading === r.id + "-a" ? 0.6 : 1 }}>Approve</button>
                          <button onClick={() => handleReject(r.id)} disabled={actionLoading === r.id + "-r"} style={{ padding: "4px 12px", background: "#f1f5f9", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 500, opacity: actionLoading === r.id + "-r" ? 0.6 : 1 }}>Reject</button>
                        </div>
                      ) : <span style={{ color: "#94a3b8", fontSize: 12 }}>{r.resolved_at ? new Date(r.resolved_at).toLocaleDateString() : "N/A"}</span>}
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
