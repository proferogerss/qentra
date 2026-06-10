const router = require('express').Router();
const db = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth);

// GET /api/pares?search=&categoria=&zona=
router.get('/', async (req, res) => {
  const { search, categoria, zona, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const params = [];
    let where = 'WHERE activo = TRUE';
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (nombre ILIKE $${params.length} OR microorganismo ILIKE $${params.length} OR sintomas ILIKE $${params.length})`;
    }
    if (categoria) { params.push(categoria); where += ` AND categoria = $${params.length}`; }
    if (zona)      { params.push(zona);      where += ` AND zona_cuerpo = $${params.length}`; }
    const countQ = await db.query(`SELECT COUNT(*) FROM pares_biomagneticos ${where}`, params);
    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT * FROM pares_biomagneticos ${where}
       ORDER BY numero ASC NULLS LAST, nombre ASC
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );
    res.json({ data: rows, total: parseInt(countQ.rows[0].count) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener pares' });
  }
});

// GET /api/pares/todos — sin paginación para el cuerpo SVG
router.get('/todos', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, numero, nombre, nombre_corto, categoria, zona_cuerpo, coord_x_der, coord_y_der, coord_x_izq, coord_y_izq FROM pares_biomagneticos WHERE activo = TRUE ORDER BY numero ASC'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener pares' });
  }
});

// GET /api/pares/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM pares_biomagneticos WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Par no encontrado' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener par' });
  }
});

// POST /api/pares — solo admin
router.post('/', adminOnly, async (req, res) => {
  const { numero, nombre, nombre_corto, punto_derecho, punto_izquierdo, par_nombre, par_derecho,
    par_izquierdo, categoria, microorganismo, sintomas, comentarios, posicionamiento,
    coord_x_der, coord_y_der, coord_x_izq, coord_y_izq, zona_cuerpo } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });
  try {
    const { rows } = await db.query(
      `INSERT INTO pares_biomagneticos (numero, nombre, nombre_corto, punto_derecho, punto_izquierdo,
        par_nombre, par_derecho, par_izquierdo, categoria, microorganismo, sintomas, comentarios,
        posicionamiento, coord_x_der, coord_y_der, coord_x_izq, coord_y_izq, zona_cuerpo)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [numero, nombre, nombre_corto, punto_derecho, punto_izquierdo, par_nombre, par_derecho,
       par_izquierdo, categoria, microorganismo, sintomas, comentarios, posicionamiento,
       coord_x_der, coord_y_der, coord_x_izq, coord_y_izq, zona_cuerpo]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error al crear par' });
  }
});

// PUT /api/pares/:id
router.put('/:id', adminOnly, async (req, res) => {
  const fields = ['numero','nombre','nombre_corto','punto_derecho','punto_izquierdo','par_nombre',
    'par_derecho','par_izquierdo','categoria','microorganismo','sintomas','comentarios',
    'posicionamiento','coord_x_der','coord_y_der','coord_x_izq','coord_y_izq','zona_cuerpo'];
  const updates = []; const params = [];
  fields.forEach(f => { if (req.body[f] !== undefined) { params.push(req.body[f]); updates.push(`${f}=$${params.length}`); } });
  params.push(req.params.id);
  try {
    const { rows } = await db.query(`UPDATE pares_biomagneticos SET ${updates.join(',')} WHERE id=$${params.length} RETURNING *`, params);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar par' });
  }
});

module.exports = router;
