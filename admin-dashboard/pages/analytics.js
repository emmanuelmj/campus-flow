import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getTransactions } from "../services/api";

const TYPE_BADGE = {
  P2P: { bg: "#dbeafe", color: "#1d4ed8" },
  VENDOR_PAYMENT: { bg: "#fef3c7", color: "#b45309" },
  TOP_UP: { bg: "#d1fae5", color: "#065f46" },
  FINE: { bg: "#fee2e2", color: "#991b1b" },
  SUB: { bg: "#ede9fe", color: "#5b21b6" },
  FEE: { bg: "#f1f5f9", color: "#475569" },
};

const ALL_TYPES = ["ALL", "P2P", "TOP_UP", "VENDOR_PAYMENT", "FINE", "SUB", "FEE"];

export default function Analytics() {
  const router = useRouter();
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [selectedTxn, setSelectedTxn] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    getTransactions().then(t => { setTxns(t); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? txns : txns.filter(t => t.type === filter);
  const totalVol = filtered.reduce((s, t) => s + (t.amount || 0), 0);
  const fmt = n => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Analytics</h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>
            {filtered.length} transactions · Total ₹{fmt(totalVol)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ALL_TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: "7px 14px", borderRadius: 8, border: "1px solid",
              borderColor: filter === t ? "#6366f1" : "#e2e8f0",
              background: filter === t ? "#6366f1" : "#fff",
              color: filter === t ? "#fff" : "#64748b",
              fontWeight: 500, fontSize: 12, cursor: "pointer"
            }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {["P2P", "TOP_UP", "VENDOR_PAYMENT", "FINE"].map(type => {
          const typeTxns = txns.filter(t => t.type === type);
          const vol = typeTxns.reduce((s, t) => s + (t.amount || 0), 0);
          const badge = TYPE_BADGE[type] || { bg: "#f1f5f9", color: "#475569" };
          return (
            <div key={type} style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
              <span style={{ background: badge.bg, color: badge.color, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{type}</span>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", marginTop: 10 }}>₹{fmt(vol)}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{typeTxns.length} transactions</div>
            </div>
          );
        })}
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>All Transactions</span>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["ID", "Type", "Amount", "Sender", "Receiver", "Status", "Date"].map(h => (
                  <th key={h} style={{ padding: "9px 16px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No transactions found</td></tr>
              ) : filtered.map((t, i) => {
                const badge = TYPE_BADGE[t.type] || { bg: "#f1f5f9", color: "#475569" };
                const shortId = id => id ? String(id).slice(0, 10) + "..." : "—";
                return (
                  <tr key={i} style={{ borderTop: "1px solid #f8fafc", cursor: "pointer" }}
                    onClick={() => setSelectedTxn(t)}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "11px 16px", color: "#94a3b8", fontFamily: "monospace", fontSize: 11 }}>{shortId(t.transaction_id)}</td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ background: badge.bg, color: badge.color, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{t.type}</span>
                    </td>
                    <td style={{ padding: "11px 16px", fontWeight: 600, color: "#0f172a" }}>₹{(t.amount || 0).toFixed(0)}</td>
                    <td style={{ padding: "11px 16px", color: "#0f172a", fontSize: 12 }}>{t.sender_name || "System"}</td>
                    <td style={{ padding: "11px 16px", color: "#0f172a", fontSize: 12 }}>{t.receiver_name || "System"}</td>
                    <td style={{ padding: "11px 16px" }}>
                      <span style={{ background: t.status === "COMPLETED" ? "#d1fae5" : "#fef3c7", color: t.status === "COMPLETED" ? "#065f46" : "#92400e", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{t.status}</span>
                    </td>
                    <td style={{ padding: "11px 16px", color: "#94a3b8", fontSize: 12 }}>
                      {t.timestamp ? new Date(t.timestamp).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedTxn && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(15, 23, 42, 0.4)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 100
        }}>
          <div style={{
            background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500,
            padding: "24px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            position: "relative"
          }}>
            <button onClick={() => setSelectedTxn(null)} style={{
              position: "absolute", top: 16, right: 16, background: "none",
              border: "none", fontSize: 20, cursor: "pointer", color: "#64748b"
            }}>×</button>

            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 20px 0", color: "#0f172a" }}>Transaction Details</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                <span style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>Transaction ID</span>
                <span style={{ color: "#0f172a", fontFamily: "monospace", fontSize: 13 }}>{selectedTxn.transaction_id}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                <span style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>Type</span>
                <span style={{
                  background: (TYPE_BADGE[selectedTxn.type] || {}).bg || "#f1f5f9",
                  color: (TYPE_BADGE[selectedTxn.type] || {}).color || "#475569",
                  borderRadius: 5, padding: "2px 8px", fontSize: 12, fontWeight: 600
                }}>{selectedTxn.type}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                <span style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>Amount</span>
                <span style={{ color: "#0f172a", fontWeight: 700, fontSize: 16 }}>₹{(selectedTxn.amount || 0).toFixed(2)}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                <span style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>Sender</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#0f172a", fontWeight: 500, fontSize: 13 }}>{selectedTxn.sender_name || "System"}</div>
                  <div style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 11 }}>{selectedTxn.sender_id || "—"}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                <span style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>Receiver</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#0f172a", fontWeight: 500, fontSize: 13 }}>{selectedTxn.receiver_name || "System"}</div>
                  <div style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 11 }}>{selectedTxn.receiver_id || "—"}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                <span style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>Date & Time</span>
                <span style={{ color: "#0f172a", fontSize: 13 }}>
                  {selectedTxn.timestamp ? new Date(selectedTxn.timestamp).toLocaleString() : "—"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
                <span style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>Status</span>
                <span style={{
                  background: selectedTxn.status === "COMPLETED" ? "#d1fae5" : "#fef3c7",
                  color: selectedTxn.status === "COMPLETED" ? "#065f46" : "#92400e",
                  borderRadius: 5, padding: "2px 8px", fontSize: 12, fontWeight: 600
                }}>{selectedTxn.status}</span>
              </div>

              {selectedTxn.description && (
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 4 }}>
                  <span style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>Note / Reason</span>
                  <span style={{ color: "#0f172a", fontSize: 13, maxWidth: "60%", textAlign: "right", wordBreak: "break-word" }}>
                    {selectedTxn.description}
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginTop: 24, textAlign: "right" }}>
              <button
                onClick={() => setSelectedTxn(null)}
                style={{
                  padding: "10px 20px", background: "#f1f5f9", color: "#475569",
                  border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13
                }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
