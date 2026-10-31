import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  BatteryCharging, LogOut, RefreshCw, Search, ShieldCheck, Inbox,
  Clock3, CheckCircle2, CircleDot, TrendingUp, MessageSquare, CalendarClock, Save, Mail, Send, Phone, ExternalLink
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
  const [expandedId, setExpandedId] = useState('');
  const [noteDrafts, setNoteDrafts] = useState({});
  const [followUpDrafts, setFollowUpDrafts] = useState({});
  const [emailDrafts, setEmailDrafts] = useState({});

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

  async function updateFollowUp(id, changes) {
    setSavingId(id); setError('');
    try {
      const data = await request('/api/admin/enquiries/' + id, { method: 'PATCH', body: JSON.stringify(changes) });
      setItems(current => current.map(item => item._id === id ? data.enquiry : item));
    } catch (err) { setError(err.message); }
    finally { setSavingId(''); }
  }

  async function logInteraction(id, details) {
    try {
      const data = await request('/api/admin/enquiries/' + id + '/interactions', { method: 'POST', body: JSON.stringify(details) });
      setItems(current => current.map(item => item._id === id ? data.enquiry : item));
    } catch (err) { setError(err.message); }
  }

  async function sendCustomerEmail(id) {
    const draft = emailDrafts[id] || {};
    setSavingId(id); setError('');
    try {
      const data = await request('/api/admin/enquiries/' + id + '/email', { method: 'POST', body: JSON.stringify({ subject: draft.subject || '', message: draft.message || '' }) });
      setItems(current => current.map(item => item._id === id ? data.enquiry : item));
      setEmailDrafts(current => ({ ...current, [id]: { subject: '', message: '' } }));
    } catch (err) { setError(err.message); }
    finally { setSavingId(''); }
  }

  async function addNote(id) {
    const text = (noteDrafts[id] || '').trim();
    if (!text) return;
    setSavingId(id); setError('');
    try {
      const data = await request('/api/admin/enquiries/' + id + '/notes', { method: 'POST', body: JSON.stringify({ text }) });
      setItems(current => current.map(item => item._id === id ? data.enquiry : item));
      setNoteDrafts(current => ({ ...current, [id]: '' }));
    } catch (err) { setError(err.message); }
    finally { setSavingId(''); }
  }

  function toLocalDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
  }

  function toUtcIso(value) {
    return value ? new Date(value).toISOString() : null;
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
    resolved: items.filter(item => item.status === 'resolved').length,
    overdue: items.filter(item => item.nextFollowUpAt && new Date(item.nextFollowUpAt) < new Date() && item.followUpStatus !== 'completed').length
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
      {counts.overdue > 0 && <div className="overdue-alert"><Clock3 size={17}/><span><b>{counts.overdue} overdue follow-up{counts.overdue === 1 ? '' : 's'}</b><small>Review the follow-up dates in the customer enquiry list.</small></span></div>}

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
          <thead><tr><th>Customer</th><th>Requirement</th><th>Details</th><th>Received</th><th>Status</th><th>Follow-up</th><th>Manage</th></tr></thead>
          <tbody>
            {visible.map(item => <Fragment key={item._id}><tr>
              <td><b>{item.name}</b><small>{item.phone}</small><small>{item.email || 'No email provided'}</small>{item.company && <small>{item.company}</small>}</td>
              <td>{item.category}<small>Quantity: {item.quantity || 'Not specified'}</small></td>
              <td className="message">{item.message}</td>
              <td>{new Date(item.createdAt).toLocaleString()}</td>
              <td><select aria-label={'Status for ' + item.name} className={'status ' + item.status} value={item.status} disabled={savingId === item._id} onChange={event => update(item._id, event.target.value)}><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></td>
              <td><span className={'followup-pill ' + (item.followUpStatus || 'pending')}>{(item.followUpStatus || 'pending').replaceAll('_', ' ')}</span>{item.nextFollowUpAt && <small>{new Date(item.nextFollowUpAt).toLocaleString()}</small>}</td>
              <td><button className="manage-btn" onClick={() => setExpandedId(expandedId === item._id ? '' : item._id)}>{expandedId === item._id ? 'Close' : 'Manage'}</button></td>
            </tr>
            {expandedId === item._id && <tr className="detail-row" key={item._id + '-details'}><td colSpan="7">
              <div className="followup-panel">
                <section><h3><CalendarClock size={16}/> Follow-up plan</h3>
                  <label>Follow-up status<select value={followUpDrafts[item._id]?.status ?? item.followUpStatus ?? 'pending'} onChange={event => setFollowUpDrafts(current => ({ ...current, [item._id]: { ...current[item._id], status: event.target.value } }))}><option value="pending">Pending</option><option value="contacted">Contacted</option><option value="follow_up_required">Follow-up required</option><option value="completed">Completed</option></select></label>
                  <label>Next follow-up date & time<input type="datetime-local" value={followUpDrafts[item._id]?.date ?? toLocalDateTime(item.nextFollowUpAt)} onChange={event => setFollowUpDrafts(current => ({ ...current, [item._id]: { ...current[item._id], date: event.target.value } }))}/></label>
                  <button className="primary small-primary" disabled={savingId === item._id} onClick={() => updateFollowUp(item._id, { followUpStatus: followUpDrafts[item._id]?.status ?? item.followUpStatus ?? 'pending', nextFollowUpAt: toUtcIso(followUpDrafts[item._id]?.date ?? toLocalDateTime(item.nextFollowUpAt)) })}><Save size={14}/> Save follow-up</button>
                </section>
                <section><h3><MessageSquare size={16}/> Internal notes</h3>
                  <div className="notes-list">{(item.notes || []).length ? [...item.notes].reverse().map(note => <article key={note._id}><p>{note.text}</p><small>{note.createdBy || 'admin'} · {new Date(note.createdAt).toLocaleString()}</small></article>) : <p className="no-notes">No internal notes yet.</p>}</div>
                  <textarea value={noteDrafts[item._id] || ''} maxLength={2000} placeholder="Add a private note about this customer interaction…" onChange={event => setNoteDrafts(current => ({ ...current, [item._id]: event.target.value }))}/>
                  <button className="primary small-primary" disabled={savingId === item._id || !(noteDrafts[item._id] || '').trim()} onClick={() => addNote(item._id)}><Save size={14}/> Add note</button>
                  <div className="communication-tools">
                    <h3><Phone size={16}/> Contact customer</h3>
                    <a className="contact-link whatsapp-link" href={"https://wa.me/" + (item.phone.replace(/\D/g, '').length === 10 ? "91" + item.phone.replace(/\D/g, '') : item.phone.replace(/\D/g, '')) + "?text=" + encodeURIComponent("Hello " + item.name + ", thank you for contacting VRD Power Energies. We are following up on your " + item.category + " enquiry.")} target="_blank" rel="noreferrer" onClick={() => logInteraction(item._id, { channel: 'whatsapp', outcome: 'opened', message: 'Opened WhatsApp conversation' })}><ExternalLink size={14}/> Open WhatsApp</a>
                    {item.email ? <div className="email-composer"><h3><Mail size={16}/> Send email to {item.email}</h3>
                      <input aria-label="Email subject" maxLength={180} placeholder="Subject" value={emailDrafts[item._id]?.subject || ''} onChange={event => setEmailDrafts(current => ({ ...current, [item._id]: { ...current[item._id], subject: event.target.value } }))}/>
                      <textarea aria-label="Email message" maxLength={5000} placeholder="Write a customer response…" value={emailDrafts[item._id]?.message || ''} onChange={event => setEmailDrafts(current => ({ ...current, [item._id]: { ...current[item._id], message: event.target.value } }))}/>
                      <button className="primary small-primary" disabled={savingId === item._id || !(emailDrafts[item._id]?.subject || '').trim() || !(emailDrafts[item._id]?.message || '').trim()} onClick={() => sendCustomerEmail(item._id)}><Send size={14}/> Send email</button>
                    </div> : <p className="no-notes">Customer did not provide an email address.</p>}
                  </div>
                  <div className="interaction-history"><h3>Communication history</h3>{(item.interactions || []).length ? [...item.interactions].reverse().map(entry => <article key={entry._id}><b>{entry.channel === 'whatsapp' ? 'WhatsApp' : 'Email'} · {entry.outcome}</b>{entry.subject && <p>{entry.subject}</p>}{entry.message && <p>{entry.message}</p>}<small>{entry.createdBy || 'admin'} · {new Date(entry.createdAt).toLocaleString()}</small></article>) : <p className="no-notes">No communication recorded yet.</p>}</div>
                </section>
              </div>
            </td></tr>}
            </Fragment>)}
            {!visible.length && <tr><td colSpan="7" className="empty">{loading ? 'Loading enquiries…' : search || status !== 'all' ? 'No enquiries match these filters.' : 'No enquiries received yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="footnote"><ShieldCheck size={15}/> Access is protected by server-side authentication. Handle customer details responsibly.</p>
    </section>
  </main>;
}
