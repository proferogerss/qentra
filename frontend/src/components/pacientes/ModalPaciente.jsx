import { useState } from 'react';
import api from '../../utils/api';
import { X, Save, Upload } from 'lucide-react';

const TABS = ['Personal', 'Médico', 'Contacto'];

export default function ModalPaciente({ paciente, onClose, onSave }) {
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombre: paciente?.nombre || '',
    apellido_paterno: paciente?.apellido_paterno || '',
    apellido_materno: paciente?.apellido_materno || '',
    fecha_nacimiento: paciente?.fecha_nacimiento?.slice(0,10) || '',
    sexo: paciente?.sexo || '',
    telefono: paciente?.telefono || '',
    email: paciente?.email || '',
    ciudad: paciente?.ciudad || '',
    estado: paciente?.estado || '',
    ocupacion: paciente?.ocupacion || '',
    estado_civil: paciente?.estado_civil || '',
    antecedentes: paciente?.antecedentes || '',
    alergias: paciente?.alergias || '',
    medicamentos_actuales: paciente?.medicamentos_actuales || '',
    enfermedades_cronicas: paciente?.enfermedades_cronicas || '',
    cirugias_previas: paciente?.cirugias_previas || '',
    observaciones: paciente?.observaciones || '',
    foto: paciente?.foto || '',
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(p => ({ ...p, foto: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (paciente?.id) {
        await api.put(`/pacientes/${paciente.id}`, form);
      } else {
        await api.post('/pacientes', form);
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
      <div className="relative w-full max-w-2xl glass rounded-2xl border border-white/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="font-display font-bold text-white text-lg">
            {paciente ? 'Editar paciente' : 'Nuevo paciente'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-4">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === i ? 'bg-mag-500/20 text-mag-300' : 'text-white/40 hover:text-white/70'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5">
          {/* Tab 0: Personal */}
          {tab === 0 && (
            <div className="space-y-4">
              {/* Foto */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-mag-500/20 flex items-center justify-center flex-shrink-0">
                  {form.foto
                    ? <img src={form.foto} alt="" className="w-full h-full object-cover" />
                    : <span className="text-2xl text-mag-400">{form.nombre?.[0] || '?'}</span>
                  }
                </div>
                <label className="btn-secondary text-sm cursor-pointer">
                  <Upload size={14} /> Subir foto
                  <input type="file" accept="image/*" className="hidden" onChange={handleFoto} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nombre *</label>
                  <input className="input" value={form.nombre} onChange={set('nombre')} required />
                </div>
                <div>
                  <label className="label">Apellido paterno *</label>
                  <input className="input" value={form.apellido_paterno} onChange={set('apellido_paterno')} required />
                </div>
                <div>
                  <label className="label">Apellido materno</label>
                  <input className="input" value={form.apellido_materno} onChange={set('apellido_materno')} />
                </div>
                <div>
                  <label className="label">Fecha de nacimiento</label>
                  <input type="date" className="input" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} />
                </div>
                <div>
                  <label className="label">Sexo</label>
                  <select className="input" value={form.sexo} onChange={set('sexo')}>
                    <option value="">Seleccionar</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="label">Estado civil</label>
                  <select className="input" value={form.estado_civil} onChange={set('estado_civil')}>
                    <option value="">Seleccionar</option>
                    <option value="soltero">Soltero/a</option>
                    <option value="casado">Casado/a</option>
                    <option value="divorciado">Divorciado/a</option>
                    <option value="viudo">Viudo/a</option>
                    <option value="union_libre">Unión libre</option>
                  </select>
                </div>
                <div>
                  <label className="label">Ocupación</label>
                  <input className="input" value={form.ocupacion} onChange={set('ocupacion')} />
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: Médico */}
          {tab === 1 && (
            <div className="space-y-4">
              {[
                { key: 'antecedentes', label: 'Antecedentes médicos' },
                { key: 'alergias', label: 'Alergias' },
                { key: 'medicamentos_actuales', label: 'Medicamentos actuales' },
                { key: 'enfermedades_cronicas', label: 'Enfermedades crónicas' },
                { key: 'cirugias_previas', label: 'Cirugías previas' },
                { key: 'observaciones', label: 'Observaciones generales' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <textarea rows={2} className="input resize-none" value={form[key]} onChange={set(key)} />
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Contacto */}
          {tab === 2 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Teléfono</label>
                <input className="input" value={form.telefono} onChange={set('telefono')} />
              </div>
              <div>
                <label className="label">Correo electrónico</label>
                <input type="email" className="input" value={form.email} onChange={set('email')} />
              </div>
              <div className="col-span-2">
                <label className="label">Ciudad</label>
                <input className="input" value={form.ciudad} onChange={set('ciudad')} />
              </div>
              <div className="col-span-2">
                <label className="label">Estado</label>
                <input className="input" value={form.estado} onChange={set('estado')} />
              </div>
            </div>
          )}

          {error && <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">{error}</div>}
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" disabled={loading} onClick={handleSubmit}>
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={15} /> Guardar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
