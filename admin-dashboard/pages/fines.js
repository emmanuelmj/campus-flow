import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { addFine } from "../services/api";

const EMPTY = { student_identifier: "", amount: "", reason: "", force_deduct: false };

export default function Fines() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("token")) router.replace("/login");
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    setResult(null); setErr(""); setLoading(true);
    try {
      const t = localStorage.getItem("token");
      const data = await addFine({ ...form, amount: parseFloat(form.amount) });
      setResult(data);
      setForm(EMPTY);
    } catch(ex) { setErr(ex.message); }
    setLoading(false);
  };

  const inp = {
    padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
    fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none",
    color: "#0f172a", background: "#fff"
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Issue Fine</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>
          Identify student by Student ID (e.g. CS-2024-001), email, or name.
        </p>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ maxWidth: 480, flex: 1, background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", padding: "24px 26px" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Student Identifier</label>
              <input placeholder="CS-2024-001  or  alice@uni.edu  or  Alice"
                value={form.student_identifier}
                onChange={e => setForm({ ...form, student_identifier: e.target.value })}
                required style={inp} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Amount (₹)</label>
              <input type="number" min="1" step="0.01" placeholder="500"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                required style={inp} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Reason</label>
              <input placeholder="Library overdue, parking violation, late fee..."
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                required style={inp} />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={form.force_deduct}
                onChange={e => setForm({ ...form, force_deduct: e.target.checked })}
                style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#f59e0b" }} />
              <span style={{ fontSize: 14, color: "#92400e", fontWeight: 500 }}>Force-deduct from wallet immediately</span>
            </label>

            {result && (
              <div style={{ padding: "14px 16px", background: "#d1fae5", borderRadius: 8, fontSize: 14, color: "#065f46", lineHeight: 1.7 }}>
                <strong>{result.message}</strong><br />
                <span style={{ fontSize: 12, opacity: 0.85 }}>Fine ID: {result.fine_id}</span>
              </div>
            )}
            {err && <div style={{ padding: "10px 14px", background: "#fee2e2", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>{err}</div>}

            <button type="submit" disabled={loading} style={{
              padding: "10px 16px", background: "#ef4444", color: "#fff",
              border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1
            }}>{loading ? "Issuing..." : "Issue Fine"}</button>
          </form>
        </div>

        <div style={{ flex: 1, background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9", padding: "22px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 14px" }}>How it works</h3>
          {[
            ["Student ID", "Use the student's enrollment number (e.g. CS-2024-001)"],
            ["Email", "Use the student's registered email address"],
            ["Name", "Use the student's full name (must be exact)"],
            ["Force Deduct", "Immediately deducts from wallet; otherwise fine shows as pending in the app"],
          ].map(([title, desc]) => (
            <div key={title} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
