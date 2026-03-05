import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>CampusFlow Admin Dashboard</h1>
      <div style={{ display: 'flex', gap: 20, marginTop: 20 }}>
        <div style={{ padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
          <h2>Total Users</h2>
          <p style={{ fontSize: 24 }}>1,540</p>
        </div>
        <div style={{ padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
          <h2>Total Vendors</h2>
          <p style={{ fontSize: 24 }}>12</p>
        </div>
      </div>
      <ul style={{ marginTop: 40, lineHeight: '2' }}>
        <li><Link href="/users">Manage Users</Link></li>
        <li><Link href="/vendors">Manage Vendors</Link></li>
        <li><Link href="/fines">Issue Fines</Link></li>
        <li><Link href="/analytics">View Analytics</Link></li>
      </ul>
    </div>
  );
}
