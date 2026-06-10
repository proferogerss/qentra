const router = require('express').Router();
const db = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth);

// GET /api/catalogo
router.get('/', async (req, res) => {
  const { categoria, disponible } = req.query;
  try {
    let where = 'WHERE 1=1';
    const params = [];
    if (categoria)  { params.push(categoria);  where += ` AND categoria = $${params.length}`; }
    if (disponible) { params.push(disponible === 'true'); where += ` AND disponible = $${params.length}`; }
    const { rows } = await db.query(
      `SELECT * FROM catalogo_equipo ${where} ORDER BY orden ASC, nombre ASC`, params
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener catálogo' });
  }
});

// POST /api/catalogo
router.post('/', adminOnly, async (req, res) => {
  const { nombre, categoria, subcategoria, descripcion, especificaciones, imagen, precio, disponible, destacado, orden } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO catalogo_equipo (nombre, categoria, subcategoria, descripcion, especificaciones, imagen, precio, disponible, destacado, orden)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [nombre, categoria, subcategoria, descripcion, JSON.stringify(especificaciones), imagen, precio, disponible ?? true, destacado ?? false, orden ?? 0]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear equipo' });
  }
});

// PUT /api/catalogo/:id
router.put('/:id', adminOnly, async (req, res) => {
  const fields = ['nombre','categoria','subcategoria','descripcion','especificaciones','imagen','precio','disponible','destacado','orden'];
  const updates = []; const params = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { params.push(f === 'especificaciones' ? JSON.stringify(req.body[f]) : req.body[f]); updates.push(`${f}=$${params.length}`); } });
  params.push(req.params.id);
  try {
    const { rows } = await db.query(`UPDATE catalogo_equipo SET ${updates.join(',')}, updated_at=NOW() WHERE id=$${params.length} RETURNING *`, params);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

// DELETE /api/catalogo/:id
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM catalogo_equipo WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

module.exports = router;
