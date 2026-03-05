import re

API_JS   = "C:/Users/Aditya/OneDrive/Desktop/CF/campus-flow/admin-dashboard/services/api.js"
APP_JS   = "C:/Users/Aditya/OneDrive/Desktop/CF/campus-flow/admin-dashboard/pages/_app.js"
SUBS_JS  = "C:/Users/Aditya/OneDrive/Desktop/CF/campus-flow/admin-dashboard/pages/subscriptions.js"

# ── 1. Append to api.js ───────────────────────────────────────────────────────
api_addition = """
// ─── Mock subscriptions ───────────────────────────────────────────────────────
const MOCK_SUBSCRIPTIONS = [
  { subscription_id: 'sub-001', student_name: 'Alice Johnson', student_identifier: 'CS-2024-001', plan_name: 'Meal Plan - Standard', amount: 500, billing_cycle: 'MONTHLY', next_billing_date: new Date(Date.now() + 1000*60*60*24*15).toISOString(), vendor_name: 'Main Canteen', is_active: true },
  { subscription_id: 'sub-002', student_name: 'Bob Smith',    student_identifier: 'CS-2024-002', plan_name: 'Gym Membership',       amount: 200, billing_cycle: 'MONTHLY', next_billing_date: new Date(Date.now() + 1000*60*60*24*5).toISOString(),  vendor_name: null,          is_active: true },
  { subscription_id: 'sub-003', student_name: 'Carol White',  student_identifier: 'ME-2024-010', plan_name: 'Semester Bus Pass',    amount: 800, billing_cycle: 'SEMESTER', next_billing_date: new Date(Date.now() + 1000*60*60*24*90).toISOString(), vendor_name: null,          is_active: false },
];

export async function createSubscription(data) {
  if (MOCK_MODE) {
    const student = MOCK_USERS.find(u => u.role === 'STUDENT' && (u.student_id === data.student_identifier || u.email === data.student_identifier || u.name === data.student_identifier));
    if (!student) throw new Error('Student not found');
    if (data.immediate_charge && student.wallet_balance < data.amount) throw new Error('Insufficient balance');
    if (data.immediate_charge) student.wallet_balance -= data.amount;
    const newSub = { subscription_id: 'sub-' + Date.now(), student_name: student.name, student_identifier: student.student_id, plan_name: data.plan_name, amount: data.amount, billing_cycle: data.billing_cycle, next_billing_date: new Date(Date.now() + 1000*60*60*24*30).toISOString(), vendor_name: data.vendor_code || null, is_active: true };
    MOCK_SUBSCRIPTIONS.push(newSub);
    return { status: 'SUCCESS', message: 'Subscription created', subscription_id: newSub.subscription_id };
  }
  return handle(await fetch(`${API_URL}/admin/subscriptions`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) }));
}

export async function getSubscriptions() {
  if (MOCK_MODE) return MOCK_SUBSCRIPTIONS;
  return handle(await fetch(`${API_URL}/admin/subscriptions`, { headers: authHeaders() }));
}

export async function cancelSubscription(subId) {
  if (MOCK_MODE) {
    const s = MOCK_SUBSCRIPTIONS.find(x => x.subscription_id === subId);
    if (s) s.is_active = false;
    return { status: 'SUCCESS', message: 'Subscription cancelled' };
  }
  const id = subId.replace('sub-', '');
  return handle(await fetch(`${API_URL}/admin/subscriptions/${id}/cancel`, { method: 'POST', headers: authHeaders() }));
}
"""

with open(API_JS, "a", encoding="utf-8") as f:
    f.write(api_addition)
print("1. api.js updated")

# ── 2. Patch _app.js — add subs icon + nav item ───────────────────────────────
with open(APP_JS, "r", encoding="utf-8") as f:
    app_content = f.read()

# Add subs icon after analytics icon
old_analytics_line = "  analytics: 'M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z',"
new_analytics_line = ("  analytics: 'M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zm6-4a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zm6-3a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z',\n"
                      "  subs:      'M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z',")
app_content = app_content.replace(old_analytics_line, new_analytics_line)

# Add subscriptions nav item before analytics
old_analytics_nav = "  { href: '/analytics',       label: 'Analytics',       icon: PATHS.analytics },"
new_analytics_nav = ("  { href: '/subscriptions',   label: 'Subscriptions',   icon: PATHS.subs      },\n"
                     "  { href: '/analytics',       label: 'Analytics',       icon: PATHS.analytics },")
app_content = app_content.replace(old_analytics_nav, new_analytics_nav)

with open(APP_JS, "w", encoding="utf-8") as f:
    f.write(app_content)
print("2. _app.js updated")

