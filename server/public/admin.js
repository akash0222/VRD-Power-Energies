const $ = s => document.querySelector(s);
const loginPanel=$('#loginPanel'), dashboard=$('#dashboard'), loginStatus=$('#loginStatus'), dashStatus=$('#dashStatus');
let enquiries=[];
async function api(path, options={}) {
 const response=await fetch(path,{...options,headers:{'Content-Type':'application/json',...(options.headers||{})},credentials:'include'});
 const data=await response.json().catch(()=>({}));
 if(!response.ok) throw new Error(data.error||'Request failed');
 return data;
}
function showDashboard(){loginPanel.hidden=true;dashboard.hidden=false;load();}
function showLogin(){dashboard.hidden=true;loginPanel.hidden=false;}
async function load(){dashStatus.textContent='Loading…';try{const data=await api('/api/admin/enquiries');enquiries=data.enquiries||[];render();}catch(e){dashStatus.textContent=e.message;if(/sign in|unauthorized/i.test(e.message))showLogin();}}
function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function render(){const q=$('#search').value.toLowerCase(),status=$('#statusFilter').value;const list=enquiries.filter(x=>(!status||x.status===status)&&[x.name,x.email,x.company,x.interest,x.message].some(v=>String(v||'').toLowerCase().includes(q)));$('#summary').textContent=`${enquiries.length} total · ${enquiries.filter(x=>x.status==='New').length} new`;$('#enquiries').innerHTML=list.length?list.map(x=>`<article class="enquiry"><div><h3>${esc(x.name)} <span class="tag">${esc(x.status)}</span></h3><p>${esc(x.email)} · ${esc(x.company||'Individual customer')}</p><p><b>Interest:</b> ${esc(x.interest)} · <b>Quantity:</b> ${esc(x.quantity||'Not specified')} · <b>Timeline:</b> ${esc(x.timeline||'Not specified')}</p><p>${esc(x.message)}</p><p>${new Date(x.createdAt).toLocaleString()}</p></div><div class="enquiry-actions"><select aria-label="Update enquiry status" data-status-id="${esc(x.id)}"><option ${x.status==='New'?'selected':''}>New</option><option ${x.status==='Contacted'?'selected':''}>Contacted</option><option ${x.status==='Quoted'?'selected':''}>Quoted</option><option ${x.status==='Closed'?'selected':''}>Closed</option></select><a href="mailto:${encodeURIComponent(x.email)}?subject=${encodeURIComponent('Your enquiry to VRD Power Energies')}" class="tag">Email customer ↗</a></div></article>`).join(''):'<div class="empty">No enquiries match your filters.</div>';document.querySelectorAll('[data-status-id]').forEach(el=>el.addEventListener('change',async()=>{try{await api(`/api/admin/enquiries/${encodeURIComponent(el.dataset.statusId)}`,{method:'PATCH',body:JSON.stringify({status:el.value})});dashStatus.textContent='Status updated.';await load();}catch(e){dashStatus.textContent=e.message;}}));}
$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();loginStatus.textContent='Signing in…';const form=Object.fromEntries(new FormData(e.currentTarget));try{await api('/api/admin/login',{method:'POST',body:JSON.stringify(form)});showDashboard();}catch(err){loginStatus.textContent=err.message;}});
$('#logout').addEventListener('click',async()=>{try{await api('/api/admin/logout',{method:'POST'});}finally{enquiries=[];showLogin();}});
$('#search').addEventListener('input',render);$('#statusFilter').addEventListener('change',render);
api('/api/admin/me').then(showDashboard).catch(showLogin);