const router = require('express').Router();
const db = require('../config/db');
const { auth } = require('../middleware/auth');

router.use(auth);

// GET /api/citas?fecha_inicio=&fecha_fin=
router.get('/', async (req, res) => {
  const { fecha_inicio, fecha_fin, terapeuta_id, estado } = req.query;
  try {
    const params = [];
    let where = 'WHERE 1=1';
    if (fecha_inicio) { params.push(fecha_inicio); where += ` AND c.fecha_hora >= $${params.length}`; }
    if (fecha_fin)    { params.push(fecha_fin);    where += ` AND c.fecha_hora <= $${params.length}`; }
    if (terapeuta_id) { params.push(terapeuta_id); where += ` AND c.terapeuta_id = $${params.length}`; }
    if (estado)       { params.push(estado);       where += ` AND c.estado = $${params.length}`; }
    const { rows } = await db.query(
      `SELECT c.*, 
        p.nombre || ' ' || p.apellido_paterno as paciente_nombre, p.telefono as paciente_telefono,
        u.nombre as terapeuta_nombre
       FROM citas c
       JOIN pacientes p ON p.id = c.paciente_id
       JOIN usuarios u ON u.id = c.terapeuta_id
       ${where}
       ORDER BY c.fecha_hora ASC`,
      params
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// GET /api/citas/hoy
router.get('/hoy', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT c.*, 
        p.nombre || ' ' || p.apellido_paterno as paciente_nombre, p.telefono as paciente_telefono, p.foto as paciente_foto,
        u.nombre as terapeuta_nombre
       FROM citas c
       JOIN pacientes p ON p.id = c.paciente_id
       JOIN usuarios u ON u.id = c.terapeuta_id
       WHERE DATE(c.fecha_hora AT TIME ZONE 'America/Monterrey') = CURRENT_DATE
       ORDER BY c.fecha_hora ASC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener citas de hoy' });
  }
});

// POST /api/citas
router.post('/', async (req, res) => {
  const { paciente_id, terapeuta_id, fecha_hora, duracion_minutos, tipo, motivo_consulta, notas_previas, precio } = req.body;
  if (!paciente_id || !fecha_hora) return res.status(400).json({ error: 'Paciente y fecha requeridos' });
  try {
    const { rows } = await db.query(
      `INSERT INTO citas (paciente_id, terapeuta_id, fecha_hora, duracion_minutos, tipo, motivo_consulta, notas_previas, precio)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [paciente_id, terapeuta_id || req.user.id, fecha_hora, duracion_minutos || 60, tipo || 'primera_vez', motivo_consulta, notas_previas, precio]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear cita' });
  }
});

// PUT /api/citas/:id
router.put('/:id', async (req, res) => {
  const fields = ['fecha_hora','duracion_minutos','estado','tipo','motivo_consulta','notas_previas','precio','pagado','metodo_pago'];
  const updates = [];
  const params = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { params.push(req.body[f]); updates.push(`${f} = $${params.length}`); }
  });
  if (!updates.length) return res.status(400).json({ error: 'Sin campos' });
  params.push(req.params.id);
  try {
    const { rows } = await db.query(
      `UPDATE citas SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
      params
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar cita' });
  }
});

// DELETE /api/citas/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query("UPDATE citas SET estado = 'cancelada', updated_at = NOW() WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al cancelar cita' });
  }
});

module.exports = router;
