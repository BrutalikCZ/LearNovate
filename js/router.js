// ═══════════════════════════════════════════════════════════════
// ROUTER — Navigation between views
// ═══════════════════════════════════════════════════════════════
import { state } from './state.js';
import { renderMainContent, renderSidebar } from './subjects.js';
import { t } from './i18n.js';
import { getLevelInfo, showXpFloat, launchConfetti, showLevelUpBanner, showAchievementToast } from './gamification.js';
import { updateUserBar } from './auth.js';

// ── Navigate to subject detail ──────────────────────────────
function navigateToSubject(categoryId, subject) {
  state.currentView = 'subject';
  state.currentSubject = { ...subject, categoryId };

  const main = document.getElementById('mainContent');
  if (!main) return;

  const category = state.subjectsData.find(c => c.id === categoryId);
  const catDisplayName = category?.name || categoryId.toUpperCase();

  // Override the main-content area to become a 3-column layout
  // matching the .pen "State: Subject Detail" design
  main.style.padding = '0';
  main.style.gap = '0';
  main.style.flexDirection = 'row';

  let contentHTML = '';
  if (subject.content && Array.isArray(subject.content)) {
    subject.content.forEach(block => {
      switch (block.type) {
        case 'heading': {
          const level = block.level || 2;
          const tag = `h${Math.min(Math.max(level, 1), 6)}`;
          contentHTML += `<${tag} class="detail-heading detail-heading-${level}">${block.text}</${tag}>`;
          break;
        }
        case 'text':
          contentHTML += `<p class="detail-body-text">${block.text}</p>`;
          break;
        case 'image':
          contentHTML += `
            <figure class="detail-figure">
              <img src="${block.src}" alt="${block.alt || ''}" class="detail-image" />
              ${block.caption ? `<figcaption class="detail-caption">${block.caption}</figcaption>` : ''}
            </figure>`;
          break;
        default:
          if (block.text) {
            contentHTML += `<p class="detail-body-text">${block.text}</p>`;
          }
      }
    });
  } else {
    contentHTML = `<p class="detail-body-text">${subject.description || t('fallback_lesson')}</p>`;
  }

  main.innerHTML = `
    <div class="subject-detail-wrapper">
      <!-- Content column -->
      <div class="subject-detail-main" id="detailMain">
        <div class="detail-breadcrumb">${catDisplayName} / ${subject.name.toUpperCase()}</div>
        <h1 class="detail-title">${subject.name}</h1>
        <div class="detail-content-body">
          ${contentHTML}
        </div>
      </div>

      <!-- Chat panel (right column) -->
      <div class="subject-detail-chat" id="detailChat">
        <div class="chat-messages" id="chatMessages">
          <div class="chat-welcome">
            <i data-lucide="sparkles"></i>
            <span>${t('ai_assistant')}</span>
            <p>${t('ai_ask')}</p>
          </div>
        </div>
        <div class="chat-input-area">
          <div class="chat-input-wrapper">
            <textarea class="chat-input" id="chatInput" rows="1" placeholder="${t('chat_placeholder')}"></textarea>
            <button class="chat-send-btn" id="chatSendBtn" title="${t('login_submit')}">
              <i data-lucide="arrow-up"></i>
            </button>
          </div>
          <div style="font-size: 10px; color: var(--text-muted); text-align: center; margin-top: 4px;">
            ${t('ai_disclaimer')}
          </div>
        </div>
        <button class="chat-action-btn" id="startScenarioBtn">
          <i data-lucide="play"></i>
          <span>${t('start_scenario')}</span>
        </button>
      </div>
    </div>
  `;

  document.querySelectorAll('.cat-item').forEach(item => {
    item.classList.toggle('active', item.dataset.subjectId === subject.id && item.dataset.categoryId === categoryId);
  });

  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatMessages = document.getElementById('chatMessages');
  let chatHistory = [];
  let chatConvId = '';

  function clearWelcome() {
    const welcome = chatMessages.querySelector('.chat-welcome');
    if (welcome) welcome.remove();
  }

  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  });

  // Build subject context from content blocks
  function getSubjectContext() {
    let context = `Předmět: ${subject.name}\n`;
    if (subject.description) context += `Popis: ${subject.description}\n`;
    if (subject.content && Array.isArray(subject.content)) {
      subject.content.forEach(block => {
        if (block.text) context += block.text + '\n';
      });
    }
    // Limit context length
    return context.substring(0, 2000);
  }

  async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    clearWelcome();

    // Add user message to UI
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.innerHTML = `
      <span class="chat-msg-label">Ty</span>
      <div class="chat-msg-bubble">${text}</div>
    `;
    chatMessages.appendChild(userMsg);
    chatInput.value = '';
    chatInput.style.height = 'auto';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Show typing indicator
    const typingEl = document.createElement('div');
    typingEl.className = 'chat-msg ai';
    typingEl.id = 'chatTyping';
    typingEl.innerHTML = `
      <span class="chat-msg-label">LearNovate AI</span>
      <div class="chat-msg-bubble">
        <div class="scenario-typing"><span></span><span></span><span></span></div>
      </div>
    `;
    chatMessages.appendChild(typingEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: text,
          subject: subject.name,
          subject_context: getSubjectContext(),
          messages: chatHistory,
          conv_id: chatConvId,
        }),
      });
      const data = await res.json();

      // Remove typing indicator
      const typing = document.getElementById('chatTyping');
      if (typing) typing.remove();

      // Save conv_id
      if (data.conv_id) chatConvId = data.conv_id;

      // Update history
      chatHistory.push({ role: 'user', content: text });
      chatHistory.push({ role: 'assistant', content: data.answer });

      // Show AI response
      const aiMsg = document.createElement('div');
      aiMsg.className = 'chat-msg ai';
      aiMsg.innerHTML = `
        <span class="chat-msg-label">LearNovate AI</span>
        <div class="chat-msg-bubble">${data.answer.replace(/\n/g, '<br>')}</div>
      `;
      chatMessages.appendChild(aiMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (err) {
      const typing = document.getElementById('chatTyping');
      if (typing) typing.remove();

      const errMsg = document.createElement('div');
      errMsg.className = 'chat-msg ai';
      errMsg.innerHTML = `
        <span class="chat-msg-label">LearNovate AI</span>
        <div class="chat-msg-bubble">Chyba připojení k AI. Zkus to znovu.</div>
      `;
      chatMessages.appendChild(errMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  chatSendBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  document.getElementById('startScenarioBtn').addEventListener('click', () => {
    if (!state.currentUser) {
      window.showModal('login');
      return;
    }
    startScenario(state.currentSubject);
  });

  lucide.createIcons({ nodes: main.querySelectorAll('[data-lucide]') });
}

// ── Navigate back to home ───────────────────────────────────
function navigateHome() {
  state.currentView = 'home';
  state.currentSubject = null;

  const main = document.getElementById('mainContent');
  if (main) {
    main.style.padding = '';
    main.style.gap = '';
    main.style.flexDirection = '';
  }

  document.querySelectorAll('.cat-item').forEach(item => {
    item.classList.remove('active');
  });

  renderMainContent();
}

// ── Toggle view mode (grid/list) ────────────────────────────
function toggleViewMode() {
  state.viewMode = state.viewMode === 'grid' ? 'list' : 'grid';

  const gridBtn = document.getElementById('gridBtn');
  if (gridBtn) {
    const iconName = state.viewMode === 'list' ? 'list' : 'layout-grid';
    gridBtn.innerHTML = `<i data-lucide="${iconName}"></i>`;
    lucide.createIcons({ nodes: gridBtn.querySelectorAll('[data-lucide]') });
  }

  document.querySelectorAll('.subject-grid').forEach(grid => {
    grid.classList.toggle('list-view', state.viewMode === 'list');
  });
}

function initRouter() {
  const homeBox = document.getElementById('homeBox');
  if (homeBox) {
    homeBox.addEventListener('click', navigateHome);
  }

  const gridBtn = document.getElementById('gridBtn');
  if (gridBtn) {
    gridBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleViewMode();
    });
  }
}

