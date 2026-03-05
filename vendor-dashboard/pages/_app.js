import Link from 'next/link';
import { useRouter } from 'next/router';

const W = 240;

const PATHS = {
  dashboard:  'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z',
  request:    'M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z',
  deduct:     'M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z',
  ledger:     'M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z',
};

const NAV = [
  { href: '/',                  label: 'Dashboard',      icon: PATHS.dashboard },
  { href: '/request-payment',   label: 'Request Payment',icon: PATHS.request   },
  { href: '/request-deduct',    label: 'Request Deduct', icon: PATHS.deduct    },
  { href: '/transactions',      label: 'Transactions',   icon: PATHS.ledger    },
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
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('vendor_name');
    router.push('/login');
  };

  return (
    <aside style={{ width: W, position: 'fixed', top: 0, left: 0, bottom: 0, backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 50, boxShadow: '4px 0 24px rgba(0,0,0,0.15)' }}>

      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zm5.99 7.176A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z"/>
            </svg>
          </div>
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>CampusFlow</div>
            <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>Vendor Portal</div>
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
              color: active ? '#d1fae5' : '#64748b',
              backgroundColor: active ? 'rgba(16,185,129,0.12)' : 'transparent',
              fontSize: 14, fontWeight: active ? 600 : 400,
              borderLeft: `3px solid ${active ? '#10b981' : 'transparent'}`,
            }}>
              <SvgIcon d={item.icon} color={active ? '#34d399' : '#475569'} />
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
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
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
