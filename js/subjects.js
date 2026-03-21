// ═══════════════════════════════════════════════════════════════
// SUBJECTS — Load subjects from API and render dynamically
// ═══════════════════════════════════════════════════════════════
import { state } from './state.js';
import { navigateToSubject, navigateHome } from './router.js';
import { t, getLang } from './i18n.js';

// ── Load subjects from API ──────────────────────────────────
async function loadSubjects() {
  try {
    const lang = getLang();
    const res = await fetch(`/api/subjects?lang=${lang}`);
    if (!res.ok) throw new Error('Failed to load subjects');
    state.subjectsData = await res.json();
    renderSidebar();
    renderCategoryDropdown();

    if (state.currentView === 'subject' && state.currentSubject) {
      const cat = state.subjectsData.find(c => c.id === state.currentSubject.categoryId);
      if (cat) {
        const subj = cat.subjects.find(s => s.id === state.currentSubject.id);
        if (subj) {
          navigateToSubject(cat.id, subj);
          return;
        }
      }
      navigateHome();
    } else {
      renderMainContent();
    }
  } catch (err) {
    console.error('Error loading subjects:', err);
  }
}

// ── Render Sidebar Category List ────────────────────────────
function renderSidebar() {
  const container = document.getElementById('categoryList');
  if (!container) return;
  container.innerHTML = '';

  state.subjectsData.forEach(category => {
    const catId = category.id;
    const catDisplayName = category.name || catId.toUpperCase();
    const subjects = category.subjects || [];

    if (state.collapsed[catId] === undefined) {
      state.collapsed[catId] = false;
    }

    const header = document.createElement('div');
    header.className = 'cat-header';
    header.id = `catHeader-${catId}`;
    header.innerHTML = `
      <i data-lucide="chevron-down" class="cat-arrow"></i>
      <span class="cat-name">${catDisplayName}</span>
      <span class="cat-count">(${subjects.length})</span>
    `;

    const items = document.createElement('div');
    items.className = 'cat-items';
    items.id = `catItems-${catId}`;

    subjects.forEach(subject => {
      const item = document.createElement('div');
      item.className = 'cat-item';
      item.dataset.keywords = `${subject.label || ''} ${subject.name || ''} ${catId}`.toLowerCase();
      item.dataset.subjectId = subject.id;
      item.dataset.categoryId = catId;
      item.innerHTML = `
        <i data-lucide="${subject.icon || 'book'}"></i>
        <span>${subject.name}</span>
      `;
      item.addEventListener('click', () => navigateToSubject(catId, subject));
      items.appendChild(item);
    });

    header.addEventListener('click', () => {
      state.collapsed[catId] = !state.collapsed[catId];
      header.classList.toggle('collapsed', state.collapsed[catId]);
      items.classList.toggle('collapsed', state.collapsed[catId]);
    });

    container.appendChild(header);
    container.appendChild(items);
  });

  lucide.createIcons({ nodes: container.querySelectorAll('[data-lucide]') });
}

