import { useEffect, useMemo, useState } from 'react';
import {
  BatteryCharging, LogOut, RefreshCw, Search, ShieldCheck, Inbox,
  Clock3, CheckCircle2, CircleDot, TrendingUp
} from 'lucide-react';

const DEFAULT_API_URL = import.meta.env.PROD
  ? 'https://vrd-power-energies.onrender.com'
  : 'http://localhost:5000';
const API = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(API + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed. Please try again.');
  return data;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All enquiries' },
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' }
];

export default function App() {
  const [auth, setAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await request('/api/admin/enquiries');
      setItems(data.enquiries || []);
      setAuth(true);
    } catch (err) {
      if (/auth|token|login|unauthor/i.test(err.message)) setAuth(false);
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function login(event) {
    event.preventDefault();
    setError('');
    try {
      await request('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setPassword('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function update(id, nextStatus) {
    setSavingId(id);
    setError('');
    try {
      const data = await request('/api/admin/enquiries/' + id, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      setItems(current => current.map(item => item._id === id ? data.enquiry : item));
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId('');
    }
  }

  async function logout() {
    try { await request('/api/admin/logout', { method: 'POST', body: '{}' }); } catch {}
    setAuth(false);
    setItems([]);
  }

  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    total: items.length,
    fresh: items.filter(item => item.status === 'new').length,
    progress: items.filter(item => item.status === 'in_progress').length,
    resolved: items.filter(item => item.status === 'resolved').length
  }), [items]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(item => {
      const matchesStatus = status === 'all' || item.status === status;
      const haystack = [item.name, item.phone, item.email, item.company, item.category, item.message]
        .join(' ').toLowerCase();
      return matchesStatus && (!term || haystack.includes(term));
    });
  }, [items, search, status]);

  if (!auth) {
    return <main className="login-shell">
      <form className="login-card" onSubmit={login}>
        <div className="logo"><BatteryCharging /></div>
        <span className="eyebrow">VRD POWER ENERGIES</span>
        <h1>Admin sign in</h1>
        <p>Sign in to review customer enquiries.</p>
        <label>Email<input type="email" required value={email} onChange={event => setEmail(event.target.value)} autoComplete="username" /></label>
        <label>Password<input type="password" required value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" /></label>
        {error && <div className="error" role="alert">{error}</div>}
        <button className="primary" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        <small>Credentials are configured on the API server.</small>
      </form>
    </main>;
  }

  return <main className="dashboard">
    <header className="topbar">
      <div className="brand"><span className="logo"><BatteryCharging /></span><div><b>VRD POWER ENERGIES</b><small>Enquiry management</small></div></div>
      <div className="top-actions">
        <button className="icon-btn" onClick={load} aria-label="Refresh enquiries" disabled={loading}><RefreshCw size={17} className={loading ? 'spin' : ''} /> Refresh</button>
        <button className="icon-btn" onClick={logout}><LogOut size={17} /> Sign out</button>
      </div>
    </header>

    <section className="content">
      <div className="heading">
        <div><span className="eyebrow">ADMINISTRATION</span><h1>Enquiry overview</h1><p>Track incoming requests and manage customer follow-ups.</p></div>
        <div className="heading-note"><TrendingUp size={17}/><span>Live enquiry summary</span></div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <div className="metric-grid">
        <button className={'metric-card metric-total ' + (status === 'all' ? 'selected' : '')} onClick={() => setStatus('all')}>
          <span className="metric-icon"><Inbox size={19}/></span><span className="metric-copy"><small>Total enquiries</small><strong>{counts.total}</strong><em>All received requests</em></span>
        </button>
        <button className={'metric-card metric-new ' + (status === 'new' ? 'selected' : '')} onClick={() => setStatus('new')}>
          <span className="metric-icon"><CircleDot size={19}/></span><span className="metric-copy"><small>New</small><strong>{counts.fresh}</strong><em>Awaiting review</em></span>
        </button>
        <button className={'metric-card metric-progress ' + (status === 'in_progress' ? 'selected' : '')} onClick={() => setStatus('in_progress')}>
          <span className="metric-icon"><Clock3 size={19}/></span><span className="metric-copy"><small>In progress</small><strong>{counts.progress}</strong><em>Being followed up</em></span>
        </button>
        <button className={'metric-card metric-resolved ' + (status === 'resolved' ? 'selected' : '')} onClick={() => setStatus('resolved')}>
          <span className="metric-icon"><CheckCircle2 size={19}/></span><span className="metric-copy"><small>Resolved</small><strong>{counts.resolved}</strong><em>Completed requests</em></span>
        </button>
      </div>

      <div className="section-heading"><div><h2>Customer enquiries</h2><p>{visible.length} of {items.length} enquiries shown</p></div></div>
      <div className="filters">
        <div className="search"><Search size={17}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, phone, company, requirement…" aria-label="Search enquiries"/></div>
        <select value={status} onChange={event => setStatus(event.target.value)} aria-label="Filter by status">{STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      </div>

      <div className="table-wrap">
        <table>
          <thead><tr><th>Customer</th><th>Requirement</th><th>Details</th><th>Received</th><th>Status</th></tr></thead>
          <tbody>
            {visible.map(item => <tr key={item._id}>
              <td><b>{item.name}</b><small>{item.phone}</small><small>{item.email || 'No email provided'}</small>{item.company && <small>{item.company}</small>}</td>
              <td>{item.category}<small>Quantity: {item.quantity || 'Not specified'}</small></td>
              <td className="message">{item.message}</td>
              <td>{new Date(item.createdAt).toLocaleString()}</td>
              <td><select aria-label={'Status for ' + item.name} className={'status ' + item.status} value={item.status} disabled={savingId === item._id} onChange={event => update(item._id, event.target.value)}><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></td>
            </tr>)}
            {!visible.length && <tr><td colSpan="5" className="empty">{loading ? 'Loading enquiries…' : search || status !== 'all' ? 'No enquiries match these filters.' : 'No enquiries received yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="footnote"><ShieldCheck size={15}/> Access is protected by server-side authentication. Handle customer details responsibly.</p>
    </section>
  </main>;
}
