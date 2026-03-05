import Link from 'next/link';

export default function VendorDashboard() {
  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>CampusFlow Vendor Dashboard</h1>
      <p>Welcome, Main Canteen (canteen-01)</p>
      <div style={{ padding: 20, border: '1px solid #ccc', borderRadius: 8, maxWidth: 300, marginTop: 20 }}>
        <h2>Today's Revenue</h2>
        <p style={{ fontSize: 32, fontWeight: 'bold' }}>₹4,250</p>
      </div>
      <ul style={{ marginTop: 40, lineHeight: '2' }}>
        <li><Link href="/request-payment">Request Payment from Student</Link></li>
        <li><Link href="/transactions">View Daily Ledger</Link></li>
      </ul>
    </div>
  );
}
