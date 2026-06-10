const router = require('express').Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth, adminOnly);

router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, nombre, email, rol, telefono, especialidad, activo, created_at FROM usuarios ORDER BY nombre');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  }
});

router.post('/', async (req, res) => {
  const { nombre, email, password, rol, telefono, especialidad } = req.body;
  if (!nombre || !email || !password) return res.status(400).json({ error: 'Faltan datos' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      'INSERT INTO usuarios (nombre, email, password_hash, rol, telefono, especialidad) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, nombre, email, rol',
      [nombre, email.toLowerCase(), hash, rol || 'terapeuta', telefono, especialidad]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Email ya registrado' });
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, telefono, especialidad, rol, activo } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE usuarios SET nombre=$1, telefono=$2, especialidad=$3, rol=$4, activo=$5, updated_at=NOW() WHERE id=$6 RETURNING id, nombre, email, rol, activo',
      [nombre, telefono, especialidad, rol, activo, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

module.exports = router;
