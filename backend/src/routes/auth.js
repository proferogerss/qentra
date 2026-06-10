const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { auth } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
  try {
    const { rows } = await db.query(
      'SELECT * FROM usuarios WHERE email = $1 AND activo = TRUE',
      [email.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );
    const { password_hash, ...userData } = user;
    res.json({ token, user: userData });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, nombre, email, rol, telefono, foto, especialidad FROM usuarios WHERE id = $1',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/auth/cambiar-password
router.put('/cambiar-password', auth, async (req, res) => {
  const { password_actual, password_nuevo } = req.body;
  if (!password_actual || !password_nuevo) return res.status(400).json({ error: 'Faltan datos' });
  try {
    const { rows } = await db.query('SELECT password_hash FROM usuarios WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(password_actual, rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    const hash = await bcrypt.hash(password_nuevo, 10);
    await db.query('UPDATE usuarios SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
