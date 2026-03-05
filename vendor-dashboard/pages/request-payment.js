import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { requestPayment } from "../services/api";

const EMPTY = { student_identifier: "", amount: "", description: "" };

export default function RequestPayment() {
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
      const data = await requestPayment({
        student_identifier: form.student_identifier,
        amount: parseFloat(form.amount),
        description: form.description,
      });
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
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Request Payment</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>
          Send a payment request to a student — they can approve it in their app.
        </p>
      </div>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <div style={{ flex: 1, maxWidth: 480, background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", padding: "24px 26px" }}>
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
              <input type="number" min="1" step="0.01" placeholder="150.00"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                required style={inp} />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</label>
              <input placeholder="Lunch, coffee, stationery..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                required style={inp} />
            </div>

            {result && (
              <div style={{ padding: "14px 16px", background: "#d1fae5", borderRadius: 8, fontSize: 14, color: "#065f46", lineHeight: 1.7 }}>
                <strong>Request sent!</strong><br />
                <span style={{ fontSize: 12, opacity: 0.85 }}>ID: {result.request_id}</span><br />
                <span style={{ fontSize: 12, opacity: 0.85 }}>Student will be notified in their app.</span>
              </div>
            )}
            {err && <div style={{ padding: "10px 14px", background: "#fee2e2", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>{err}</div>}

            <button type="submit" disabled={loading} style={{
              padding: "10px 16px", background: "#10b981", color: "#fff",
              border: "none", borderRadius: 8, cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1
            }}>{loading ? "Sending..." : "Send Payment Request"}</button>
          </form>
        </div>

        <div style={{ flex: 1, background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9", padding: "22px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: "0 0 14px" }}>How it works</h3>
          {[
            ["1. Enter details", "Fill in the student identifier, amount, and a description for the payment."],
            ["2. Request sent", "The student receives a notification in their CampusFlow app."],
            ["3. Student approves", "The student reviews and approves the payment from their wallet."],
            ["4. Funds credited", "Once approved, the amount is instantly credited to your vendor wallet."],
          ].map(([title, desc]) => (
            <div key={title} style={{ marginBottom: 16, display: "flex", gap: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", marginTop: 6, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
