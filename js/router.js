// ═══════════════════════════════════════════════════════════════
// ROUTER — Navigation between views
// ═══════════════════════════════════════════════════════════════
import { state, CATEGORY_NAMES } from './state.js';
import { renderMainContent, renderSidebar } from './subjects.js';

// ── Navigate to subject detail ──────────────────────────────
function navigateToSubject(categoryId, subject) {
  state.currentView = 'subject';
  state.currentSubject = { ...subject, categoryId };

  const main = document.getElementById('mainContent');
  if (!main) return;

  const catDisplayName = CATEGORY_NAMES[categoryId] || categoryId.toUpperCase();

  // Override the main-content area to become a 3-column layout
  // matching the .pen "State: Subject Detail" design
  main.style.padding = '0'; 
  main.style.gap = '0';
  main.style.flexDirection = 'row';

  // Build content sections HTML from JSON
  let contentHTML = '';
  if (subject.content && Array.isArray(subject.content)) {
    subject.content.forEach(block => {
      switch (block.type) {
        case 'heading':
          const level = block.level || 2;
          const tag = `h${Math.min(Math.max(level, 1), 6)}`;
          contentHTML += `<${tag} class="detail-heading detail-heading-${level}">${block.text}</${tag}>`;
          break;
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
    // Fallback if no content sections
    contentHTML = `<p class="detail-body-text">${subject.description || 'Tato lekce pokrývá základy předmětu.'}</p>`;
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
            <span>AI Asistent</span>
            <p>Zeptej se mě na cokoliv k tomuto tématu.</p>
          </div>
        </div>
        <div class="chat-input-area">
          <div class="chat-input-wrapper">
            <textarea class="chat-input" id="chatInput" rows="1" placeholder="Napiš zprávu..."></textarea>
            <button class="chat-send-btn" id="chatSendBtn" title="Odeslat">
              <i data-lucide="arrow-up"></i>
            </button>
          </div>
          <div style="font-size: 10px; color: var(--text-muted); text-align: center; margin-top: 4px;">
            AI Asistent může dělat chyby. Vždy si informace ověřujte.
          </div>
        </div>
        <button class="chat-action-btn" id="startScenarioBtn">
          <i data-lucide="play"></i>
          <span>Spustit scénář</span>
        </button>
      </div>
    </div>
  `;

  // Highlight active item in sidebar
  document.querySelectorAll('.cat-item').forEach(item => {
    item.classList.toggle('active', item.dataset.subjectId === subject.id && item.dataset.categoryId === categoryId);
  });

  // Wire chat send
  const chatInput = document.getElementById('chatInput');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const chatMessages = document.getElementById('chatMessages');

  // Remove welcome message on first send
  function clearWelcome() {
    const welcome = chatMessages.querySelector('.chat-welcome');
    if (welcome) welcome.remove();
  }

  // Auto-resize textarea
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
  });

  function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    clearWelcome();

    // Add user message
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

    // Simulate AI response
    setTimeout(() => {
      const aiMsg = document.createElement('div');
      aiMsg.className = 'chat-msg ai';
      aiMsg.innerHTML = `
        <span class="chat-msg-label">LearNovate AI</span>
        <div class="chat-msg-bubble">AI asistent pro "${subject.name}" bude brzy k dispozici.</div>
      `;
      chatMessages.appendChild(aiMsg);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 600);
  }

  chatSendBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  // Wire scenario button
  document.getElementById('startScenarioBtn').addEventListener('click', () => {
    if (!state.currentUser) {
      window.showModal('login');
      return;
    }
    startScenario(subject);
  });

  lucide.createIcons({ nodes: main.querySelectorAll('[data-lucide]') });
}

// ── Navigate back to home ───────────────────────────────────
function navigateHome() {
  state.currentView = 'home';
  state.currentSubject = null;

  // Reset main-content styles
  const main = document.getElementById('mainContent');
  if (main) {
    main.style.padding = '';
    main.style.gap = '';
    main.style.flexDirection = '';
  }

  // Remove active class from sidebar items
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

  // Update grids
  document.querySelectorAll('.subject-grid').forEach(grid => {
    grid.classList.toggle('list-view', state.viewMode === 'list');
  });
}

function initRouter() {
  // Home button
  const homeBox = document.getElementById('homeBox');
  if (homeBox) {
    homeBox.addEventListener('click', navigateHome);
  }

  // Grid/List toggle
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
          <span>Zpět na lekci</span>
        </button>
        <div class="scenario-title-area">
          <span class="scenario-breadcrumb">SCÉNÁŘ</span>
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
            <p>AI připravuje scénář…</p>
          </div>
        </div>
        <div class="scenario-input-area">
          <div class="scenario-input-wrapper">
            <textarea class="scenario-input" id="scenarioInput" rows="1" placeholder="Co uděláš?" disabled></textarea>
            <button class="scenario-send-btn" id="scenarioSendBtn" disabled>
              <i data-lucide="arrow-up"></i>
            </button>
          </div>
          <div class="scenario-input-hint">Popiš svou akci — splň všechny milestones.</div>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons({ nodes: main.querySelectorAll('[data-lucide]') });

  const messagesEl = document.getElementById('scenarioMessages');
  const inputEl    = document.getElementById('scenarioInput');
  const sendBtn    = document.getElementById('scenarioSendBtn');
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
      <span class="scenario-msg-label">${role === 'ai' ? 'AI Scénárista' : 'Ty'}</span>
      <div class="scenario-msg-bubble">${text.replace(/\n/g, '<br>')}</div>
    `;
    messagesEl.appendChild(msg);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'scenario-msg ai';
    t.id = 'scenarioTyping';
    t.innerHTML = `
      <span class="scenario-msg-label">AI Scénárista</span>
      <div class="scenario-msg-bubble scenario-typing-bubble">
        <div class="scenario-typing"><span></span><span></span><span></span></div>
      </div>
    `;
    messagesEl.appendChild(t);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById('scenarioTyping');
    if (t) t.remove();
  }

  function showMilestoneBanner() {
    const banner = document.createElement('div');
    banner.className = 'scenario-milestone-banner';
    banner.innerHTML = `
      <i data-lucide="check-circle"></i>
      <span>Milestone ${milestonesCompleted}/${MAX_MILESTONES} splněn!</span>
    `;
    messagesEl.appendChild(banner);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    lucide.createIcons({ nodes: banner.querySelectorAll('[data-lucide]') });

    setTimeout(() => banner.classList.add('fade-out'), 2500);
    setTimeout(() => banner.remove(), 3000);
  }

  function showEndBanner() {
    const banner = document.createElement('div');
    banner.className = 'scenario-end-banner';
    banner.innerHTML = `
      <i data-lucide="flag"></i>
      <span>Scénář dokončen — ${milestonesCompleted}/${MAX_MILESTONES} milestones</span>
      <div class="scenario-end-btns">
        <button class="scenario-retry-btn" id="scenarioRetryBtn">
          <i data-lucide="rotate-ccw"></i>
          <span>Zkusit znovu</span>
        </button>
        <button class="scenario-back-end-btn" id="scenarioBackEndBtn">
          <i data-lucide="book-open"></i>
          <span>Zpět na lekci</span>
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
          messages:             conversationHistory,
          user_message:         text,
          scenario_id:          subject.scenarioId || '',    // ← TOTO PŘIDAT
          milestones_completed: milestonesCompleted,
          max_milestones:       MAX_MILESTONES,
          milestone_points:     milestonePoints,             // ← TOTO PŘIDAT
        }),
      });
      const data = await res.json();
      hideTyping();

      conversationHistory.push({ role: 'user',      content: text });
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
      addMessage('ai', 'Chyba připojení k AI. Zkuste to znovu.');
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
          subject_name:        subject.name,
          subject_description: subject.description || '',
          scenario_id:         subject.scenarioId  || '',
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
        addMessage('ai', data.answer);
        setInputEnabled(true);
      } else {
        addMessage('ai', `Chyba při spuštění scénáře: ${data.error || 'neznámá'}`);
      }
    } catch (err) {
      const initMsg = document.getElementById('scenarioInitMsg');
      if (initMsg) initMsg.remove();
      addMessage('ai', `Chyba připojení k AI: ${err.message}`);
    }
  }

  autoStart();
}
function rebuildStepDots() {
  const bar = document.querySelector('.scenario-steps-bar');
  if (!bar) return;
  bar.innerHTML = Array.from({ length: MAX_MILESTONES }, (_, i) =>
    `<div class="scenario-step-dot" id="stepDot-${i}"></div>`
  ).join('');
  stepsCount.textContent = `0 / ${MAX_MILESTONES}`;
}

export { navigateToSubject, navigateHome, toggleViewMode, initRouter };
