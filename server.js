const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const path    = require('path');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'learnovate-dev-secret';
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const APP_DIR    = path.join(__dirname, 'app');

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve frontend files

// ── Helpers ───────────────────────────────────────────────────
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
  catch { return []; }
}

function writeUsers(users) {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Gamification Helpers ──────────────────────────────────────
const XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2000, 2800, 3800, 5000, 6500, 8500];

function computeLevel(xp) {
  let level = 1;
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) { level = i + 1; break; }
  }
  return level;
}

function updateStreak(user) {
  const today = new Date().toISOString().split('T')[0];
  const last = user.lastLoginDate;
  if (last === today) return; // already updated today

  if (last) {
    const diffMs = new Date(today) - new Date(last);
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      user.currentStreak = (user.currentStreak || 0) + 1;
    } else if (diffDays > 1) {
      user.currentStreak = 1;
    }
  } else {
    user.currentStreak = 1;
  }
  user.lastLoginDate = today;
  if (!user.bestStreak || user.currentStreak > user.bestStreak) {
    user.bestStreak = user.currentStreak;
  }
}

function checkAndAwardAchievements(user) {
  if (!user.achievements) user.achievements = [];
  const total = Object.keys(user.scenarios || {}).length;
  const streak = user.currentStreak || 0;
  const body = user.body || 0;
  const level = computeLevel(body);

  const checks = [
    { id: 'first_scenario', ok: total >= 1  },
    { id: 'scenarios_5',    ok: total >= 5  },
    { id: 'scenarios_20',   ok: total >= 20 },
    { id: 'streak_3',       ok: streak >= 3 },
    { id: 'streak_7',       ok: streak >= 7 },
    { id: 'points_100',     ok: body >= 100  },
    { id: 'points_500',     ok: body >= 500  },
    { id: 'level_5',        ok: level >= 5   },
  ];

  const newlyUnlocked = [];
  checks.forEach(({ id, ok }) => {
    if (ok && !user.achievements.includes(id)) {
      user.achievements.push(id);
      newlyUnlocked.push(id);
    }
  });
  return newlyUnlocked;
}

function publicUser(user) {
  const totalScenarios = Object.keys(user.scenarios || {}).length;
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    body: user.body || 0,
    currentStreak: user.currentStreak || 0,
    bestStreak: user.bestStreak || 0,
    achievements: user.achievements || [],
    totalScenarios,
  };
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Chybí autorizační token.' });
  const token = header.replace('Bearer ', '');
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Neplatný nebo vypršený token.' });
  }
}

// ═══════════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password)
    return res.status(400).json({ error: 'Vyplňte prosím všechna pole.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Neplatná e-mailová adresa.' });
  if (username.length < 3)
    return res.status(400).json({ error: 'Uživatelské jméno musí mít alespoň 3 znaky.' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Heslo musí mít alespoň 6 znaků.' });

  const users = readUsers();
  if (users.find(u => u.email === email))
    return res.status(409).json({ error: 'Tento e-mail je již registrován.' });
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase()))
    return res.status(409).json({ error: 'Toto uživatelské jméno je již obsazeno.' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: generateId(),
    email,
    username,
    passwordHash,
    body: 0,
    createdAt: new Date().toISOString(),
  };

  updateStreak(user);
  users.push(user);
  writeUsers(users);

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: publicUser(user) });
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Zadejte e-mail a heslo.' });

  const users = readUsers();
  const user  = users.find(u => u.email === email);
  if (!user)
    return res.status(401).json({ error: 'Nesprávný e-mail nebo heslo.' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid)
    return res.status(401).json({ error: 'Nesprávný e-mail nebo heslo.' });

  updateStreak(user);
  const newlyUnlocked = checkAndAwardAchievements(user);
  writeUsers(users);

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: publicUser(user),
    newlyUnlocked,
  });
});

// GET /api/auth/me  — ověří token a vrátí aktuální data uživatele
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const users = readUsers();
  const user  = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Uživatel nenalezen.' });
  const newlyUnlocked = checkAndAwardAchievements(user);
  if (newlyUnlocked.length) writeUsers(users);
  res.json({ ...publicUser(user), newlyUnlocked });
});

// GET /api/gamification/leaderboard — top 10 users by XP
app.get('/api/gamification/leaderboard', (req, res) => {
  let currentId = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try { currentId = jwt.verify(authHeader.replace('Bearer ', ''), JWT_SECRET).id; } catch {}
  }

  const users = readUsers();
  const top = users
    .map(u => ({ username: u.username, body: u.body || 0, isMe: u.id === currentId }))
    .sort((a, b) => b.body - a.body)
    .slice(0, 10);

  res.json(top);
});