// ── Scenario View ───────────────────────────────────────────
function startScenario(subject) {
  let MAX_MILESTONES = 5;
  let milestonesCompleted = 0;
  let conversationHistory = [];
  let isLoading = false;
  let convId = '';

  const main = document.getElementById('mainContent');
  if (!main) return;

  main.style.padding = '0';
  main.style.gap = '0';
  main.style.flexDirection = 'column';

  const stepDots = Array.from({ length: MAX_MILESTONES }, (_, i) =>
    `<div class="scenario-step-dot" id="stepDot-${i}"></div>`
  ).join('');

  main.innerHTML = `
    <div class="scenario-wrapper">
      <div class="scenario-header">
        <button class="scenario-back-btn" id="scenarioBackBtn">
          <i data-lucide="arrow-left"></i>
          <span>${t('back_to_lesson')}</span>
        </button>
        <div class="scenario-title-area">
          <span class="scenario-breadcrumb">${t('scenario_label')}</span>
          <span class="scenario-subject-name">${subject.name}</span>
        </div>
        <div class="scenario-steps">
          <span class="scenario-steps-label">MILESTONES</span>
          <div class="scenario-steps-bar">${stepDots}</div>
          <span class="scenario-steps-count" id="scenarioStepsCount">0 / ${MAX_MILESTONES}</span>
        </div>
      </div>
      <div class="scenario-body">
        <div class="scenario-messages" id="scenarioMessages">
          <div class="scenario-init-msg" id="scenarioInitMsg">
            <div class="scenario-typing"><span></span><span></span><span></span></div>
            <p>${t('scenario_preparing')}</p>
          </div>
        </div>
        <div class="scenario-input-area">
          <div class="scenario-input-wrapper">
            <textarea class="scenario-input" id="scenarioInput" rows="1" placeholder="${t('scenario_input_placeholder')}" disabled></textarea>
            <button class="scenario-send-btn" id="scenarioSendBtn" disabled>
              <i data-lucide="arrow-up"></i>
            </button>
          </div>
          <div class="scenario-input-hint">${t('scenario_input_hint')}</div>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons({ nodes: main.querySelectorAll('[data-lucide]') });

  const messagesEl = document.getElementById('scenarioMessages');
  const inputEl = document.getElementById('scenarioInput');
  const sendBtn = document.getElementById('scenarioSendBtn');
  const stepsCount = document.getElementById('scenarioStepsCount');

  document.getElementById('scenarioBackBtn').addEventListener('click', () => {
    navigateToSubject(subject.categoryId, subject);
  });

  function updateMilestoneDots() {
    for (let i = 0; i < MAX_MILESTONES; i++) {
      const dot = document.getElementById(`stepDot-${i}`);
      if (dot) dot.classList.toggle('milestone', i < milestonesCompleted);
    }
    stepsCount.textContent = `${milestonesCompleted} / ${MAX_MILESTONES}`;
  }

  function setInputEnabled(enabled) {
    inputEl.disabled = !enabled;
    sendBtn.disabled = !enabled;
    if (enabled) inputEl.focus();
  }

  function addMessage(role, text) {
    const initMsg = document.getElementById('scenarioInitMsg');
    if (initMsg) initMsg.remove();

    const msg = document.createElement('div');
    msg.className = `scenario-msg ${role}`;
    msg.innerHTML = `
      <span class="scenario-msg-label">${role === 'ai' ? t('ai_screenwriter') : t('you')}</span>
      <div class="scenario-msg-bubble">${text.replace(/\n/g, '<br>')}</div>
    `;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'scenario-msg ai';
    el.id = 'scenarioTyping';
    el.innerHTML = `
      <span class="scenario-msg-label">${t('ai_screenwriter')}</span>
      <div class="scenario-msg-bubble scenario-typing-bubble">
        <div class="scenario-typing"><span></span><span></span><span></span></div>
      </div>
    `;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('scenarioTyping');
    if (el) el.remove();
  }

  function showMilestoneBanner(pointsAwarded, multiplier) {
    const pts = pointsAwarded || milestonePoints[milestonesCompleted - 1] || 0;
    const banner = document.createElement('div');
    banner.className = 'scenario-milestone-banner';
    banner.innerHTML = `
      <i data-lucide="check-circle"></i>
      <span>${t('milestone_completed', { n: milestonesCompleted, total: MAX_MILESTONES })}</span>
      ${pts > 0 ? `<span class="milestone-pts-badge">+${pts} ★</span>` : ''}
    `;
    messagesEl.appendChild(banner);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    lucide.createIcons({ nodes: banner.querySelectorAll('[data-lucide]') });

    // Floating XP number
    if (pts > 0) showXpFloat(pts, banner);

    setTimeout(() => banner.classList.add('fade-out'), 2500);
    setTimeout(() => banner.remove(), 3000);

    // Refresh user bar with updated XP
    setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        const oldXp = state.currentUser?.body || 0;
        const newXp = data.body || 0;

        const oldLevel = getLevelInfo(oldXp).current.level;
        const newLevel = getLevelInfo(newXp).current.level;

        state.currentUser = data;
        updateUserBar(data, data.newlyUnlocked || []);

        if (newLevel > oldLevel) {
          showLevelUpBanner(getLevelInfo(newXp), messagesEl);
        }
        (data.newlyUnlocked || []).forEach((id, i) => {
          setTimeout(() => showAchievementToast(id), i * 1200 + 400);
        });
      } catch {}
    }, 800);
  }

  function showEndBanner() {
    const isPerfect = milestonesCompleted >= MAX_MILESTONES;
    if (isPerfect) launchConfetti();

    const totalPts = milestonePoints.slice(0, milestonesCompleted).reduce((s, v) => s + (v || 0), 0);
    const perfClass = isPerfect ? ' end-banner-perfect' : '';

    const banner = document.createElement('div');
    banner.className = `scenario-end-banner${perfClass}`;
    banner.innerHTML = `
      <i data-lucide="${isPerfect ? 'trophy' : 'flag'}"></i>
      <span>${t('scenario_completed', { n: milestonesCompleted, total: MAX_MILESTONES })}</span>
      ${totalPts > 0 ? `<div class="end-xp-summary"><span class="end-xp-icon">★</span><span class="end-xp-val">+${totalPts} XP</span><span class="end-xp-label">získáno</span></div>` : ''}
      <div class="scenario-end-btns">
        <button class="scenario-retry-btn" id="scenarioRetryBtn">
          <i data-lucide="rotate-ccw"></i>
          <span>${t('retry')}</span>
        </button>
        <button class="scenario-back-end-btn" id="scenarioBackEndBtn">
          <i data-lucide="book-open"></i>
          <span>${t('back_to_lesson')}</span>
        </button>
      </div>
    `;
    messagesEl.appendChild(banner);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    lucide.createIcons({ nodes: banner.querySelectorAll('[data-lucide]') });

    document.getElementById('scenarioRetryBtn').addEventListener('click', () => startScenario(subject));
    document.getElementById('scenarioBackEndBtn').addEventListener('click', () => navigateToSubject(subject.categoryId, subject));
  }

  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
  });

  async function sendStep() {
    if (isLoading) return;
    const text = inputEl.value.trim();
    if (!text) return;

    isLoading = true;
    setInputEnabled(false);
    addMessage('user', text);
    inputEl.value = '';
    inputEl.style.height = 'auto';
    showTyping();

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/ai/scenario/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          messages: conversationHistory,
          user_message: text,
          scenario_id: subject.scenarioId || '',    // ← TOTO PŘIDAT
          conv_id: convId,
          milestones_completed: milestonesCompleted,
          max_milestones: MAX_MILESTONES,
          milestone_points: milestonePoints,             // ← TOTO PŘIDAT
        }),
      });
      const data = await res.json();
      hideTyping();

      conversationHistory.push({ role: 'user', content: text });
      conversationHistory.push({ role: 'assistant', content: data.answer });
      addMessage('ai', data.answer);

      if (data.milestone_complete) {
        milestonesCompleted++;
        updateMilestoneDots();
        showMilestoneBanner(data.points_awarded, data.multiplier);
      }

      if (data.is_complete) {
        setInputEnabled(false);
        showEndBanner();
      } else {
        setInputEnabled(true);
      }
    } catch {
      hideTyping();
      addMessage('ai', t('ai_conn_error'));
      setInputEnabled(true);
    }
    isLoading = false;
  }

  sendBtn.addEventListener('click', sendStep);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendStep(); }
  });

  // Auto-start
  let milestonePoints = [];  // ← přidat nahoře vedle ostatních proměnných

  async function autoStart() {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/ai/scenario/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          subject_name: subject.name,
          subject_description: subject.description || '',
          scenario_id: subject.scenarioId || '',
        }),
      });
      const data = await res.json();
      const initMsg = document.getElementById('scenarioInitMsg');
      if (initMsg) initMsg.remove();

      if (data.answer) {
        if (data.max_milestones && data.max_milestones !== MAX_MILESTONES) {
          MAX_MILESTONES = data.max_milestones;
          rebuildStepDots();
        }
        milestonePoints = data.milestone_points || [];
        conversationHistory = data.messages || [];
        convId = data.conv_id || '';  // přidat proměnnou
        addMessage('ai', data.answer);
        setInputEnabled(true);
      } else {
        addMessage('ai', t('scenario_start_error', { error: data.error || 'unknown' }));
      }
    } catch (err) {
      const initMsg = document.getElementById('scenarioInitMsg');
      if (initMsg) initMsg.remove();
      addMessage('ai', t('ai_connect_error', { error: err.message }));
    }
  }

  function rebuildStepDots() {
    const bar = document.querySelector('.scenario-steps-bar');
    if (!bar) return;
    bar.innerHTML = Array.from({ length: MAX_MILESTONES }, (_, i) =>
      `<div class="scenario-step-dot" id="stepDot-${i}"></div>`
    ).join('');
    stepsCount.textContent = `0 / ${MAX_MILESTONES}`;
  }

  autoStart();
}

export { navigateToSubject, navigateHome, toggleViewMode, initRouter };
