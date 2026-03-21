// ═══════════════════════════════════════════════════════════════
// i18n — Dynamic language switching (no external API)
// Supported: cs (Czech), en (English)
// ═══════════════════════════════════════════════════════════════

const SUPPORTED_LANGS = ['cs', 'en'];
const cache = {};

let translations = {};
let currentLang = localStorage.getItem('lang') || 'cs';

// ── Load translation file ──────────────────────────────────────
async function loadTranslations(lang) {
  if (cache[lang]) {
    translations = cache[lang];
    return;
  }
  const res = await fetch(`/locales/${lang}.json`);
  translations = await res.json();
  cache[lang] = translations;
}

// ── Translate key with optional variable interpolation ─────────
// Usage: t('milestone_completed', { n: 2, total: 5 })
function t(key, vars = {}) {
  let str = translations[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, v);
  }
  return str;
}

// ── Apply translations to all data-i18n elements in the DOM ───
// data-i18n="key"            → sets textContent
// data-i18n="key" data-i18n-attr="placeholder" → sets that attribute
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key  = el.dataset.i18n;
    const attr = el.dataset.i18nAttr;
    if (attr) {
      el.setAttribute(attr, t(key));
    } else {
      el.innerHTML = t(key);
    }
  });
  document.documentElement.lang = currentLang;
  document.title = t('title');
}

// ── Switch language ────────────────────────────────────────────
async function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  currentLang = lang;
  localStorage.setItem('lang', lang);
  await loadTranslations(lang);
  applyTranslations();
  // Notify other modules (subjects reload, etc.)
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

// ── Toggle between cs and en ───────────────────────────────────
async function toggleLanguage() {
  const next = currentLang === 'cs' ? 'en' : 'cs';
  await setLanguage(next);
}

function getLang() { return currentLang; }

// ── Init: load saved language and apply ────────────────────────
async function initI18n() {
  await loadTranslations(currentLang);
  applyTranslations();
}

export { initI18n, setLanguage, toggleLanguage, getLang, t, applyTranslations };