// ═══════════════════════════════════════════════════════════════
// SUBJECTS ROUTE — čte app/ složku dynamicky
// ═══════════════════════════════════════════════════════════════

// GET /api/subjects?lang=cs|en
app.get('/api/subjects', (req, res) => {
  const lang    = req.query.lang === 'en' ? 'en' : 'cs';
  const langDir = path.join(APP_DIR, lang);
  const csDir   = path.join(APP_DIR, 'cs');

  // Build a short→csPath map for fallback (cs subjects missing in en)
  let csByShort = {};
  if (lang === 'en' && fs.existsSync(csDir)) {
    fs.readdirSync(csDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .forEach(d => {
        const metaPath = path.join(csDir, d.name, 'metadata.json');
        if (fs.existsSync(metaPath)) {
          try {
            const m = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            if (m.short) csByShort[m.short] = path.join(csDir, d.name);
          } catch {}
        }
      });
  }

  const primaryDir = fs.existsSync(langDir) ? langDir : csDir;
  if (!fs.existsSync(primaryDir)) return res.json([]);

  try {
    const categories = fs.readdirSync(primaryDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(catDir => {
        const catPath = path.join(primaryDir, catDir.name);

        let metadata = { name: catDir.name.toUpperCase(), short: catDir.name };
        const metaPath = path.join(catPath, 'metadata.json');
        if (fs.existsSync(metaPath)) {
          metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        }

        // Fallback category dir in CS (matched by short key)
        const fallbackCatPath = csByShort[metadata.short] || null;

        // Collect all subject filenames (primary + any extra from fallback)
        const primaryFiles = new Set(
          fs.readdirSync(catPath).filter(f => f.endsWith('.json') && f !== 'metadata.json')
        );
        if (fallbackCatPath && fs.existsSync(fallbackCatPath)) {
          fs.readdirSync(fallbackCatPath)
            .filter(f => f.endsWith('.json') && f !== 'metadata.json')
            .forEach(f => primaryFiles.add(f));
        }

        const subjects = Array.from(primaryFiles).map(f => {
          const primaryFile  = path.join(catPath, f);
          const fallbackFile = fallbackCatPath ? path.join(fallbackCatPath, f) : null;
          const filePath = fs.existsSync(primaryFile)
            ? primaryFile
            : (fallbackFile && fs.existsSync(fallbackFile) ? fallbackFile : null);
          if (!filePath) return null;
          try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return { id: path.basename(f, '.json'), ...data };
          } catch { return null; }
        }).filter(Boolean);

        return { id: catDir.name, ...metadata, subjects };
      });

    res.json(categories);
  } catch (err) {
    console.error('Error reading subjects:', err);
    res.status(500).json({ error: 'Error loading subjects.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PROXY — Python AI backend
// ═══════════════════════════════════════════════════════════════
const AI_URL = process.env.AI_URL || 'http://localhost:5000';

app.post('/api/ai/ask', authMiddleware, async (req, res) => {
  try {
    const response = await fetch(`${AI_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(503).json({ error: 'AI služba není dostupná.' });
  }
});

app.post('/api/ai/scenario/start', authMiddleware, async (req, res) => {
  try {
    const response = await fetch(`${AI_URL}/scenario/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,  // forward JWT
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(503).json({ error: 'AI služba není dostupná.' });
  }
});

app.post('/api/ai/scenario/step', authMiddleware, async (req, res) => {
  try {
    const response = await fetch(`${AI_URL}/scenario/step`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,  // forward JWT
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(503).json({ error: 'AI služba není dostupná.' });
  }
});



// ADMIN PROXY
app.post('/api/ai/admin/verify', authMiddleware, async (req, res) => {
  try {
    const response = await fetch(`${AI_URL}/admin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': req.headers.authorization },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(503).json({ error: 'AI služba není dostupná.' });
  }
});

app.get('/api/ai/admin/users', authMiddleware, async (req, res) => {
  try {
    const response = await fetch(`${AI_URL}/admin/users`, {
      headers: { 'Authorization': req.headers.authorization },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(503).json({ error: 'AI služba není dostupná.' });
  }
});

app.get('/api/ai/admin/logs/:userId', authMiddleware, async (req, res) => {
  try {
    const response = await fetch(`${AI_URL}/admin/logs/${req.params.userId}`, {
      headers: { 'Authorization': req.headers.authorization },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(503).json({ error: 'AI služba není dostupná.' });
  }
});

app.get('/api/ai/admin/incidents', authMiddleware, async (req, res) => {
  try {
    const response = await fetch(`${AI_URL}/admin/incidents`, {
      headers: { 'Authorization': req.headers.authorization },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(503).json({ error: 'AI služba není dostupná.' });
  }
});




// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ LearNovate server běží na http://localhost:${PORT}`);
});
