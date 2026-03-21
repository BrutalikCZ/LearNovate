// ═══════════════════════════════════════════════════════════════
// LearNovate — Main Application Entry Point
// ═══════════════════════════════════════════════════════════════
//
// Project Structure:
//   js/
//   ├── app.js        ← this file (entry point, orchestration)
//   ├── state.js      ← global state management
//   ├── i18n.js       ← dynamic language switching
//   ├── theme.js      ← dark/light theme toggle
//   ├── auth.js       ← login, register, session
//   ├── modals.js     ← modal dialog management
//   ├── subjects.js   ← load & render subjects from API
//   ├── sidebar.js    ← sidebar interactions (dropdown, search)
//   └── router.js     ← navigation between views
//
// ═══════════════════════════════════════════════════════════════

import { initI18n } from './i18n.js';
import { initTheme } from './theme.js';
import { initAuth } from './auth.js';
import { initModals } from './modals.js';
import { loadSubjects } from './subjects.js';
import { initSidebar } from './sidebar.js';
import { initRouter } from './router.js';

// Initialize Lucide icons first
lucide.createIcons();

// i18n must be initialized before anything renders text
await initI18n();

// Initialize all modules
initTheme();
initModals();
initAuth();
initSidebar();
initRouter();

// Load subjects from API and render dynamically
loadSubjects();
