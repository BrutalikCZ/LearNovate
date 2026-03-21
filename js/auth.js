// ═══════════════════════════════════════════════════════════════
// AUTH — Login / Register / Session
// ═══════════════════════════════════════════════════════════════
import { state } from './state.js';
import { hideModals, showError, clearErrors_fn } from './modals.js';
import { t } from './i18n.js';
import { getLevelInfo, showAchievementToast, openProfileModal } from './gamification.js';

// ── Token Helpers ────────────────────────────────────────────
function getToken()    { return localStorage.getItem('token'); }
function setToken(tok) { localStorage.setItem('token', tok); }
function removeToken() { localStorage.removeItem('token'); }

// ── UI Helpers ───────────────────────────────────────────────
function setLoggedIn(user, newlyUnlocked = []) {
  state.currentUser = user;
  const info = getLevelInfo(user.body || 0);
  const streak = user.currentStreak || 0;

  document.getElementById('userBarName').textContent = user.username;
  document.getElementById('userBarBody').textContent = `${user.body || 0} ★`;

  // Level badge
  let levelBadgeEl = document.getElementById('userBarLevel');
  if (!levelBadgeEl) {
    levelBadgeEl = document.createElement('span');
    levelBadgeEl.id = 'userBarLevel';
    levelBadgeEl.className = 'user-bar-level';
    const body = document.getElementById('userBarBody');
    body.parentNode.insertBefore(levelBadgeEl, body.nextSibling);
  }
  levelBadgeEl.textContent = `LVL ${info.current.level}`;

  // Streak badge
  let streakEl = document.getElementById('userBarStreak');
  if (!streakEl) {
    streakEl = document.createElement('span');
    streakEl.id = 'userBarStreak';
    streakEl.className = 'user-bar-streak';
    const levelEl = document.getElementById('userBarLevel');
    levelEl.parentNode.insertBefore(streakEl, levelEl.nextSibling);
  }
  if (streak > 0) {
    streakEl.innerHTML = `<i data-lucide="flame"></i><span>${streak}</span>`;
    streakEl.classList.remove('hidden');
    lucide.createIcons({ nodes: streakEl.querySelectorAll('[data-lucide]') });
  } else {
    streakEl.classList.add('hidden');
  }

  document.getElementById('userBar').classList.remove('hidden');
  document.getElementById('loginBtn').classList.add('hidden');
  lucide.createIcons({ nodes: document.getElementById('userBar').querySelectorAll('[data-lucide]') });

  // Show achievement toasts for newly unlocked
  if (newlyUnlocked && newlyUnlocked.length) {
    newlyUnlocked.forEach((id, i) => {
      setTimeout(() => showAchievementToast(id), i * 1200);
    });
  }
}

function updateUserBar(user, newlyUnlocked = []) {
  setLoggedIn(user, newlyUnlocked);
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

  if (!email || !password) { showError('loginError', t('err_fill_all')); return; }
  if (!isValidEmail(email)) { showError('loginError', t('err_invalid_email')); return; }

  try {
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) { showError('loginError', data.error || t('err_login_failed')); return; }

    setToken(data.token);
    setLoggedIn(data.user, data.newlyUnlocked || []);
    hideModals();
    document.getElementById('loginEmail').value    = '';
    document.getElementById('loginPassword').value = '';
  } catch {
    showError('loginError', t('err_server'));
  }
}

// ── Register ──────────────────────────────────────────────────
async function handleRegister() {
  const email    = document.getElementById('regEmail').value.trim();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm  = document.getElementById('regConfirm').value;

  const gdprConsent = document.getElementById('regGdprConsent')?.checked;
  if (!email || !username || !password || !confirm) { showError('registerError', t('err_fill_all')); return; }
  if (!isValidEmail(email))  { showError('registerError', t('err_invalid_email')); return; }
  if (username.length < 3)   { showError('registerError', t('err_username_min')); return; }
  if (password.length < 6)   { showError('registerError', t('err_password_min')); return; }
  if (password !== confirm)  { showError('registerError', t('err_password_match')); return; }
  if (!gdprConsent)          { showError('registerError', t('err_gdpr_consent')); return; }

  try {
    const res  = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password }),
    });
    const data = await res.json();
    if (!res.ok) { showError('registerError', data.error || t('err_register_failed')); return; }

    setToken(data.token);
    setLoggedIn(data.user, data.newlyUnlocked || []);
    hideModals();
    ['regEmail', 'regUsername', 'regPassword', 'regConfirm'].forEach(id => {
      document.getElementById(id).value = '';
    });
    const consent = document.getElementById('regGdprConsent');
    if (consent) consent.checked = false;
  } catch {
    showError('registerError', t('err_server'));
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

  // Click on username / avatar to open profile
  const userBar = document.getElementById('userBar');
  if (userBar) {
    userBar.addEventListener('click', (e) => {
      if (e.target.closest('#logoutBtn')) return;
      if (state.currentUser) openProfileModal(state.currentUser);
    });
  }

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

export { initAuth, updateUserBar };
