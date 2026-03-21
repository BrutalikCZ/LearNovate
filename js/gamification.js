// ═══════════════════════════════════════════════════════════════
// GAMIFICATION — Levels, Achievements, Animations, Modals
// ═══════════════════════════════════════════════════════════════
import { t } from './i18n.js';

// ── Level Definitions ────────────────────────────────────────
const LEVELS = [
  { level: 1,  name: 'Nováček',     nameEn: 'Newcomer',      xp: 0    },
  { level: 2,  name: 'Zvědavec',    nameEn: 'Curious',       xp: 100  },
  { level: 3,  name: 'Student',     nameEn: 'Student',       xp: 250  },
  { level: 4,  name: 'Praktikant',  nameEn: 'Apprentice',    xp: 500  },
  { level: 5,  name: 'Záchranář',   nameEn: 'Rescuer',       xp: 900  },
  { level: 6,  name: 'Expert',      nameEn: 'Expert',        xp: 1400 },
  { level: 7,  name: 'Průvodce',    nameEn: 'Guide',         xp: 2000 },
  { level: 8,  name: 'Zkušený',     nameEn: 'Seasoned',      xp: 2800 },
  { level: 9,  name: 'Veterán',     nameEn: 'Veteran',       xp: 3800 },
  { level: 10, name: 'Mistr',       nameEn: 'Master',        xp: 5000 },
  { level: 11, name: 'Legenda',     nameEn: 'Legend',        xp: 6500 },
  { level: 12, name: 'Nesmrtelný',  nameEn: 'Immortal',      xp: 8500 },
];

// ── Achievement Definitions ──────────────────────────────────
const ACHIEVEMENTS = [
  { id: 'first_scenario', name: 'První krok',      nameEn: 'First Step',      icon: 'play-circle',  desc: 'Dokonči svůj první scénář',     descEn: 'Complete your first scenario',   color: '#3b82f6' },
  { id: 'scenarios_5',    name: 'Pilný student',   nameEn: 'Diligent',        icon: 'book-open',    desc: 'Dokonči 5 scénářů',             descEn: 'Complete 5 scenarios',           color: '#8b5cf6' },
  { id: 'scenarios_20',   name: 'Neúnavný',        nameEn: 'Tireless',        icon: 'award',        desc: 'Dokonči 20 scénářů',            descEn: 'Complete 20 scenarios',          color: '#f59e0b' },
  { id: 'streak_3',       name: 'Disciplinovaný',  nameEn: 'Disciplined',     icon: 'flame',        desc: '3 dny v řadě',                  descEn: '3 days in a row',                color: '#ef4444' },
  { id: 'streak_7',       name: 'Týdenní hrdina',  nameEn: 'Weekly Hero',     icon: 'zap',          desc: '7 dní v řadě',                  descEn: '7 days in a row',                color: '#f97316' },
  { id: 'points_100',     name: 'Začínám',         nameEn: 'Getting Started', icon: 'star',         desc: 'Získej 100 bodů',               descEn: 'Earn 100 points',                color: '#eab308' },
  { id: 'points_500',     name: 'Sběratel bodů',   nameEn: 'Point Hunter',    icon: 'trophy',       desc: 'Získej 500 bodů',               descEn: 'Earn 500 points',                color: '#22c55e' },
  { id: 'level_5',        name: 'Na vzestupu',     nameEn: 'Rising',          icon: 'trending-up',  desc: 'Dosáhni úrovně 5',              descEn: 'Reach level 5',                  color: '#06b6d4' },
];

// ── Level Calculation ────────────────────────────────────────
function getLevelInfo(xp) {
  let currentIdx = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) { currentIdx = i; break; }
  }
  const current = LEVELS[currentIdx];
  const next = LEVELS[currentIdx + 1] || null;
  const progress = next
    ? Math.min(100, Math.round(((xp - current.xp) / (next.xp - current.xp)) * 100))
    : 100;
  const xpIntoLevel = xp - current.xp;
  const xpNeeded = next ? (next.xp - current.xp) : 0;
  return { current, next, progress, xpIntoLevel, xpNeeded, xp };
}

function getLevelName(info, lang) {
  return lang === 'en' ? info.current.nameEn : info.current.name;
}

