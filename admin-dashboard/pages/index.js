import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getUsers, getTransactions } from "../services/api";

const TYPE_BADGE = {
  P2P: { bg: "#dbeafe", color: "#1d4ed8" },
  VENDOR_PAYMENT: { bg: "#fef3c7", color: "#b45309" },
  TOP_UP: { bg: "#d1fae5", color: "#065f46" },
  FINE: { bg: "#fee2e2", color: "#991b1b" },
  SUB: { bg: "#ede9fe", color: "#5b21b6" },
};

const STAT_CARDS = [
  { key: "totalUsers", label: "Total Users", color: "#6366f1", bg: "#eef2ff", icon: "👥" },
  { key: "students", label: "Students", color: "#8b5cf6", bg: "#f5f3ff", icon: "🎓" },
  { key: "vendors", label: "Vendors", color: "#f59e0b", bg: "#fffbeb", icon: "🏪" },
  { key: "txnCount", label: "Transactions", color: "#3b82f6", bg: "#eff6ff", icon: "💳" },
  { key: "volume", label: "Total Volume", color: "#10b981", bg: "#ecfdf5", icon: "📈", prefix: "₹" },
];

export default function Overview() {
  const router = useRouter();
  const [stats, setStats] = useState({ totalUsers: 0, students: 0, vendors: 0, txnCount: 0, volume: 0 });
  const [recentTxns, setRecentTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    Promise.all([getUsers(), getTransactions()]).then(([usersRes, txnsRes]) => {
      // The FastAPI response has a 'data' wrapper when using my custom pagination wrapper, so extract the array
      const users = usersRes.data || usersRes || [];
      const txns = txnsRes.data || txnsRes || [];
      const students = users.filter(u => u.role === "STUDENT").length;
      const vendors = users.filter(u => u.role === "VENDOR").length;
      const volume = txns.reduce((s, t) => s + (t.amount || 0), 0);
      setStats({ totalUsers: users.length, students, vendors, txnCount: txns.length, volume });
      setRecentTxns(txns.slice(0, 8));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const fmt = n => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const shortId = id => id ? String(id).slice(0, 8) + "..." : "—";

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Overview</h1>
        <p style={{ color: "#64748b", marginTop: 4, fontSize: 14, margin: "4px 0 0" }}>Campus financial snapshot at a glance.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 28 }}>
        {STAT_CARDS.map(card => (
          <div key={card.key} style={{
            background: "#fff", borderRadius: 12, padding: "18px 20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9"
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 9, background: card.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 12, fontSize: 20
            }}>
              {card.icon}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>
              {loading ? "—" : (card.prefix || "") + fmt(stats[card.key])}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3, fontWeight: 500 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        border: "1px solid #f1f5f9", overflow: "hidden"
      }}>
        <div style={{
          padding: "16px 22px", borderBottom: "1px solid #f1f5f9",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>Recent Transactions</span>
          <button onClick={() => router.push("/analytics")} style={{
            background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 13, fontWeight: 500, padding: 0
          }}>View all →</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["ID", "Type", "Amount", "Sender → Receiver", "Status", "Time"].map(h => (
                <th key={h} style={{
                  padding: "9px 16px", textAlign: "left", color: "#64748b",
                  fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em"
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Loading...</td></tr>
            ) : recentTxns.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No transactions yet</td></tr>
            ) : recentTxns.map((t, i) => {
              const badge = TYPE_BADGE[t.type] || { bg: "#f1f5f9", color: "#475569" };
              return (
                <tr key={i} style={{ borderTop: "1px solid #f8fafc" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "11px 16px", color: "#94a3b8", fontFamily: "monospace", fontSize: 12 }}>{shortId(t.transaction_id)}</td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ background: badge.bg, color: badge.color, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{t.type}</span>
                  </td>
                  <td style={{ padding: "11px 16px", color: "#0f172a", fontWeight: 600 }}>₹{(t.amount || 0).toFixed(0)}</td>
                  <td style={{ padding: "11px 16px", color: "#0f172a", fontSize: 13, fontWeight: 500 }}>
                    <span style={{ color: "#64748b" }}>{t.sender_name || "System"}</span> → {t.receiver_name || "System"}
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{
                      background: t.status === "COMPLETED" ? "#d1fae5" : "#fef3c7",
                      color: t.status === "COMPLETED" ? "#065f46" : "#92400e",
                      borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600
                    }}>{t.status}</span>
                  </td>
                  <td style={{ padding: "11px 16px", color: "#94a3b8", fontSize: 12 }}>
                    {t.timestamp ? new Date(t.timestamp).toLocaleDateString() : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
