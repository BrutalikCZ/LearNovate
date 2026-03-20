// ═══════════════════════════════════════════════════════════════
// SIDEBAR — Category dropdown, search, sidebar interactions
// ═══════════════════════════════════════════════════════════════
import { state } from './state.js';
import { closeAllSortPanels } from './subjects.js';

const ddTrigger = document.getElementById('ddTrigger');
const ddPanel   = document.getElementById('ddPanel');

function closeCatDropdown() {
  state.catDropOpen = false;
  ddPanel.classList.remove('open');
  ddTrigger.classList.remove('open');
}

function initSidebar() {
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

  // Category filter checkboxes
  ddPanel.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const cat     = cb.dataset.cat;
      const visible = cb.checked;
      state.categories[cat] = visible;
      document.querySelector(`.category-section[data-section="${cat}"]`)?.classList.toggle('hidden', !visible);
      document.getElementById(`catHeader-${cat}`)?.classList.toggle('hidden', !visible);
      document.getElementById(`catItems-${cat}`)?.classList.toggle('hidden', !visible);
    });
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
