const router = require('express').Router();
const db = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth);

// GET /api/pares-admin?search=
// Lista simplificada para la pantalla de administración (no la del mapa SVG viejo)
router.get('/', async (req, res) => {
  const { search } = req.query;
  try {
    const params = [];
    let where = 'WHERE activo = TRUE';
    if (search) {
      params.push(`%${search}%`);
      where += ` AND nombre ILIKE $${params.length}`;
    }
    const { rows } = await db.query(
      `SELECT id, numero, nombre, nombre_corto, categoria, microorganismo,
              sintomas, comentarios, zona_cuerpo,
              (SELECT COUNT(*) FROM puntos_rastreo_ios WHERE par_id = pares_biomagneticos.id) AS puntos_calibrados
       FROM pares_biomagneticos
       ${where}
       ORDER BY numero ASC NULLS LAST, nombre ASC`,
      params
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener pares' });
  }
});

// POST /api/pares-admin — crear un par nuevo, uno a la vez
// Body: { numero, nombre, nombre_corto, categoria, microorganismo, sintomas, comentarios, definicion, zona_cuerpo }
router.post('/', adminOnly, async (req, res) => {
  const { numero, nombre, nombre_corto, categoria, microorganismo, sintomas, comentarios, definicion, zona_cuerpo } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre del par es requerido' });
  try {
    const { rows } = await db.query(
      `INSERT INTO pares_biomagneticos
         (numero, nombre, nombre_corto, categoria, microorganismo, sintomas, comentarios, definicion, zona_cuerpo, activo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, TRUE)
       RETURNING *`,
      [numero || null, nombre, nombre_corto || null, categoria || null,
       microorganismo || null, sintomas || null, comentarios || null, definicion || null, zona_cuerpo || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear el par' });
  }
});

// PUT /api/pares-admin/:id — editar un par existente
router.put('/:id', adminOnly, async (req, res) => {
  const fields = ['numero', 'nombre', 'nombre_corto', 'categoria', 'microorganismo', 'sintomas', 'comentarios', 'definicion', 'zona_cuerpo'];
  const updates = []; const params = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { params.push(req.body[f]); updates.push(`${f}=$${params.length}`); }
  });
  if (updates.length === 0) return res.status(400).json({ error: 'Nada para actualizar' });
  params.push(req.params.id);
  try {
    const { rows } = await db.query(
      `UPDATE pares_biomagneticos SET ${updates.join(',')} WHERE id=$${params.length} RETURNING *`,
      params
    );
    if (!rows[0]) return res.status(404).json({ error: 'Par no encontrado' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al actualizar el par' });
  }
});

// DELETE /api/pares-admin/:id — desactivar (no se borra físicamente, por las sesiones históricas)
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await db.query('UPDATE pares_biomagneticos SET activo = FALSE WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al desactivar el par' });
  }
});

module.exports = router;
