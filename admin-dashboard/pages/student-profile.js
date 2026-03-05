import { useState, useEffect } from "react";
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
          {[["Name", user.name], ["Email", user.email], ["Student ID", user.student_id || "N/A"], ["Joined", user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"]].map(([k, v]) => (
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
                  <td style={{ padding: "11px 18px", color: "#94a3b8", fontSize: 12 }}>{f.issued_at ? new Date(f.issued_at).toLocaleDateString() : "N/A"}</td>
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
                    <td style={{ padding: "11px 18px", color: "#94a3b8", fontSize: 12 }}>{t.timestamp ? new Date(t.timestamp).toLocaleDateString() : "N/A"}</td>
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