// ── Floating XP Number Animation ────────────────────────────
function showXpFloat(points, anchorEl) {
  if (!points || points <= 0) return;
  const el = document.createElement('div');
  el.className = 'xp-float';
  el.textContent = `+${points} ★`;
  document.body.appendChild(el);

  const rect = anchorEl ? anchorEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
  el.style.left = `${rect.left + rect.width / 2}px`;
  el.style.top = `${rect.top}px`;

  requestAnimationFrame(() => {
    el.classList.add('xp-float-active');
  });
  setTimeout(() => el.remove(), 1200);
}

// ── Confetti ─────────────────────────────────────────────────
function launchConfetti() {
  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'];
  const count = 60;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti-particle';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const x = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const size = 6 + Math.random() * 8;
      const duration = 1.5 + Math.random() * 1.5;
      el.style.cssText = `
        left: ${x}vw;
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        animation-delay: ${delay}s;
        animation-duration: ${duration}s;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), (delay + duration + 0.2) * 1000);
    }, i * 15);
  }
}

// ── Level-Up Banner ──────────────────────────────────────────
function showLevelUpBanner(levelInfo, container) {
  const banner = document.createElement('div');
  banner.className = 'level-up-banner';
  const lang = localStorage.getItem('lang') || 'cs';
  const levelName = getLevelName(levelInfo, lang);
  banner.innerHTML = `
    <div class="level-up-inner">
      <div class="level-up-icon"><i data-lucide="arrow-up-circle"></i></div>
      <div class="level-up-text">
        <span class="level-up-title">LEVEL UP!</span>
        <span class="level-up-sub">Úroveň ${levelInfo.current.level} — ${levelName}</span>
      </div>
    </div>
  `;
  container.appendChild(banner);
  lucide.createIcons({ nodes: banner.querySelectorAll('[data-lucide]') });
  container.scrollTop = container.scrollHeight;
  setTimeout(() => banner.classList.add('level-up-fade'), 3500);
  setTimeout(() => banner.remove(), 4200);
}

// ── Achievement Unlock Toast ─────────────────────────────────
function showAchievementToast(achievementId) {
  const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!ach) return;
  const lang = localStorage.getItem('lang') || 'cs';

  const el = document.createElement('div');
  el.className = 'achievement-toast';
  el.innerHTML = `
    <div class="achievement-toast-icon" style="color:${ach.color}">
      <i data-lucide="${ach.icon}"></i>
    </div>
    <div class="achievement-toast-text">
      <span class="achievement-toast-title">${lang === 'en' ? 'Achievement unlocked!' : 'Odměna odemčena!'}</span>
      <span class="achievement-toast-name">${lang === 'en' ? ach.nameEn : ach.name}</span>
    </div>
  `;
  document.body.appendChild(el);
  lucide.createIcons({ nodes: el.querySelectorAll('[data-lucide]') });

  requestAnimationFrame(() => el.classList.add('achievement-toast-visible'));
  setTimeout(() => el.classList.remove('achievement-toast-visible'), 3000);
  setTimeout(() => el.remove(), 3500);
}

// ── Profile Modal ────────────────────────────────────────────
function openProfileModal(user) {
  const lang = localStorage.getItem('lang') || 'cs';
  const info = getLevelInfo(user.body || 0);
  const levelName = getLevelName(info, lang);
  const streak = user.currentStreak || 0;
  const totalScenarios = user.totalScenarios || 0;
  const userAchievements = user.achievements || [];

  // Avatar initials
  const initials = (user.username || '?').slice(0, 2).toUpperCase();

  // XP bar
  const progressPct = info.progress;
  const xpDisplay = info.next
    ? `${info.xpIntoLevel} / ${info.xpNeeded} XP`
    : `${user.body || 0} XP (MAX)`;

  // Achievement grid
  let achHtml = '';
  ACHIEVEMENTS.forEach(ach => {
    const unlocked = userAchievements.includes(ach.id);
    const name = lang === 'en' ? ach.nameEn : ach.name;
    const desc = lang === 'en' ? ach.descEn : ach.desc;
    achHtml += `
      <div class="ach-badge ${unlocked ? 'unlocked' : 'locked'}" title="${desc}" style="${unlocked ? `--ach-color:${ach.color}` : ''}">
        <i data-lucide="${ach.icon}"></i>
        <span>${name}</span>
      </div>
    `;
  });

  const modal = document.getElementById('profileModal');
  document.getElementById('profileModalContent').innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${initials}</div>
      <div class="profile-info">
        <span class="profile-username">${user.username}</span>
        <div class="profile-level-badge">
          <span class="plb-num">LVL ${info.current.level}</span>
          <span class="plb-name">${levelName}</span>
        </div>
      </div>
      ${streak > 0 ? `<div class="profile-streak"><i data-lucide="flame"></i><span>${streak}</span></div>` : ''}
    </div>

    <div class="profile-xp-section">
      <div class="profile-xp-labels">
        <span>${info.xpIntoLevel} XP</span>
        <span>${info.next ? `${info.next.xp} XP — ${lang === 'en' ? info.next.nameEn : info.next.name}` : lang === 'en' ? 'MAX LEVEL' : 'MAX ÚROVEŇ'}</span>
      </div>
      <div class="profile-xp-bar">
        <div class="profile-xp-fill" style="width: ${progressPct}%"></div>
      </div>
    </div>

    <div class="profile-stats-grid">
      <div class="profile-stat">
        <span class="profile-stat-val">${user.body || 0}</span>
        <span class="profile-stat-label">${lang === 'en' ? 'Total XP' : 'Celkem XP'}</span>
      </div>
      <div class="profile-stat">
        <span class="profile-stat-val">${totalScenarios}</span>
        <span class="profile-stat-label">${lang === 'en' ? 'Scenarios' : 'Scénáře'}</span>
      </div>
      <div class="profile-stat">
        <span class="profile-stat-val ${streak > 0 ? 'stat-streak' : ''}">${streak > 0 ? '🔥' : '—'} ${streak}</span>
        <span class="profile-stat-label">${lang === 'en' ? 'Day Streak' : 'Dní v řadě'}</span>
      </div>
    </div>

    <div class="profile-achievements-section">
      <h3 class="profile-section-title">${lang === 'en' ? 'Achievements' : 'Odměny'} <span class="ach-count">${userAchievements.length}/${ACHIEVEMENTS.length}</span></h3>
      <div class="ach-grid">${achHtml}</div>
    </div>
  `;

  lucide.createIcons({ nodes: modal.querySelectorAll('[data-lucide]') });
  modal.classList.add('open');
}

