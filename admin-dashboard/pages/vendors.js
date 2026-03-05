import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getVendors, createVendor } from "../services/api";

const EMPTY = { business_name: "", vendor_id: "", contact_email: "" };

export default function Vendors() {
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    const t = localStorage.getItem("token");
    getVendors().then(setVendors).catch(() => {});
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    load();
    setLoading(false);
  }, []);

  const handleCreate = async e => {
    e.preventDefault();
    setMsg(""); setErr(""); setSubmitting(true);
    try {
      const t = localStorage.getItem("token");
      await createVendor(form);
      setMsg("Vendor created! Login: " + form.contact_email + "  ·  Password: vendor123");
      setForm(EMPTY);
      load();
    } catch(ex) { setErr(ex.message); }
    setSubmitting(false);
  };

  const inp = {
    padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
    fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none",
    color: "#0f172a", background: "#fff"
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Vendor Management</h1>
        <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Create and manage campus vendors.</p>
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <div style={{ flex: 2, background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>Active Vendors ({vendors.length})</span>
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Vendor Code", "Business Name", "User ID", "Created"].map(h => (
                    <th key={h} style={{ padding: "10px 18px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendors.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No vendors yet</td></tr>
                ) : vendors.map((v, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #f8fafc" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 18px", fontFamily: "monospace", color: "#6366f1", fontWeight: 600, fontSize: 12 }}>{v.vendor_id}</td>
                    <td style={{ padding: "12px 18px", fontWeight: 600, color: "#0f172a" }}>{v.business_name}</td>
                    <td style={{ padding: "12px 18px", color: "#94a3b8", fontFamily: "monospace", fontSize: 12 }}>{v.user_id ? String(v.user_id).slice(0, 12) + "..." : "—"}</td>
                    <td style={{ padding: "12px 18px", color: "#94a3b8", fontSize: 12 }}>
                      {v.created_at ? new Date(v.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ flex: 1, background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", padding: "20px 22px" }}>
          <h2 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Create Vendor</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { field: "business_name", label: "Business Name", placeholder: "e.g. Main Canteen" },
              { field: "vendor_id",     label: "Vendor Code",   placeholder: "e.g. canteen-01" },
              { field: "contact_email", label: "Contact Email", placeholder: "vendor@campus.edu", type: "email" }
            ].map(({ field, label, placeholder, type }) => (
              <div key={field}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</label>
                <input type={type || "text"} placeholder={placeholder} value={form[field]}
                  onChange={e => setForm({ ...form, [field]: e.target.value })} required style={inp} />
              </div>
            ))}

            {msg && <div style={{ padding: "10px 14px", background: "#d1fae5", borderRadius: 8, fontSize: 13, color: "#065f46", lineHeight: 1.6 }}>{msg}</div>}
            {err && <div style={{ padding: "10px 14px", background: "#fee2e2", borderRadius: 8, fontSize: 13, color: "#991b1b" }}>{err}</div>}

            <button type="submit" disabled={submitting} style={{
              padding: "10px 16px", background: "#6366f1", color: "#fff",
              border: "none", borderRadius: 8, cursor: submitting ? "not-allowed" : "pointer",
              fontSize: 14, fontWeight: 600, opacity: submitting ? 0.7 : 1, marginTop: 4
            }}>{submitting ? "Creating..." : "Create Vendor"}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
