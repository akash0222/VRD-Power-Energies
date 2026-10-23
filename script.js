const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  menuButton.textContent = open ? '×' : '☰';
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  if (menuButton) { menuButton.setAttribute('aria-label', 'Open navigation'); menuButton.textContent = '☰'; }
}));
document.getElementById('year').textContent = new Date().getFullYear();

const API_BASE = (window.VRD_CONFIG && window.VRD_CONFIG.API_BASE_URL) || '';
const form = document.getElementById('leadForm');
const status = document.getElementById('formStatus');
form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const button = form.querySelector('button[type="submit"]');
  const original = button.innerHTML;
  button.disabled = true;
  button.textContent = 'Sending…';
  status.textContent = 'Submitting your enquiry securely…';
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch(`${API_BASE}/api/enquiries`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Unable to submit right now.');
    status.textContent = 'Thank you. Your enquiry has been received. Our team will follow up.';
    form.reset();
  } catch (error) {
    status.textContent = 'We could not submit your enquiry online. Please contact us through WhatsApp using the button on this page.';
  } finally {
    button.disabled = false;
    button.innerHTML = original;
  }
});
document.querySelectorAll('[data-interest]').forEach(link => link.addEventListener('click', () => {
  const select = document.querySelector('select[name="interest"]');
  if (select) select.value = link.dataset.interest;
}));