function closeProfileModal() {
  document.getElementById('profileModal').classList.remove('open');
}

// ── Leaderboard Modal ────────────────────────────────────────
async function openLeaderboardModal() {
  const lang = localStorage.getItem('lang') || 'cs';
  const modal = document.getElementById('leaderboardModal');
  const content = document.getElementById('leaderboardContent');

  content.innerHTML = `<div class="lb-loading"><div class="loading-spinner"></div></div>`;
  modal.classList.add('open');

  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch('/api/gamification/leaderboard', { headers });
    const data = await res.json();

    if (!data.length) {
      content.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:24px">${lang === 'en' ? 'No players yet.' : 'Zatím žádní hráči.'}</p>`;
      return;
    }

    const rankIcons = ['🥇', '🥈', '🥉'];
    content.innerHTML = data.map((entry, i) => {
      const info = getLevelInfo(entry.body || 0);
      const levelName = getLevelName(info, lang);
      const isMe = entry.isMe ? ' lb-me' : '';
      const rank = i < 3 ? `<span class="lb-rank-icon">${rankIcons[i]}</span>` : `<span class="lb-rank-num">#${i + 1}</span>`;
      return `
        <div class="lb-row${isMe}">
          <div class="lb-rank">${rank}</div>
          <div class="lb-user">
            <span class="lb-username">${entry.username}${entry.isMe ? ' <span class="lb-you-tag">(ty)</span>' : ''}</span>
            <span class="lb-level">${lang === 'en' ? 'Lv' : 'Úr'} ${info.current.level} · ${levelName}</span>
          </div>
          <div class="lb-xp"><span class="lb-xp-val">${entry.body || 0}</span><span class="lb-xp-label"> XP</span></div>
        </div>
      `;
    }).join('');
  } catch {
    content.innerHTML = `<p style="text-align:center;color:var(--text-muted);padding:24px">${lang === 'en' ? 'Could not load leaderboard.' : 'Žebříček se nepodařilo načíst.'}</p>`;
  }
}

function closeLeaderboardModal() {
  document.getElementById('leaderboardModal').classList.remove('open');
}

window.closeProfileModal = closeProfileModal;
window.closeLeaderboardModal = closeLeaderboardModal;
window.openLeaderboardModal = openLeaderboardModal;

export {
  LEVELS, ACHIEVEMENTS, getLevelInfo, getLevelName,
  showXpFloat, launchConfetti, showLevelUpBanner,
  showAchievementToast, openProfileModal, openLeaderboardModal,
};
