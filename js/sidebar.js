// ═══════════════════════════════════════════════════════════════
// SIDEBAR — Category dropdown, search, sidebar interactions
// ═══════════════════════════════════════════════════════════════
import { state } from './state.js';
import { closeAllSortPanels } from './subjects.js';

const ddTrigger = document.getElementById('ddTrigger');
const ddPanel   = document.getElementById('ddPanel');

// ── Toast notification ───────────────────────────────────────
function showToast(message) {
  const existing = document.querySelector('.app-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'app-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => toast.classList.remove('visible'), 2500);
  setTimeout(() => toast.remove(), 3000);
}

window.showToast = showToast;

function closeCatDropdown() {
  state.catDropOpen = false;
  ddPanel.classList.remove('open');
  ddTrigger.classList.remove('open');
}

function initSidebar() {
  // Lang button — vícejazyčná podpora zatím není k dispozici
  const langBtn = document.getElementById('langBtn');
  if (langBtn) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showToast('Vícejazyčná podpora — připravujeme');
    });
  }

  // Category dropdown toggle
  ddPanel.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  ddTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    state.catDropOpen = !state.catDropOpen;
    ddPanel.classList.toggle('open', state.catDropOpen);
    ddTrigger.classList.toggle('open', state.catDropOpen);
  });

  // Category filter checkboxes (delegated to panel)
  ddPanel.addEventListener('change', (e) => {
    if (e.target.matches('input[type="checkbox"]')) {
      const cb = e.target;
      const cat     = cb.dataset.cat;
      const visible = cb.checked;
      state.categories[cat] = visible;
      document.querySelector(`.category-section[data-section="${cat}"]`)?.classList.toggle('hidden', !visible);
      document.getElementById(`catHeader-${cat}`)?.classList.toggle('hidden', !visible);
      document.getElementById(`catItems-${cat}`)?.classList.toggle('hidden', !visible);
    }
  });

  // Search
  document.getElementById('searchInput').addEventListener('input', function () {
    const q = this.value.toLowerCase().trim();

    document.querySelectorAll('.cat-item').forEach((item) => {
      const text = (item.querySelector('span').textContent + ' ' + (item.dataset.keywords || '')).toLowerCase();
      item.classList.toggle('hidden', q !== '' && !text.includes(q));
    });

    document.querySelectorAll('.subject-card').forEach((card) => {
      const text = (card.querySelector('.subject-card-label').textContent + ' ' + (card.dataset.keywords || '')).toLowerCase();
      card.classList.toggle('hidden', q !== '' && !text.includes(q));
    });

    document.querySelectorAll('.category-section').forEach((section) => {
      if (!state.categories[section.dataset.section]) return;
      const hasVisible = section.querySelectorAll('.subject-card:not(.hidden)').length > 0;
      section.classList.toggle('hidden', q !== '' && !hasVisible);
    });
  });

  // Global click to close floating panels
  document.addEventListener('click', () => {
    closeCatDropdown();
    closeAllSortPanels();
  });
}

export { initSidebar, closeCatDropdown };