# ── 3. Create subscriptions.js ────────────────────────────────────────────────
subs_page = r"""import { useState, useEffect } from 'react';
import { createSubscription, getSubscriptions, cancelSubscription } from '../services/api';

const CYCLES = ['MONTHLY', 'WEEKLY', 'SEMESTER'];

function fmt(iso) {
  if (!iso) return 'N/A';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Badge({ active }) {
  return (
    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
      backgroundColor: active ? '#dcfce7' : '#f1f5f9', color: active ? '#15803d' : '#64748b' }}>
      {active ? 'Active' : 'Cancelled'}
    </span>
  );
}

export default function Subscriptions() {
  const [subs, setSubs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]       = useState(null);
  const [err, setErr]       = useState(null);
  const [form, setForm]     = useState({ student_identifier: '', plan_name: '', amount: '', billing_cycle: 'MONTHLY', vendor_code: '', immediate_charge: true });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const load = async () => {
    try { setSubs(await getSubscriptions()); } catch(e) { setErr(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const flash = (m, isErr) => { isErr ? setErr(m) : setMsg(m); setTimeout(() => { setMsg(null); setErr(null); }, 3500); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.student_identifier || !form.plan_name || !form.amount) return flash('Fill in all required fields.', true);
    const amt = parseFloat(form.amount);
    if (isNaN(amt) || amt <= 0) return flash('Amount must be a positive number.', true);
    setSubmitting(true);
    try {
      const res = await createSubscription({ ...form, amount: amt, immediate_charge: form.immediate_charge });
      flash(res.message || 'Subscription created!', false);
      setForm({ student_identifier: '', plan_name: '', amount: '', billing_cycle: 'MONTHLY', vendor_code: '', immediate_charge: true });
      load();
    } catch(e) { flash(e.message, true); }
    setSubmitting(false);
  };

  const handleCancel = async (subId) => {
    if (!confirm('Cancel this subscription?')) return;
    try {
      await cancelSubscription(subId);
      flash('Subscription cancelled.', false);
      load();
    } catch(e) { flash(e.message, true); }
  };

  const displayed = filter === 'ALL' ? subs : subs.filter(s => filter === 'ACTIVE' ? s.is_active : !s.is_active);

  const totalActive = subs.filter(s => s.is_active).length;
  const monthlyVolume = subs.filter(s => s.is_active).reduce((a, s) => a + s.amount, 0);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>Subscriptions</h1>
      <p style={{ color: '#64748b', margin: '0 0 28px', fontSize: 14 }}>Create and manage recurring student subscriptions</p>

      {msg && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#15803d', fontWeight: 500 }}>{msg}</div>}
      {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#dc2626', fontWeight: 500 }}>{err}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Subscriptions', value: subs.length },
          { label: 'Active',              value: totalActive },
          { label: 'Monthly Volume',      value: 'Rs. ' + monthlyVolume.toLocaleString() },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'start' }}>

        {/* Create Form */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>Create Subscription</h2>
          <form onSubmit={handleSubmit}>
            {[
              { key: 'student_identifier', label: 'Student *', placeholder: 'ID, email, or name' },
              { key: 'plan_name',          label: 'Plan Name *', placeholder: 'e.g. Meal Plan - Standard' },
              { key: 'amount',             label: 'Amount (Rs.) *', placeholder: '0.00', type: 'number' },
              { key: 'vendor_code',        label: 'Vendor Code (optional)', placeholder: 'e.g. canteen-01' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>{f.label}</label>
                <input
                  type={f.type || 'text'}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Billing Cycle *</label>
              <select value={form.billing_cycle} onChange={e => setForm(p => ({ ...p, billing_cycle: e.target.value }))}
                style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 12px', fontSize: 14, boxSizing: 'border-box', background: '#fff' }}>
                {CYCLES.map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
              </select>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer', fontSize: 14, color: '#374151' }}>
              <input type="checkbox" checked={form.immediate_charge} onChange={e => setForm(p => ({ ...p, immediate_charge: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: '#4f46e5' }} />
              Charge first billing immediately
            </label>

            <button type="submit" disabled={submitting}
              style={{ width: '100%', padding: '11px', borderRadius: 8, background: submitting ? '#a5b4fc' : '#4f46e5', color: '#fff', border: 'none', fontWeight: 600, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer' }}>
              {submitting ? 'Creating...' : 'Create Subscription'}
            </button>
          </form>
        </div>

        {/* Subscriptions Table */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>All Subscriptions</h2>
            <div style={{ display: 'flex', gap: 6 }}>
              {['ALL','ACTIVE','CANCELLED'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    backgroundColor: filter === f ? '#4f46e5' : '#fff',
                    color: filter === f ? '#fff' : '#64748b',
                    borderColor: filter === f ? '#4f46e5' : '#e2e8f0' }}>
                  {f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading...</div>
          ) : displayed.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No subscriptions found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    {['Student','Plan','Amount','Cycle','Next Billing','Vendor','Status',''].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((s, i) => (
                    <tr key={s.subscription_id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '12px 16px', fontSize: 14 }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{s.student_name || 'N/A'}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>{s.student_identifier || ''}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#374151' }}>{s.plan_name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Rs. {s.amount.toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{s.billing_cycle.charAt(0) + s.billing_cycle.slice(1).toLowerCase()}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{fmt(s.next_billing_date)}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{s.vendor_name || '-'}</td>
                      <td style={{ padding: '12px 16px' }}><Badge active={s.is_active} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        {s.is_active && (
                          <button onClick={() => handleCancel(s.subscription_id)}
                            style={{ padding: '5px 12px', borderRadius: 6, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
"""

with open(SUBS_JS, "w", encoding="utf-8") as f:
    f.write(subs_page)
print("3. subscriptions.js created")
print("All done!")
