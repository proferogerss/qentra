import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Edit, Zap, Calendar, Clock, FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ModalPaciente from '../components/pacientes/ModalPaciente';
import ModalNuevaCita from '../components/citas/ModalNuevaCita';
import CategoriaBadge from '../components/shared/CategoriaBadge';

export default function PacienteDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [tab, setTab] = useState('info');
  const [editOpen, setEditOpen] = useState(false);
  const [citaOpen, setCitaOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    const [p, h] = await Promise.all([
      api.get(`/pacientes/${id}`),
      api.get(`/pacientes/${id}/historial`),
    ]);
    setPaciente(p.data);
    setHistorial(h.data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [id]);

  const iniciarSesion = async () => {
    const { data } = await api.post('/sesiones', { paciente_id: id });
    navigate(`/sesion/${data.id}`);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-mag-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!paciente) return <div className="text-center text-white/40 py-20">Paciente no encontrado</div>;

  const edad = paciente.fecha_nacimiento
    ? Math.floor((Date.now() - new Date(paciente.fecha_nacimiento)) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="space-y-5 fade-in max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/pacientes')} className="btn-secondary px-2.5 py-2">
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-display font-bold text-xl text-white flex-1">Expediente del paciente</h1>
        <button onClick={() => setCitaOpen(true)} className="btn-secondary text-sm">
          <Calendar size={14} /> Agendar
        </button>
        <button onClick={iniciarSesion} className="btn-primary text-sm">
          <Zap size={14} /> Sesión
        </button>
      </div>

      {/* Perfil */}
      <div className="glass-card flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-mag-500 to-teal-500 flex items-center justify-center flex-shrink-0">
          {paciente.foto
            ? <img src={paciente.foto} alt="" className="w-full h-full object-cover" />
            : <span className="text-xl font-bold text-white">{paciente.nombre[0]}{paciente.apellido_paterno[0]}</span>
          }
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display font-bold text-white text-lg">
                {paciente.nombre} {paciente.apellido_paterno} {paciente.apellido_materno}
              </h2>
              <div className="flex flex-wrap gap-2 mt-1">
                <span className="text-white/40 text-sm">{paciente.codigo}</span>
                {edad && <span className="text-white/40 text-sm">· {edad} años</span>}
                {paciente.sexo && <span className="text-white/40 text-sm capitalize">· {paciente.sexo}</span>}
                {paciente.ocupacion && <span className="text-white/40 text-sm">· {paciente.ocupacion}</span>}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {paciente.telefono && <span className="text-xs text-teal-400">{paciente.telefono}</span>}
                {paciente.email && <span className="text-xs text-teal-400">{paciente.email}</span>}
              </div>
            </div>
            <button onClick={() => setEditOpen(true)} className="btn-secondary text-xs px-3 py-1.5">
              <Edit size={12} /> Editar
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {[['info', 'Información', FileText], ['historial', 'Historial de sesiones', Clock]].map(([k, l, Icon]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === k ? 'bg-mag-500/20 text-mag-300' : 'text-white/40 hover:text-white/70'}`}>
            <Icon size={14} />{l}
          </button>
        ))}
      </div>

      {/* Tab info */}
      {tab === 'info' && (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { label: 'Antecedentes médicos', val: paciente.antecedentes },
            { label: 'Alergias', val: paciente.alergias },
            { label: 'Medicamentos actuales', val: paciente.medicamentos_actuales },
            { label: 'Enfermedades crónicas', val: paciente.enfermedades_cronicas },
            { label: 'Cirugías previas', val: paciente.cirugias_previas },
            { label: 'Observaciones', val: paciente.observaciones },
          ].filter(x => x.val).map(({ label, val }) => (
            <div key={label} className="glass-card">
              <p className="text-white/40 text-xs mb-1">{label}</p>
              <p className="text-white text-sm leading-relaxed">{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab historial */}
      {tab === 'historial' && (
        <div className="space-y-3">
          {!historial.length ? (
            <div className="glass-card text-center py-10">
              <Clock size={32} className="text-white/10 mx-auto mb-2" />
              <p className="text-white/30 text-sm">Sin sesiones registradas</p>
              <button onClick={iniciarSesion} className="btn-primary mt-4 mx-auto">
                <Plus size={14} /> Iniciar primera sesión
              </button>
            </div>
          ) : historial.map(s => (
            <div key={s.id} className="glass-card">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-white text-sm">
                  {format(new Date(s.fecha), "d 'de' MMMM yyyy · HH:mm", { locale: es })}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.estado === 'completada' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                  {s.estado}
                </span>
              </div>
              {s.motivo_consulta && <p className="text-white/50 text-xs mb-1">Motivo: {s.motivo_consulta}</p>}
              <p className="text-white/30 text-xs">{s.total_pares} par(es) trabajado(s)</p>
            </div>
          ))}
        </div>
      )}

      {editOpen && <ModalPaciente paciente={paciente} onClose={() => setEditOpen(false)} onSave={() => { setEditOpen(false); fetch(); }} />}
      {citaOpen && <ModalNuevaCita pacienteId={parseInt(id)} onClose={() => setCitaOpen(false)} onSave={() => setCitaOpen(false)} />}
    </div>
  );
}
