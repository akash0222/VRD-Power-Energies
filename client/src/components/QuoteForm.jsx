import { useState } from 'react';
import { submitEnquiry } from '../services/api';
export default function QuoteForm() {
 const [form,setForm] = useState({name:'',phone:'',email:'',company:'',category:'EV Batteries',quantity:'',message:''});
 const [state,setState] = useState({loading:false,error:'',success:''});
 const change = e => setForm({...form,[e.target.name]:e.target.value});
 async function handleSubmit(e){e.preventDefault();setState({loading:true,error:'',success:''});try{const r=await submitEnquiry(form);setState({loading:false,error:'',success:r.message || 'Thanks. Your enquiry has been received.'});setForm({name:'',phone:'',email:'',company:'',category:'EV Batteries',quantity:'',message:''});}catch(err){setState({loading:false,error:err.message,success:''});}}
 return <form className="quote-form" onSubmit={handleSubmit}><div className="form-grid">
 <label>Full name *<input name="name" value={form.name} onChange={change} required minLength="2" maxLength="100" autoComplete="name"/></label>
 <label>Phone number *<input name="phone" value={form.phone} onChange={change} required maxLength="25" autoComplete="tel" placeholder="+91..."/></label>
 <label>Email (optional)<input type="email" name="email" value={form.email} onChange={change} maxLength="254" autoComplete="email"/></label>
 <label>Company / business<input name="company" value={form.company} onChange={change} maxLength="120" autoComplete="organization"/></label>
 <label>Requirement *<select name="category" value={form.category} onChange={change}><option>EV Batteries</option><option>Energy Storage Batteries</option><option>Bulk / B2B Enquiry</option><option>Other</option></select></label>
 <label>Estimated quantity<input name="quantity" value={form.quantity} onChange={change} maxLength="80" placeholder="e.g. 10 units or to be discussed"/></label>
 <label className="full-field">Tell us about your requirement *<textarea name="message" value={form.message} onChange={change} required minLength="10" maxLength="3000" rows="5" placeholder="Application, preferred capacity or other details (if known)"/></label>
 </div><p className="form-note">Please do not include sensitive personal or payment information.</p>
 {state.error && <p className="notice error" role="alert">{state.error}</p>}{state.success && <p className="notice success" role="status">{state.success}</p>}
 <button className="button" disabled={state.loading}>{state.loading ? 'Sending…' : 'Send enquiry'}</button>
 <a className="whatsapp-inline" href="https://wa.me/919956191939?text=Hello%20VRD%20Power%20Energies%2C%20I%20would%20like%20to%20discuss%20a%20battery%20requirement." target="_blank" rel="noreferrer">Prefer WhatsApp? Chat with us</a>
 </form>;
}
