const router = require('express').Router();
const db = require('../config/db');
const { auth } = require('../middleware/auth');

router.use(auth);

// POST /api/sesiones — iniciar sesión
router.post('/', async (req, res) => {
  const { cita_id, paciente_id, sintomas_principales, nivel_energia_inicial } = req.body;
  if (!paciente_id) return res.status(400).json({ error: 'Paciente requerido' });
  try {
    const { rows } = await db.query(
      `INSERT INTO sesiones (cita_id, paciente_id, terapeuta_id, sintomas_principales, nivel_energia_inicial, estado)
       VALUES ($1,$2,$3,$4,$5,'activa') RETURNING *`,
      [cita_id || null, paciente_id, req.user.id, sintomas_principales, nivel_energia_inicial]
    );
    if (cita_id) {
      await db.query("UPDATE citas SET estado = 'en_curso', updated_at = NOW() WHERE id = $1", [cita_id]);
    }
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// GET /api/sesiones/:id
router.get('/:id', async (req, res) => {
  try {
    const sesion = await db.query(
      `SELECT s.*, p.nombre || ' ' || p.apellido_paterno as paciente_nombre, p.foto as paciente_foto,
        p.antecedentes, p.alergias, p.medicamentos_actuales,
        u.nombre as terapeuta_nombre
       FROM sesiones s
       JOIN pacientes p ON p.id = s.paciente_id
       JOIN usuarios u ON u.id = s.terapeuta_id
       WHERE s.id = $1`,
      [req.params.id]
    );
    if (!sesion.rows[0]) return res.status(404).json({ error: 'Sesión no encontrada' });

    const pares = await db.query(
      `SELECT sp.*, pb.nombre, pb.nombre_corto, pb.categoria, pb.microorganismo,
        pb.punto_derecho, pb.punto_izquierdo, pb.par_nombre, pb.comentarios
       FROM sesion_pares sp
       JOIN pares_biomagneticos pb ON pb.id = sp.par_id
       WHERE sp.sesion_id = $1
       ORDER BY sp.orden ASC`,
      [req.params.id]
    );
    res.json({ ...sesion.rows[0], pares: pares.rows });
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener sesión' });
  }
});

// PUT /api/sesiones/:id — actualizar/cerrar sesión
router.put('/:id', async (req, res) => {
  const fields = ['estado','nivel_energia_final','observaciones_generales','plan_siguiente_sesion',
    'recomendaciones','resumen_ia','duracion_segundos','sintomas_principales'];
  const updates = [];
  const params = [];
  fields.forEach(f => {
    if (req.body[f] !== undefined) { params.push(req.body[f]); updates.push(`${f} = $${params.length}`); }
  });
  if (!updates.length) return res.status(400).json({ error: 'Sin campos' });
  params.push(req.params.id);
  try {
    const { rows } = await db.query(
      `UPDATE sesiones SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
      params
    );
    // Si se completa, actualizar cita
    if (req.body.estado === 'completada' && rows[0].cita_id) {
      await db.query("UPDATE citas SET estado = 'completada', updated_at = NOW() WHERE id = $1", [rows[0].cita_id]);
    }
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar sesión' });
  }
});

// POST /api/sesiones/:id/pares — agregar par encontrado
router.post('/:id/pares', async (req, res) => {
  const { par_id, activo = true, intensidad, tiempo_impactacion, notas } = req.body;
  if (!par_id) return res.status(400).json({ error: 'Par requerido' });
  try {
    const ordenRes = await db.query(
      'SELECT COALESCE(MAX(orden),0)+1 as siguiente FROM sesion_pares WHERE sesion_id = $1',
      [req.params.id]
    );
    const { rows } = await db.query(
      `INSERT INTO sesion_pares (sesion_id, par_id, orden, activo, intensidad, tiempo_impactacion, notas)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, par_id, ordenRes.rows[0].siguiente, activo, intensidad, tiempo_impactacion, notas]
    );
    // Traer info del par
    const par = await db.query(
      'SELECT nombre, nombre_corto, categoria, microorganismo FROM pares_biomagneticos WHERE id = $1',
      [par_id]
    );
    res.status(201).json({ ...rows[0], ...par.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al agregar par' });
  }
});

// DELETE /api/sesiones/:id/pares/:parId
router.delete('/:id/pares/:parId', async (req, res) => {
  try {
    await db.query('DELETE FROM sesion_pares WHERE id = $1 AND sesion_id = $2', [req.params.parId, req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar par' });
  }
});

// PUT /api/sesiones/:id/pares/:parId
router.put('/:id/pares/:parId', async (req, res) => {
  const { notas, intensidad, tiempo_impactacion } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE sesion_pares SET notas=$1, intensidad=$2, tiempo_impactacion=$3
       WHERE id=$4 AND sesion_id=$5 RETURNING *`,
      [notas, intensidad, tiempo_impactacion, req.params.parId, req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar par' });
  }
});

module.exports = router;
