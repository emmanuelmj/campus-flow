import { useState } from 'react';

export default function RequestPayment() {
  const [student, setStudent] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>Request Payment</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15, maxWidth: 300 }}>
        <input placeholder="Student ID" value={student} onChange={e => setStudent(e.target.value)} style={{ padding: 10 }} />
        <input placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} style={{ padding: 10 }} />
        <button style={{ padding: 10, cursor: 'pointer' }} onClick={() => alert('Request sent!')}>Send Request</button>
      </div>
    </div>
  );
}
