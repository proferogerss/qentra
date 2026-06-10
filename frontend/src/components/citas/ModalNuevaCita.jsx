import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { X, Save, Search } from 'lucide-react';

export default function ModalNuevaCita({ pacienteId, cita, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pacientes, setPacientes] = useState([]);
  const [searchP, setSearchP] = useState('');
  const [form, setForm] = useState({
    paciente_id: pacienteId || cita?.paciente_id || '',
    fecha_hora: cita?.fecha_hora?.slice(0,16) || '',
    duracion_minutos: cita?.duracion_minutos || 60,
    tipo: cita?.tipo || 'primera_vez',
    motivo_consulta: cita?.motivo_consulta || '',
    precio: cita?.precio || '',
  });

  useEffect(() => {
    if (!pacienteId) {
      api.get('/pacientes', { params: { search: searchP, limit: 10 } })
        .then(r => setPacientes(r.data.data));
    }
  }, [searchP, pacienteId]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (cita?.id) {
        await api.put(`/citas/${cita.id}`, form);
      } else {
        await api.post('/citas', form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass rounded-2xl border border-white/10">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="font-display font-bold text-white text-lg">{cita ? 'Editar cita' : 'Nueva cita'}</h2>
          <button onClick={onClose}><X size={20} className="text-white/40 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!pacienteId && (
            <div>
              <label className="label">Paciente</label>
              <div className="relative mb-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input className="input pl-8 text-sm" placeholder="Buscar paciente..." value={searchP} onChange={e => setSearchP(e.target.value)} />
              </div>
              <select className="input" value={form.paciente_id} onChange={set('paciente_id')} required>
                <option value="">Seleccionar</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} {p.apellido_paterno}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="label">Fecha y hora *</label>
            <input type="datetime-local" className="input" value={form.fecha_hora} onChange={set('fecha_hora')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Duración (min)</label>
              <select className="input" value={form.duracion_minutos} onChange={set('duracion_minutos')}>
                {[30,45,60,90,120].map(d => <option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={form.tipo} onChange={set('tipo')}>
                <option value="primera_vez">Primera vez</option>
                <option value="seguimiento">Seguimiento</option>
                <option value="urgencia">Urgencia</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Motivo de consulta</label>
            <textarea className="input resize-none" rows={2} value={form.motivo_consulta} onChange={set('motivo_consulta')} />
          </div>
          <div>
            <label className="label">Precio ($)</label>
            <input type="number" className="input" value={form.precio} onChange={set('precio')} placeholder="0.00" />
          </div>
          {error && <p className="text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-xl p-3">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={15} /> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
