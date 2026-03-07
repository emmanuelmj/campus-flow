import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getVendorOrders, updateOrderStatus } from "../services/api";

export default function OrderManagement() {
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { router.replace("/login"); return; }
        loadOrders();
        const interval = setInterval(loadOrders, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, []);

    async function loadOrders() {
        try {
            const data = await getVendorOrders();
            setOrders(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusUpdate(id, status) {
        try {
            await updateOrderStatus(id, status);
            loadOrders();
        } catch (err) {
            alert(err.message);
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING": return { bg: "#fef3c7", text: "#92400e" };
            case "PREPARING": return { bg: "#e0f2fe", text: "#075985" };
            case "READY": return { bg: "#dcfce7", text: "#166534" };
            case "COMPLETED": return { bg: "#f1f5f9", text: "#475569" };
            case "CANCELLED": return { bg: "#fee2e2", text: "#991b1b" };
            default: return { bg: "#f1f5f9", text: "#475569" };
        }
    };

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px" }}>
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Canteen Orders</h1>
                <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Track and update incoming food orders in real-time.</p>
            </div>

            <div style={{ display: "grid", gap: 20 }}>
                {loading && orders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Loading orders...</div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: "#94a3b8", background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9" }}>No orders received yet.</div>
                ) : orders.map(order => (
                    <div key={order.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Order #{order.id.slice(0, 8)}</div>
                                <div style={{ fontSize: 14, color: "#64748b" }}>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Student ID: {order.student_id.slice(0, 8)}</div>
                            </div>
                            <div style={{
                                padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                                background: getStatusColor(order.status).bg,
                                color: getStatusColor(order.status).text
                            }}>
                                {order.status}
                            </div>
                        </div>

                        <div style={{ marginBottom: 20 }}>
                            {order.items.map((item, idx) => (
                                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: idx === order.items.length - 1 ? "none" : "1px solid #f8fafc" }}>
                                    <div style={{ display: "flex", gap: 12 }}>
                                        <span style={{ fontWeight: 700, color: "#10b981" }}>{item.quantity}x</span>
                                        <span style={{ color: "#1e293b", fontWeight: 500 }}>{item.menu_item.name}</span>
                                    </div>
                                    <div style={{ color: "#64748b" }}>₹{item.price_at_order * item.quantity}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "2px dashed #f1f5f9" }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Total: ₹{order.total_amount}</div>
                            <div style={{ display: "flex", gap: 10 }}>
                                {order.status === "PENDING" && (
                                    <button onClick={() => handleStatusUpdate(order.id, "PREPARING")} style={{ padding: "8px 16px", background: "#e0f2fe", color: "#0369a1", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Start Preparing</button>
                                )}
                                {order.status === "PREPARING" && (
                                    <button onClick={() => handleStatusUpdate(order.id, "READY")} style={{ padding: "8px 16px", background: "#dcfce7", color: "#15803d", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Mark Ready</button>
                                )}
                                {order.status === "READY" && (
                                    <button onClick={() => handleStatusUpdate(order.id, "COMPLETED")} style={{ padding: "8px 16px", background: "#1e293b", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Handed Over</button>
                                )}
                                {order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                                    <button onClick={() => handleStatusUpdate(order.id, "CANCELLED")} style={{ padding: "8px 16px", background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
