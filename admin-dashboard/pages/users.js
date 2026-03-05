import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getUsers } from "../services/api";

const ROLE_BADGE = {
  STUDENT: { bg: "#dbeafe", color: "#1d4ed8" },
  VENDOR:  { bg: "#d1fae5", color: "#065f46" },
  ADMIN:   { bg: "#fef3c7", color: "#92400e" },
};

export default function Users() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/login"); return; }
    getUsers().then(u => { setUsers(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = users
    .filter(u => filter === "ALL" || u.role === filter)
    .filter(u => {
      if (!search) return true;
      const q = search.toLowerCase();
      return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.student_id?.toLowerCase().includes(q);
    });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Users</h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>{filtered.length} of {users.length} users</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            placeholder="Search name, email, student ID..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              padding: "8px 14px", border: "1px solid #e2e8f0", borderRadius: 8,
              fontSize: 13, width: 240, outline: "none", background: "#fff",
              color: "#0f172a"
            }}
          />
          {["ALL", "STUDENT", "VENDOR", "ADMIN"].map(r => (
            <button key={r} onClick={() => setFilter(r)} style={{
              padding: "7px 14px", borderRadius: 8, border: "1px solid",
              borderColor: filter === r ? "#6366f1" : "#e2e8f0",
              background: filter === r ? "#6366f1" : "#fff",
              color: filter === r ? "#fff" : "#64748b",
              fontWeight: 500, fontSize: 13, cursor: "pointer"
            }}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Name", "Email", "Student ID", "Role", "Balance", "Joined", ""].map(h => (
                  <th key={h} style={{ padding: "10px 18px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#94a3b8" }}>No users found</td></tr>
              ) : filtered.map((u, i) => {
                const rb = ROLE_BADGE[u.role] || { bg: "#f1f5f9", color: "#475569" };
                return (
                  <tr key={i} style={{ borderTop: "1px solid #f8fafc" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 18px", fontWeight: 600, color: "#0f172a" }}>{u.name}</td>
                    <td style={{ padding: "12px 18px", color: "#64748b" }}>{u.email}</td>
                    <td style={{ padding: "12px 18px", fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{u.student_id || "—"}</td>
                    <td style={{ padding: "12px 18px" }}>
                      <span style={{ background: rb.bg, color: rb.color, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{u.role}</span>
                    </td>
                    <td style={{ padding: "12px 18px", fontWeight: 600, color: "#10b981" }}>₹{(u.wallet_balance || 0).toFixed(0)}</td>
                    <td style={{ padding: "12px 18px", color: "#94a3b8", fontSize: 12 }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding: "10px 18px" }}>
                      {u.role === "STUDENT" && (
                        <button onClick={() => router.push("/student-profile?id=" + u.id)} style={{ padding: "4px 12px", background: "#ede9fe", color: "#5b21b6", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>View</button>
                      )}
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
