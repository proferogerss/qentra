require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// ── Trust proxy (Cloudflare / Nginx) ─────────────────────────
app.set('trust proxy', 1);

// ── Seguridad ─────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5174',
  'https://qentra.codenovatech.com.mx',
  'https://codenovatech.com.mx',
  'http://localhost:5173',
  'http://localhost:5174',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('No permitido por CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ── Rutas API ─────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/pacientes', require('./routes/pacientes'));
app.use('/api/citas',     require('./routes/citas'));
app.use('/api/sesiones',  require('./routes/sesiones'));
app.use('/api/pares',     require('./routes/pares'));
app.use('/api/catalogo',  require('./routes/catalogo'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/usuarios',  require('./routes/usuarios'));

// ── Frontend estático ─────────────────────────────────────────
const distPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint no encontrado' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── Error handler ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Qentra API corriendo en puerto ${PORT}`);
});
