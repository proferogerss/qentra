const router = require('express').Router();
const db = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth);

// GET /api/puntos-rastreo-ios?vista=cuerpoFrente
// Lista los puntos calibrados para el mapa corporal en iOS.
router.get('/', async (req, res) => {
  const { vista } = req.query;
  try {
    const params = [];
    let where = '';
    if (vista) {
      params.push(vista);
      where = `WHERE pri.vista = $${params.length}`;
    }
    const { rows } = await db.query(
      `SELECT pri.id, pri.par_id, pri.vista, pri.polaridad, pri.x_pct, pri.y_pct,
              pri.nombre_punto, pri.updated_at,
              pb.nombre AS par_nombre, pb.categoria, pb.zona_cuerpo
       FROM puntos_rastreo_ios pri
       JOIN pares_biomagneticos pb ON pb.id = pri.par_id
       ${where}
       ORDER BY pri.par_id, pri.polaridad`,
      params
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener puntos de rastreo' });
  }
});

// PUT /api/puntos-rastreo-ios — crea o actualiza (upsert por par_id + vista + polaridad)
// Body: { par_id, vista, polaridad, x_pct, y_pct, nombre_punto }
router.put('/', adminOnly, async (req, res) => {
  const { par_id, vista, polaridad, x_pct, y_pct, nombre_punto } = req.body;
  if (!par_id || !vista || !polaridad || x_pct === undefined || y_pct === undefined) {
    return res.status(400).json({ error: 'par_id, vista, polaridad, x_pct y y_pct son requeridos' });
  }
  if (!['rojo', 'negro'].includes(polaridad)) {
    return res.status(400).json({ error: 'polaridad debe ser "rojo" o "negro"' });
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO puntos_rastreo_ios (par_id, vista, polaridad, x_pct, y_pct, nombre_punto, creado_por, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (par_id, vista, polaridad)
       DO UPDATE SET x_pct = EXCLUDED.x_pct, y_pct = EXCLUDED.y_pct,
                     nombre_punto = EXCLUDED.nombre_punto, updated_at = NOW()
       RETURNING *`,
      [par_id, vista, polaridad, x_pct, y_pct, nombre_punto || null, req.user.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al guardar punto de rastreo' });
  }
});

// DELETE /api/puntos-rastreo-ios/:id
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    await db.query('DELETE FROM puntos_rastreo_ios WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al eliminar punto de rastreo' });
  }
});

module.exports = router;
