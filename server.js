// Backend comunicazioni
// - L'admin invia comunicazioni autenticandosi con un CODICE validato dal server.
// - Gli utenti dell'app leggono la lista delle comunicazioni.
//
// SICUREZZA: il codice e' controllato QUI, sul server, non nel client.
// Cambia ADMIN_CODE nel file .env con qualcosa di lungo e non indovinabile.

const express = require('express');
const fs = require('fs');
const path = require('path');

// --- mini loader del file .env (cosi' non servono dipendenze extra) ---
(function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
})();

const PORT = process.env.PORT || 3000;
const ADMIN_CODE = process.env.ADMIN_CODE || '2317'; // CAMBIALO nel .env
const DATA_FILE = path.join(__dirname, 'data', 'communications.json');

// --- persistenza su file JSON ---
function ensureStore() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
}
function readAll() {
  ensureStore();
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}
function writeAll(list) {
  ensureStore();
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

const app = express();
app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// CORS: l'app Cordova gira da un'origine diversa, quindi permetto la lettura.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Code');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Middleware: verifica il codice admin (header X-Admin-Code).
function requireAdmin(req, res, next) {
  const code = req.get('X-Admin-Code') || '';
  // confronto a lunghezza costante per non rivelare nulla coi tempi
  const a = Buffer.from(code);
  const b = Buffer.from(ADMIN_CODE);
  const ok = a.length === b.length && require('crypto').timingSafeEqual(a, b);
  if (!ok) return res.status(401).json({ error: 'Codice non valido' });
  next();
}

// --- API ---

// Lettura: tutti gli utenti dell'app (piu' recenti prima)
app.get('/api/communications', (req, res) => {
  const list = readAll().sort((x, y) => y.createdAt - x.createdAt);
  res.json(list);
});

// Verifica codice (usata dalla pagina admin per "sbloccare")
app.post('/api/admin/check', requireAdmin, (req, res) => {
  res.json({ ok: true });
});

// Invio: solo admin
app.post('/api/communications', requireAdmin, (req, res) => {
  const title = String(req.body.title || '').trim();
  const body = String(req.body.body || '').trim();
  if (!title && !body) {
    return res.status(400).json({ error: 'Titolo o testo obbligatori' });
  }
  const list = readAll();
  const item = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title,
    body,
    createdAt: Date.now()
  };
  list.push(item);
  writeAll(list);
  res.status(201).json(item);
});

// Cancellazione: solo admin
app.delete('/api/communications/:id', requireAdmin, (req, res) => {
  const list = readAll();
  const next = list.filter(c => c.id !== req.params.id);
  if (next.length === list.length) {
    return res.status(404).json({ error: 'Non trovata' });
  }
  writeAll(next);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Backend comunicazioni in ascolto su http://localhost:${PORT}`);
  console.log(`Pannello admin:  http://localhost:${PORT}/admin.html`);
  console.log(`Vista utenti:    http://localhost:${PORT}/index.html`);
  if (ADMIN_CODE === '2317') {
    console.log('ATTENZIONE: stai usando il codice di default 2317. Cambialo nel file .env!');
  }
});
