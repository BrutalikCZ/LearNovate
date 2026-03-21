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

  users.push(user);
  writeUsers(users);

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, username: user.username, body: user.body },
  });
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

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user.id, email: user.email, username: user.username, body: user.body },
  });
});

// GET /api/auth/me  — ověří token a vrátí aktuální data uživatele
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const users = readUsers();
  const user  = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Uživatel nenalezen.' });
  res.json({ id: user.id, email: user.email, username: user.username, body: user.body });
});

// ═══════════════════════════════════════════════════════════════
// SUBJECTS ROUTE — čte app/ složku dynamicky
// ═══════════════════════════════════════════════════════════════

// GET /api/subjects?lang=cs|en
app.get('/api/subjects', (req, res) => {
  const lang   = req.query.lang === 'en' ? 'en' : 'cs';
  const srcDir = path.join(APP_DIR, lang);
  const baseDir = path.join(APP_DIR, 'cs'); // always use CS as source of truth for structure

  if (!fs.existsSync(baseDir)) return res.json([]);

  try {
    const categories = fs.readdirSync(baseDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(catDir => {
        const catPath  = path.join(baseDir, catDir.name);
        
        let metadata = { name: catDir.name.toUpperCase(), short: catDir.name };
        const metadataEnPath = path.join(APP_DIR, 'en', catDir.name, 'metadata.json');
        const metadataCsPath = path.join(APP_DIR, 'cs', catDir.name, 'metadata.json');
        const metadataFilePath = (lang === 'en' && fs.existsSync(metadataEnPath)) ? metadataEnPath : metadataCsPath;
        if (fs.existsSync(metadataFilePath)) {
          metadata = JSON.parse(fs.readFileSync(metadataFilePath, 'utf8'));
        }

        const subjects = fs.readdirSync(catPath)
          .filter(f => f.endsWith('.json') && f !== 'metadata.json')
          .map(f => {
            // Prefer target-lang file, fall back to Czech
            const enPath = path.join(APP_DIR, 'en', catDir.name, f);
            const csPath = path.join(APP_DIR, 'cs', catDir.name, f);
            const filePath = (lang === 'en' && fs.existsSync(enPath)) ? enPath : csPath;
            const raw  = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(raw);
            return { id: path.basename(f, '.json'), ...data };
          });
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

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✓ LearNovate server běží na http://localhost:${PORT}`);
});
