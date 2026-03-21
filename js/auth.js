// ═══════════════════════════════════════════════════════════════
// AUTH — Login / Register / Session
// ═══════════════════════════════════════════════════════════════
import { state } from './state.js';
import { hideModals, showError, clearErrors_fn } from './modals.js';

// ── Token Helpers ────────────────────────────────────────────
function getToken()    { return localStorage.getItem('token'); }
function setToken(t)   { localStorage.setItem('token', t); }
function removeToken() { localStorage.removeItem('token'); }

// ── UI Helpers ───────────────────────────────────────────────
function setLoggedIn(user) {
  state.currentUser = user;
  document.getElementById('userBarName').textContent = user.username;
  document.getElementById('userBarBody').textContent = user.body ? `${user.body} ★` : '';
  document.getElementById('userBar').classList.remove('hidden');
  document.getElementById('loginBtn').classList.add('hidden');
  lucide.createIcons({ nodes: document.getElementById('userBar').querySelectorAll('[data-lucide]') });
}

function setLoggedOut() {
  state.currentUser = null;
  removeToken();
  document.getElementById('userBar').classList.add('hidden');
  document.getElementById('loginBtn').classList.remove('hidden');
}

// ── Restore session on load ─────────────────────────────────
async function restoreSession() {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { setLoggedOut(); return; }
    const user = await res.json();
    setLoggedIn(user);
  } catch {
    setLoggedOut();
  }
}

// ── Login ─────────────────────────────────────────────────────
async function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) { showError('loginError', 'Vyplňte prosím všechna pole.'); return; }
  if (!isValidEmail(email)) { showError('loginError', 'Zadejte platnou e-mailovou adresu.'); return; }

  try {
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { showError('loginError', data.error || 'Přihlášení selhalo.'); return; }

    setToken(data.token);
    setLoggedIn(data.user);
    hideModals();
    document.getElementById('loginEmail').value    = '';
    document.getElementById('loginPassword').value = '';
  } catch {
    showError('loginError', 'Nepodařilo se spojit se serverem.');
  }
}

// ── Register ──────────────────────────────────────────────────
async function handleRegister() {
  const email    = document.getElementById('regEmail').value.trim();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm  = document.getElementById('regConfirm').value;

  if (!email || !username || !password || !confirm) { showError('registerError', 'Vyplňte prosím všechna pole.'); return; }
  if (!isValidEmail(email))  { showError('registerError', 'Zadejte platnou e-mailovou adresu.'); return; }
  if (username.length < 3)   { showError('registerError', 'Uživatelské jméno musí mít alespoň 3 znaky.'); return; }
  if (password.length < 6)   { showError('registerError', 'Heslo musí mít alespoň 6 znaků.'); return; }
  if (password !== confirm)  { showError('registerError', 'Hesla se neshodují.'); return; }

  try {
    const res  = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });
    const data = await res.json();
    if (!res.ok) { showError('registerError', data.error || 'Registrace selhala.'); return; }

    setToken(data.token);
    setLoggedIn(data.user);
    hideModals();
    ['regEmail', 'regUsername', 'regPassword', 'regConfirm'].forEach(id => {
      document.getElementById(id).value = '';
    });
  } catch {
    showError('registerError', 'Nepodařilo se spojit se serverem.');
  }
}

// ── Helpers ───────────────────────────────────────────────────
function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

function initAuth() {
  restoreSession();

  document.getElementById('logoutBtn').addEventListener('click', () => {
    setLoggedOut();
    hideModals();
  });

  document.getElementById('loginPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('regConfirm').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  });
}

// Expose globally for onclick handlers in HTML
window.handleLogin    = handleLogin;
window.handleRegister = handleRegister;

export { initAuth };
