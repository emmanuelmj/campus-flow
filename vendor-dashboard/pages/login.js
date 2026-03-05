import { useState } from 'react';
import { useRouter } from 'next/router';
import { login } from '../services/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await login(email, password);
      if (data.role !== 'VENDOR') { setError('Access denied: vendor accounts only.'); setLoading(false); return; }
      localStorage.setItem('token', data.access_token);
      router.push('/');
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const features = ['Accept payments from students instantly', 'Send payment requests to any student', 'Track daily revenue and transactions'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* Left panel */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #022c22 0%, #064e3b 60%, #022c22 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 72px' }}>
        <div style={{ maxWidth: 400 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            <svg width="24" height="24" viewBox="0 0 20 20" fill="white">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z"/>
            </svg>
          </div>
          <h1 style={{ color: '#f0fdf4', fontSize: 36, fontWeight: 800, margin: '0 0 12px', lineHeight: 1.15 }}>CampusFlow</h1>
          <p style={{ color: '#6ee7b7', fontSize: 16, margin: '0 0 40px', lineHeight: 1.65 }}>
            Your campus payment terminal. Fast, simple, cashless.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {features.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 20 20" fill="#34d399">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span style={{ color: '#a7f3d0', fontSize: 14 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 460, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: '48px 56px' }}>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>Vendor Sign In</h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 32px' }}>Access your payment dashboard.</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Email address</label>
              <input type="email" placeholder="canteen@campus.edu" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a', outline: 'none', boxSizing: 'border-box', background: '#f8fafc' }} />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#b91c1c', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ marginTop: 4, padding: '11px', background: loading ? '#6ee7b7' : 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 600, boxShadow: loading ? 'none' : '0 4px 14px rgba(16,185,129,0.35)' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
              <strong style={{ color: '#374151' }}>Demo:</strong> canteen@campus.edu / vendor123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
Login.noLayout = true;
