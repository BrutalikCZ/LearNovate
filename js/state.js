// ═══════════════════════════════════════════════════════════════
// GLOBAL APPLICATION STATE
// ═══════════════════════════════════════════════════════════════

const state = {
  theme: localStorage.getItem('theme') || 'dark',
  lang: localStorage.getItem('lang') || 'cs',
  catDropOpen: false,
  categories: {},
  collapsed:  {},
  currentUser: null,
  currentView: 'home',       // 'home' | 'subject'
  currentSubject: null,      // { id, name, description, icon, ... }
  subjectsData: [],          // loaded from API
  viewMode: 'grid',          // 'grid' | 'list'
};

export { state };