// ── Render Main Content Grid ────────────────────────────────
function renderMainContent() {
  const main = document.getElementById('mainContent');
  if (!main) return;
  main.innerHTML = '';

  state.subjectsData.forEach(category => {
    const catId = category.id;
    const catDisplayName = category.name || catId.toUpperCase();
    const subjects = category.subjects || [];

    const isHidden = !state.categories[catId];

    const section = document.createElement('section');
    section.className = `category-section${isHidden ? ' hidden' : ''}`;
    section.dataset.section = catId;

    section.innerHTML = `
      <div class="category-header-area">
        <div class="category-title-row">
          <span class="category-title">${catDisplayName} (${subjects.length})</span>
          <div class="category-title-line"></div>
        </div>
        <div class="category-sort-row">
          <span class="sort-label">${t('sort_by')}</span>
          <div class="sort-btn" data-section="${catId}">
            <span class="sort-current">${t('sort_az_short')}</span>
            <i data-lucide="chevron-down"></i>
            <div class="sort-panel" id="sortPanel-${catId}">
              <div class="sort-option active" data-order="az">${t('sort_az')}</div>
              <div class="sort-option" data-order="za">${t('sort_za')}</div>
              <div class="sort-option" data-order="default">${t('sort_default')}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="subject-grid ${state.viewMode === 'list' ? 'list-view' : ''}" id="grid-${catId}"></div>
    `;

    const grid = section.querySelector('.subject-grid');

    subjects.forEach((subject, index) => {
      const card = document.createElement('div');
      card.className = `subject-card ${subject.cardClass || ''}`;
      card.dataset.index = index;
      card.dataset.keywords = `${(subject.label || '').toLowerCase()} ${(subject.name || '').toLowerCase()} ${catId}`;
      card.dataset.subjectId = subject.id;
      card.dataset.categoryId = catId;

      if (subject.colorFrom && subject.colorTo) {
        card.style.background = `linear-gradient(20deg, ${subject.colorFrom}, ${subject.colorTo})`;
      }

      card.innerHTML = `
        <i data-lucide="${subject.icon || 'book'}"></i>
        <span class="subject-card-label">${subject.label || subject.id.toUpperCase()}</span>
        <span class="subject-card-name">${subject.name}</span>
      `;

      card.addEventListener('click', () => navigateToSubject(catId, subject));
      grid.appendChild(card);
    });

    main.appendChild(section);
  });

  lucide.createIcons({ nodes: main.querySelectorAll('[data-lucide]') });
  initSortButtons();
}

// ── Sort Buttons Logic ──────────────────────────────────────
function closeAllSortPanels() {
  document.querySelectorAll('.sort-panel.open').forEach((p) => {
    p.classList.remove('open');
    p.closest('.sort-btn')?.classList.remove('open');
  });
}

function initSortButtons() {
  document.querySelectorAll('.sort-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const panel  = btn.querySelector('.sort-panel');
      const isOpen = panel.classList.contains('open');
      closeAllSortPanels();
      if (!isOpen) { panel.classList.add('open'); btn.classList.add('open'); }
    });
  });

  document.querySelectorAll('.sort-option').forEach((option) => {
    option.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn     = option.closest('.sort-btn');
      const panel   = option.closest('.sort-panel');
      const section = btn.closest('.category-section');
      const grid    = section.querySelector('.subject-grid');
      const order   = option.dataset.order;

      panel.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      const labels = { az: t('sort_az_short'), za: t('sort_za_short'), default: t('sort_default_short') };
      btn.querySelector('.sort-current').textContent = labels[order];

      const cards = Array.from(grid.querySelectorAll('.subject-card'));
      if (order === 'az') {
        cards.sort((a, b) => a.querySelector('.subject-card-label').textContent
          .localeCompare(b.querySelector('.subject-card-label').textContent));
      } else if (order === 'za') {
        cards.sort((a, b) => b.querySelector('.subject-card-label').textContent
          .localeCompare(a.querySelector('.subject-card-label').textContent));
      } else {
        cards.sort((a, b) => parseInt(a.dataset.index) - parseInt(b.dataset.index));
      }
      cards.forEach(c => grid.appendChild(c));
      closeAllSortPanels();
    });
  });
}

// ── Render Category Dropdown ────────────────────────────────
function renderCategoryDropdown() {
  const panel = document.getElementById('ddPanel');
  if (!panel) return;
  panel.innerHTML = '';

  state.subjectsData.forEach(category => {
    const catId = category.id;
    const catDisplayName = category.name || catId.toUpperCase();

    if (state.categories[catId] === undefined) {
      state.categories[catId] = true;
    }

    const label = document.createElement('label');
    label.className = 'dd-option';
    label.innerHTML = `
      <input type="checkbox" ${state.categories[catId] ? 'checked' : ''} data-cat="${catId}"> ${catDisplayName}
    `;

    panel.appendChild(label);
  });
}

// ── Reload everything on language change ────────────────────
window.addEventListener('langchange', () => {
  loadSubjects();
});

export { loadSubjects, renderMainContent, renderSidebar, closeAllSortPanels, renderCategoryDropdown };
