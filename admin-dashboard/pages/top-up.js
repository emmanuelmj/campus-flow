import { useState } from "react";
import { manualTopUp } from "../services/api";

export default function TopUpWallet() {
    const [form, setForm] = useState({ user_identifier: "", amount: "", reason: "Admin Top-Up" });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async e => {
        e.preventDefault();
        if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) { setError("Enter a valid positive amount"); return; }
        setLoading(true); setError(""); setResult(null);
        try {
            const res = await manualTopUp({ user_identifier: form.user_identifier, amount: Number(form.amount), reason: form.reason });
            setResult(res); setForm({ user_identifier: "", amount: "", reason: "Admin Top-Up" });
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const inp = { padding: "9px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, width: "100%", outline: "none", background: "#fff", color: "#0f172a", boxSizing: "border-box" };
    const lbl = { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" };

    return (
        <div style={{ maxWidth: 520 }}>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Top Up Wallet</h1>
                <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Manually add funds to any user wallet. Creates a TOP_UP transaction.</p>
            </div>
            <div style={{ background: "#fff", borderRadius: 12, padding: "28px 32px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 18 }}>
                        <label style={lbl}>User Identifier</label>
                        <input style={inp} placeholder="Email, Student ID, or Name" value={form.user_identifier} onChange={e => set("user_identifier", e.target.value)} required />
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Works for any role (student, vendor, admin)</div>
                    </div>
                    <div style={{ marginBottom: 18 }}>
                        <label style={lbl}>Amount (INR)</label>
                        <input style={inp} type="number" min="1" step="0.01" placeholder="0.00" value={form.amount} onChange={e => set("amount", e.target.value)} required />
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <label style={lbl}>Reason</label>
                        <input style={inp} placeholder="e.g. Admin Top-Up" value={form.reason} onChange={e => set("reason", e.target.value)} required />
                    </div>
                    {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{error}</div>}
                    {result && (
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
                            <div style={{ color: "#166534", fontWeight: 600, fontSize: 13 }}>{result.message}</div>
                            <div style={{ color: "#15803d", fontSize: 12, marginTop: 4 }}>New balance: INR {result.new_balance?.toFixed(2)}</div>
                        </div>
                    )}
                    <button type="submit" disabled={loading} style={{ width: "100%", padding: "11px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                        {loading ? "Processing..." : "Add Funds"}
                    </button>
                </form>
            </div>
        </div>
    );
}
