import Link from 'next/link';
import { useRouter } from 'next/router';

const W = 240;

const PATHS = {
  overview: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z',
  users: 'M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z',
  vendors: 'M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z',
  fines: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
  topup: 'M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z',
  deduct: 'M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z',
  deducreq: 'M9 2a1 1 0 000 2h2a1 1 0 100-2H9z',
  adduser: 'M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z',
  analytics: 'M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z',
  subs: 'M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z',
  library: 'M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z',
};

const NAV = [
  { href: '/', label: 'Overview', icon: PATHS.overview },
  { href: '/users', label: 'Users', icon: PATHS.users },
  { href: '/vendors', label: 'Vendors', icon: PATHS.vendors },
  { href: '/fines', label: 'Fines', icon: PATHS.fines },
  { href: '/library', label: 'Library Management', icon: PATHS.library },
  { href: '/add-user', label: 'Add User', icon: PATHS.adduser },
  { href: '/top-up', label: 'Top Up Wallet', icon: PATHS.topup },
  { href: '/deduct', label: 'Deduct Wallet', icon: PATHS.deduct },
  { href: '/deduct-requests', label: 'Deduct Requests', icon: PATHS.deducreq },
  { href: '/subscriptions', label: 'Subscriptions', icon: PATHS.subs },
  { href: '/analytics', label: 'Analytics', icon: PATHS.analytics },
];

function SvgIcon({ d, size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={color} style={{ flexShrink: 0 }}>
      <path fillRule="evenodd" d={d} clipRule="evenodd" />
    </svg>
  );
}

function Sidebar() {
  const router = useRouter();
  const logout = () => { localStorage.removeItem('token'); router.push('/login'); };

  return (
    <aside style={{ width: W, position: 'fixed', top: 0, left: 0, bottom: 0, backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 50, boxShadow: '4px 0 24px rgba(0,0,0,0.15)' }}>

      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
            </svg>
          </div>
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>CampusFlow</div>
            <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>Admin Portal</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 10px', overflowY: 'auto' }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px 10px' }}>Menu</p>
        {NAV.map(item => {
          const active = router.pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none',
              color: active ? '#e0e7ff' : '#64748b',
              backgroundColor: active ? 'rgba(99,102,241,0.15)' : 'transparent',
              fontSize: 14, fontWeight: active ? 600 : 400,
              borderLeft: `3px solid ${active ? '#6366f1' : 'transparent'}`,
              transition: 'all 0.15s',
            }}>
              <SvgIcon d={item.icon} color={active ? '#818cf8' : '#475569'} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 10px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '10px 12px', borderRadius: 8, background: 'transparent',
          border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 14, fontWeight: 500,
        }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="#475569" style={{ flexShrink: 0 }}>
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function App({ Component, pageProps }) {
  if (Component.noLayout) return <Component {...pageProps} />;
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar />
      <main style={{ marginLeft: W, flex: 1, minHeight: '100vh', padding: '32px 40px' }}>
        <Component {...pageProps} />
      </main>
    </div>
  );
}
