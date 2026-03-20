// ═══════════════════════════════════════════════════════════════
// GLOBAL APPLICATION STATE
// ═══════════════════════════════════════════════════════════════

const state = {
  theme: localStorage.getItem('theme') || 'dark',
  catDropOpen: false,
  categories: { matematika: true, programovani: true, prvni_pomoc: true },
  collapsed:  { matematika: false, programovani: false, prvni_pomoc: false },
  currentUser: null,
  currentView: 'home',       // 'home' | 'subject'
  currentSubject: null,      // { id, name, description, icon, ... }
  subjectsData: [],          // loaded from API
  viewMode: 'grid',          // 'grid' | 'list'
};

// Category display name mapping
const CATEGORY_NAMES = {
  matematika: 'MATEMATIKA',
  programovani: 'PROGRAMOVÁNÍ',
  prvni_pomoc: 'PRVNÍ POMOC',
};

const CATEGORY_SHORT = {
  matematika: 'math',
  programovani: 'prog',
};

export { state, CATEGORY_NAMES, CATEGORY_SHORT };
