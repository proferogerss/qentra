const router = require('express').Router();
const db = require('../config/db');
const { auth, adminOnly } = require('../middleware/auth');

// ── DASHBOARD ──────────────────────────────────────────────────
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const [pacientes, citasHoy, sesionesTotal, paresTop, citasProximas] = await Promise.all([
      db.query('SELECT COUNT(*) FROM pacientes WHERE activo = TRUE'),
      db.query(`SELECT COUNT(*) FROM citas WHERE DATE(fecha_hora AT TIME ZONE 'America/Monterrey') = CURRENT_DATE AND estado NOT IN ('cancelada','no_asistio')`),
      db.query('SELECT COUNT(*) FROM sesiones'),
      db.query(`SELECT pb.nombre, pb.categoria, COUNT(*) as frecuencia
                FROM sesion_pares sp JOIN pares_biomagneticos pb ON pb.id = sp.par_id
                GROUP BY pb.id ORDER BY frecuencia DESC LIMIT 8`),
      db.query(`SELECT c.fecha_hora, c.estado,
                  p.nombre || ' ' || p.apellido_paterno as paciente_nombre, p.foto as paciente_foto
                FROM citas c JOIN pacientes p ON p.id = c.paciente_id
                WHERE c.fecha_hora >= NOW() AND c.estado IN ('programada','confirmada')
                ORDER BY c.fecha_hora ASC LIMIT 5`),
    ]);
    res.json({
      pacientes: parseInt(pacientes.rows[0].count),
      citasHoy: parseInt(citasHoy.rows[0].count),
      sesionesTotal: parseInt(sesionesTotal.rows[0].count),
      paresTop: paresTop.rows,
      citasProximas: citasProximas.rows,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
});

module.exports = router;
