import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { getTransactions } from "../services/api";

export default function VendorHome() {
  const router = useRouter();
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    getTransactions().then(res => {
      let t = [];
      if (res && res.data && Array.isArray(res.data.transactions)) t = res.data.transactions;
      else if (res && Array.isArray(res.data)) t = res.data;
      else if (Array.isArray(res)) t = res;
      setTxns(t);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const today = new Date().toDateString();
  const todayTxns = txns.filter(t => t.timestamp && new Date(t.timestamp).toDateString() === today);
  const todayRev = todayTxns.reduce((s, t) => s + (t.amount || 0), 0);
  const totalRev = txns.reduce((s, t) => s + (t.amount || 0), 0);
  const fmt = n => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Dashboard</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Your earnings and recent activity.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 20 }}>📅</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>₹{fmt(todayRev)}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{"Today's Revenue"}</div>
          <div style={{ fontSize: 12, color: "#10b981", marginTop: 4, fontWeight: 500 }}>{todayTxns.length} payments today</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, fontSize: 20 }}>💰</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>₹{fmt(totalRev)}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>Total Revenue</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, fontWeight: 500 }}>{txns.length} total payments</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, padding: "20px 22px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
          <Link href="/request-payment" style={{
            display: "block", padding: "11px 16px", background: "#10b981", color: "#fff",
            textDecoration: "none", borderRadius: 8, textAlign: "center", fontWeight: 600, fontSize: 14
          }}>+ Request Payment</Link>
          <Link href="/transactions" style={{
            display: "block", padding: "11px 16px", background: "#f1f5f9", color: "#475569",
            textDecoration: "none", borderRadius: 8, textAlign: "center", fontWeight: 600, fontSize: 14
          }}>View All Transactions</Link>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>Recent Payments</span>
          <Link href="/transactions" style={{ color: "#10b981", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>View all →</Link>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["ID", "From (Student)", "Amount", "Date", "Status"].map(h => (
                <th key={h} style={{ padding: "9px 18px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Loading...</td></tr>
            ) : txns.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No payments received yet</td></tr>
            ) : txns.slice(0, 8).map((t, i) => (
              <tr key={i} style={{ borderTop: "1px solid #f8fafc" }}
                onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "11px 18px", color: "#94a3b8", fontFamily: "monospace", fontSize: 11 }}>{t.id ? String(t.id).slice(0, 10) + "..." : "—"}</td>
                <td style={{ padding: "11px 18px", color: "#64748b", fontFamily: "monospace", fontSize: 12 }}>{t.counterparty_name ? String(t.counterparty_name).slice(0, 12) + "..." : "—"}</td>
                <td style={{ padding: "11px 18px", fontWeight: 700, color: "#10b981" }}>₹{(t.amount || 0).toFixed(0)}</td>
                <td style={{ padding: "11px 18px", color: "#94a3b8", fontSize: 12 }}>{t.timestamp ? new Date(t.timestamp).toLocaleDateString() : "—"}</td>
                <td style={{ padding: "11px 18px" }}>
                  <span style={{ background: "#d1fae5", color: "#065f46", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
