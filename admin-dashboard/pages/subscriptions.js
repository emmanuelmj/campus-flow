import { useState, useEffect } from 'react';
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
