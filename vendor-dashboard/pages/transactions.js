import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getTransactions } from "../services/api";

export default function Transactions() {
  const router = useRouter();
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    getTransactions().then(t => { setTxns(t); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = txns.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.transaction_id?.toLowerCase().includes(q) || t.sender_id?.toLowerCase().includes(q);
  });

  const totalFiltered = filtered.reduce((s, t) => s + (t.amount || 0), 0);
  const fmt = n => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Transactions</h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>
            {filtered.length} transactions · ₹{fmt(totalFiltered)} total
          </p>
        </div>
        <input
          placeholder="Search by ID or student..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8,
            fontSize: 13, width: 240, outline: "none", background: "#fff", color: "#0f172a"
          }}
        />
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Transaction ID", "From (Student)", "Amount", "Date", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 18px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No transactions found</td></tr>
              ) : filtered.map((t, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f8fafc" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 18px", color: "#94a3b8", fontFamily: "monospace", fontSize: 11 }}>{t.transaction_id ? String(t.transaction_id).slice(0, 12) + "..." : "—"}</td>
                  <td style={{ padding: "12px 18px", color: "#64748b", fontFamily: "monospace", fontSize: 12 }}>{t.sender_id ? String(t.sender_id).slice(0, 14) + "..." : "—"}</td>
                  <td style={{ padding: "12px 18px", fontWeight: 700, color: "#10b981" }}>₹{(t.amount || 0).toFixed(0)}</td>
                  <td style={{ padding: "12px 18px", color: "#94a3b8", fontSize: 12 }}>
                    {t.timestamp ? new Date(t.timestamp).toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "12px 18px" }}>
                    <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
