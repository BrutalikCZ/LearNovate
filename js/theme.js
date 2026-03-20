// ═══════════════════════════════════════════════════════════════
// THEME TOGGLE
// ═══════════════════════════════════════════════════════════════
import { state } from './state.js';

const htmlEl = document.documentElement;
const themeBtn = document.getElementById('themeBtn');

function updateThemeIcon() {
  const iconName = state.theme === 'dark' ? 'moon' : 'sun';
  themeBtn.innerHTML = `<i data-lucide="${iconName}"></i>`;
  lucide.createIcons({ nodes: themeBtn.querySelectorAll('[data-lucide]') });
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  htmlEl.setAttribute('data-theme', state.theme);
  localStorage.setItem('theme', state.theme);
  updateThemeIcon();
}

function initTheme() {
  htmlEl.setAttribute('data-theme', state.theme);
  updateThemeIcon();
  themeBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleTheme(); });
}

export { initTheme };
