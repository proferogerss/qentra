const router = require('express').Router();
const db = require('../config/db');
const { auth } = require('../middleware/auth');

router.use(auth);

// GET /api/pacientes
router.get('/', async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    let where = 'WHERE p.activo = TRUE';
    const params = [];
    if (search) {
      params.push(`%${search}%`);
      where += ` AND (p.nombre ILIKE $${params.length} OR p.apellido_paterno ILIKE $${params.length} OR p.email ILIKE $${params.length} OR p.codigo ILIKE $${params.length})`;
    }
    const countQ = await db.query(`SELECT COUNT(*) FROM pacientes p ${where}`, params);
    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT p.*, u.nombre as terapeuta_nombre,
        (SELECT COUNT(*) FROM sesiones s WHERE s.paciente_id = p.id) as total_sesiones,
        (SELECT MAX(fecha) FROM sesiones s WHERE s.paciente_id = p.id) as ultima_sesion
       FROM pacientes p
       LEFT JOIN usuarios u ON u.id = p.terapeuta_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ data: rows, total: parseInt(countQ.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
});

// GET /api/pacientes/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, u.nombre as terapeuta_nombre FROM pacientes p
       LEFT JOIN usuarios u ON u.id = p.terapeuta_id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener paciente' });
  }
});

// POST /api/pacientes
router.post('/', async (req, res) => {
  const { nombre, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, telefono, email,
    direccion, ciudad, estado, ocupacion, estado_civil, antecedentes, alergias,
    medicamentos_actuales, enfermedades_cronicas, cirugias_previas, observaciones, foto } = req.body;
  if (!nombre || !apellido_paterno) return res.status(400).json({ error: 'Nombre y apellido requeridos' });
  try {
    const seqRes = await db.query("SELECT nextval('pacientes_codigo_seq') as n");
    const codigo = `P-${String(seqRes.rows[0].n).padStart(4, '0')}`;
    const { rows } = await db.query(
      `INSERT INTO pacientes (codigo, nombre, apellido_paterno, apellido_materno, fecha_nacimiento,
        sexo, telefono, email, direccion, ciudad, estado, ocupacion, estado_civil,
        antecedentes, alergias, medicamentos_actuales, enfermedades_cronicas, cirugias_previas,
        observaciones, foto, terapeuta_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [codigo, nombre, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, telefono, email,
       direccion, ciudad, estado, ocupacion, estado_civil, antecedentes, alergias,
       medicamentos_actuales, enfermedades_cronicas, cirugias_previas, observaciones, foto, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al crear paciente' });
  }
});

// PUT /api/pacientes/:id
router.put('/:id', async (req, res) => {
  const fields = ['nombre','apellido_paterno','apellido_materno','fecha_nacimiento','sexo','telefono',
    'email','direccion','ciudad','estado','ocupacion','estado_civil','antecedentes','alergias',
    'medicamentos_actuales','enfermedades_cronicas','cirugias_previas','observaciones','foto'];
  const updates = [];
  const params = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) {
      params.push(req.body[f]);
      updates.push(`${f} = $${params.length}`);
    }
  });
  if (!updates.length) return res.status(400).json({ error: 'Sin campos para actualizar' });
  params.push(req.params.id);
  try {
    const { rows } = await db.query(
      `UPDATE pacientes SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
      params
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar paciente' });
  }
});

// DELETE /api/pacientes/:id (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await db.query('UPDATE pacientes SET activo = FALSE, updated_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar paciente' });
  }
});

// GET /api/pacientes/:id/historial
router.get('/:id/historial', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.*, c.motivo_consulta,
        (SELECT COUNT(*) FROM sesion_pares sp WHERE sp.sesion_id = s.id) as total_pares
       FROM sesiones s
       LEFT JOIN citas c ON c.id = s.cita_id
       WHERE s.paciente_id = $1
       ORDER BY s.fecha DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

module.exports = router;
