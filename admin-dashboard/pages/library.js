import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getBooks, addBook, updateBook, deleteBook } from "../services/api";

export default function LibraryManagement() {
    const router = useRouter();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [formData, setFormData] = useState({ title: "", author: "", isbn: "", category: "General", total_copies: 5, available_copies: 5 });

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) { router.replace("/login"); return; }
        loadBooks();
    }, []);

    async function loadBooks() {
        try {
            const data = await getBooks();
            setBooks(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                total_copies: parseInt(formData.total_copies),
                available_copies: editingBook ? parseInt(formData.available_copies) : parseInt(formData.total_copies)
            };
            if (editingBook) {
                await updateBook(editingBook.id, payload);
            } else {
                await addBook(payload);
            }
            setShowModal(false);
            setEditingBook(null);
            setFormData({ title: "", author: "", isbn: "", category: "General", total_copies: 5, available_copies: 5 });
            loadBooks();
        } catch (err) {
            alert(err.message);
        }
    }

    async function handleDelete(id) {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteBook(id);
            loadBooks();
        } catch (err) {
            alert(err.message);
        }
    }

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Library Management</h1>
                    <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Manage the college library book catalog and inventory.</p>
                </div>
                <button
                    onClick={() => { setEditingBook(null); setFormData({ title: "", author: "", isbn: "", category: "General", total_copies: 5, available_copies: 5 }); setShowModal(true); }}
                    style={{ padding: "10px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                >
                    + Add New Book
                </button>
            </div>

            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ background: "#f8fafc" }}>
                        <tr>
                            <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, color: "#64748b" }}>TITLE & AUTHOR</th>
                            <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, color: "#64748b" }}>ISBN</th>
                            <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, color: "#64748b" }}>CATEGORY</th>
                            <th style={{ padding: "12px 20px", textAlign: "left", fontSize: 12, color: "#64748b" }}>STOCK</th>
                            <th style={{ padding: "12px 20px", textAlign: "right", fontSize: 12, color: "#64748b" }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading library...</td></tr>
                        ) : books.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>No books found. Add some to get started.</td></tr>
                        ) : books.map(book => (
                            <tr key={book.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "16px 20px" }}>
                                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{book.title}</div>
                                    <div style={{ fontSize: 12, color: "#64748b" }}>by {book.author}</div>
                                </td>
                                <td style={{ padding: "16px 20px", color: "#64748b", fontSize: 13, fontFamily: "monospace" }}>{book.isbn}</td>
                                <td style={{ padding: "16px 20px", color: "#64748b", fontSize: 14 }}>{book.category}</td>
                                <td style={{ padding: "16px 20px" }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: book.available_copies > 0 ? "#1e293b" : "#ef4444" }}>
                                        {book.available_copies} / {book.total_copies}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#94a3b8" }}>Copies Available</div>
                                </td>
                                <td style={{ padding: "16px 20px", textAlign: "right" }}>
                                    <button onClick={() => { setEditingBook(book); setFormData(book); setShowModal(true); }} style={{ marginRight: 10, background: "none", border: "none", color: "#10b981", cursor: "pointer", fontWeight: 500 }}>Edit</button>
                                    <button onClick={() => handleDelete(book.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 500 }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
                    <div style={{ background: "#fff", padding: 30, borderRadius: 16, width: "100%", maxWidth: 500 }}>
                        <h2 style={{ margin: "0 0 20px" }}>{editingBook ? "Edit Book" : "Add New Book"}</h2>
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Book Title</label>
                                <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Author</label>
                                <input required value={formData.author} onChange={e => setFormData({ ...formData, author: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>ISBN</label>
                                    <input required value={formData.isbn} onChange={e => setFormData({ ...formData, isbn: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Category</label>
                                    <input required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Total Copies</label>
                                    <input required type="number" min="0" value={formData.total_copies} onChange={e => setFormData({ ...formData, total_copies: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                                </div>
                                {editingBook && (
                                    <div>
                                        <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Available Now</label>
                                        <input required type="number" min="0" max={formData.total_copies} value={formData.available_copies} onChange={e => setFormData({ ...formData, available_copies: e.target.value })} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e2e8f0" }} />
                                    </div>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                                <button type="submit" style={{ flex: 1, padding: 12, background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
                                    {editingBook ? "Update Book" : "Create Book Entry"}
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
