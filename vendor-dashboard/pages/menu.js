import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from "../services/api";

export default function MenuManagement() {
    const router = useRouter();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ name: "", description: "", price: "", category: "Snacks", is_available: true });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { router.replace("/login"); return; }
        loadMenu();
    }, []);

    async function loadMenu() {
        try {
            const data = await getMenu();
            setItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const payload = { ...formData, price: parseFloat(formData.price) };
            if (editingItem) {
                await updateMenuItem(editingItem.id, payload);
            } else {
                await createMenuItem(payload);
            }
            setShowModal(false);
            setEditingItem(null);
            setFormData({ name: "", description: "", price: "", category: "Snacks", is_available: true });
            loadMenu();
        } catch (err) {
            alert(err.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteMenuItem(id);
            loadMenu();
        } catch (err) {
            alert(err.message);
        }
    }

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Menu Management</h1>
                    <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Manage your canteen food and beverage items.</p>
                </div>
                <button
                    onClick={() => { setEditingItem(null); setShowModal(true); }}
                    style={{ padding: "10px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                >
                    + Add Item
                </button>
            </div>

            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "#f8fafc" }}>
                        <tr>
                            <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, color: "#64748b" }}>NAME</th>
                            <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, color: "#64748b" }}>CATEGORY</th>
                            <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, color: "#64748b" }}>PRICE</th>
                            <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, color: "#64748b" }}>STATUS</th>
                            <th style={{ padding: "12px 20px", textAlign: "right", fontSize: 12, color: "#64748b" }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading...</td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No items in your menu yet.</td></tr>
                        ) : items.map(item => (
                            <tr key={item.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "16px 20px" }}>
                                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{item.name}</div>
                                    <div style={{ fontSize: 12, color: "#64748b" }}>{item.description}</div>
                                </td>
                                <td style={{ padding: "16px 20px", color: "#64748b", fontSize: 14 }}>{item.category}</td>
                                <td style={{ padding: "16px 20px", fontWeight: 700, color: "#10b981" }}>₹{item.price}</td>
                                <td style={{ padding: "16px 20px" }}>
                                    <span style={{
                                        padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                                        background: item.is_available ? "#d1fae5" : "#fee2e2",
                                        color: item.is_available ? "#065f46" : "#991b1b"
                                    }}>
                                        {item.is_available ? "Available" : "Sold Out"}
                                    </span>
                                </td>
                                <td style={{ padding: "16px 20px", textAlign: "right" }}>
                                    <button onClick={() => { setEditingItem(item); setFormData(item); setShowModal(true); }} style={{ marginRight: 10, background: "none", border: "none", color: "#10b981", cursor: "pointer", fontWeight: 500 }}>Edit</button>
                                    <button onClick={() => handleDelete(item.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 500 }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
                    <div style={{ background: "#fff", padding: 30, borderRadius: 16, width: "100%", maxWidth: 500 }}>
                        <h2 style={{ margin: "0 0 20px" }}>{editingItem ? "Edit Item" : "Add Menu Item"}</h2>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Item Name</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Description</label>
                                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", height: 80 }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Price (₹)</label>
                                    <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Category</label>
                                    <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                                        <option>Snacks</option>
                                        <option>Drinks</option>
                                        <option>Mains</option>
                                        <option>Desserts</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <input type="checkbox" checked={formData.is_available} onChange={e => setFormData({ ...formData, is_available: e.target.checked })} id="available" />
                                <label htmlFor="available" style={{ fontSize: 14, fontWeight: 600 }}>Available for order</label>
                            </div>
                            <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                                <button type="submit" style={{ flex: 1, padding: 12, background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
                                    {editingItem ? "Update Item" : "Create Item"}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 12, background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
