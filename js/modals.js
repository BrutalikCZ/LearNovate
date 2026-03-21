// ═══════════════════════════════════════════════════════════════
// MODALS — Login / Register modals
// ═══════════════════════════════════════════════════════════════

function showModal(type) {
  document.getElementById('loginModal').classList.toggle('active', type === 'login');
  document.getElementById('registerModal').classList.toggle('active', type === 'register');
  clearErrors();
}

function hideModals() {
  document.getElementById('loginModal').classList.remove('active');
  document.getElementById('registerModal').classList.remove('active');
  clearErrors();
}

function switchModal(type) { showModal(type); }

function clearErrors() {
  document.getElementById('loginError').classList.remove('visible');
  document.getElementById('registerError').classList.remove('visible');
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.classList.add('visible');
}

function initModals() {
  ['loginModal', 'registerModal'].forEach(id => {
    document.getElementById(id).addEventListener('click', function (e) {
      if (e.target === this) hideModals();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideModals();
      document.getElementById('profileModal')?.classList.remove('open');
      document.getElementById('leaderboardModal')?.classList.remove('open');
    }
  });
}

// Globally exposed for onclick attributes in HTML
window.showModal   = showModal;
window.switchModal = switchModal;
window.hideModals  = hideModals;

export { initModals, showModal, hideModals, switchModal, clearErrors as clearErrors_fn, showError };
