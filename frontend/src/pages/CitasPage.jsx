import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Zap, Calendar, Edit, X } from 'lucide-react';
import ModalNuevaCita from '../components/citas/ModalNuevaCita';

const ESTADO_COLOR = {
  programada:  'border-blue-500/40 bg-blue-500/10',
  confirmada:  'border-green-500/40 bg-green-500/10',
  en_curso:    'border-yellow-500/40 bg-yellow-500/10',
  completada:  'border-white/10 bg-white/3',
  cancelada:   'border-red-500/20 bg-red-500/5 opacity-50',
  no_asistio:  'border-orange-500/20 bg-orange-500/5 opacity-50',
};

export default function CitasPage() {
  const navigate = useNavigate();
  const [semanaBase, setSemanaBase] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCita, setEditCita] = useState(null);

  const dias = Array.from({ length: 7 }, (_, i) => addDays(semanaBase, i));

  const fetchCitas = async () => {
    setLoading(true);
    const fi = format(semanaBase, "yyyy-MM-dd'T'00:00:00");
    const ff = format(addDays(semanaBase, 6), "yyyy-MM-dd'T'23:59:59");
    const { data } = await api.get('/citas', { params: { fecha_inicio: fi, fecha_fin: ff } });
    setCitas(data);
    setLoading(false);
  };

  useEffect(() => { fetchCitas(); }, [semanaBase]);

  const citasDelDia = (dia) => citas.filter(c => isSameDay(parseISO(c.fecha_hora), dia));

  const iniciarSesion = async (cita) => {
    const { data } = await api.post('/sesiones', {
      cita_id: cita.id,
      paciente_id: cita.paciente_id,
    });
    navigate(`/sesion/${data.id}`);
  };

  const cambiarEstado = async (citaId, estado) => {
    await api.put(`/citas/${citaId}`, { estado });
    fetchCitas();
  };

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-white">Agenda</h1>
        <button className="btn-primary" onClick={() => { setEditCita(null); setModalOpen(true); }}>
          <Plus size={16} /> Nueva cita
        </button>
      </div>

      {/* Semana nav */}
      <div className="glass-card flex items-center justify-between">
        <button className="btn-secondary px-2 py-2" onClick={() => setSemanaBase(d => addDays(d, -7))}>
          <ChevronLeft size={16} />
        </button>
        <span className="font-semibold text-white capitalize">
          {format(semanaBase, "d MMM", { locale: es })} – {format(addDays(semanaBase, 6), "d MMM yyyy", { locale: es })}
        </span>
        <button className="btn-secondary px-2 py-2" onClick={() => setSemanaBase(d => addDays(d, 7))}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Vista semanal */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-mag-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {dias.map(dia => {
            const esHoy = isSameDay(dia, new Date());
            const citasDia = citasDelDia(dia);
            return (
              <div key={dia.toISOString()} className="min-h-32">
                <div className={`text-center py-2 rounded-t-xl mb-2 ${esHoy ? 'bg-mag-500/20 border border-mag-500/30' : 'bg-white/3'}`}>
                  <p className="text-xs text-white/40 capitalize">{format(dia, 'EEE', { locale: es })}</p>
                  <p className={`font-bold text-sm ${esHoy ? 'text-mag-300' : 'text-white'}`}>{format(dia, 'd')}</p>
                </div>
                <div className="space-y-1.5">
                  {citasDia.map(c => (
                    <div key={c.id}
                      className={`p-2 rounded-xl border ${ESTADO_COLOR[c.estado] || 'border-white/10 bg-white/3'} group relative`}>
                      <p className="text-xs font-semibold text-white truncate">{c.paciente_nombre}</p>
                      <p className="text-xs text-white/40">{format(parseISO(c.fecha_hora), 'HH:mm')}</p>
                      {/* Actions on hover */}
                      <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                        {!['completada','cancelada'].includes(c.estado) && (
                          <button onClick={() => iniciarSesion(c)}
                            className="w-5 h-5 rounded bg-mag-500/40 hover:bg-mag-500 flex items-center justify-center" title="Iniciar sesión">
                            <Zap size={10} className="text-white" />
                          </button>
                        )}
                        <button onClick={() => { setEditCita(c); setModalOpen(true); }}
                          className="w-5 h-5 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center">
                          <Edit size={10} className="text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista hoy */}
      <div className="glass-card">
        <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-mag-400" /> Citas de hoy
        </h2>
        {citasDelDia(new Date()).length === 0 ? (
          <p className="text-white/30 text-sm">Sin citas para hoy</p>
        ) : (
          <div className="space-y-2">
            {citasDelDia(new Date()).map(c => (
              <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border ${ESTADO_COLOR[c.estado] || 'border-white/10'}`}>
                <div className="flex-1">
                  <p className="font-semibold text-white text-sm">{c.paciente_nombre}</p>
                  <p className="text-white/40 text-xs">
                    {format(parseISO(c.fecha_hora), 'HH:mm')} · {c.duracion_minutos} min · {c.tipo}
                  </p>
                  {c.motivo_consulta && <p className="text-white/30 text-xs mt-0.5 truncate">{c.motivo_consulta}</p>}
                </div>
                <div className="flex gap-2">
                  {!['completada','cancelada'].includes(c.estado) && (
                    <button onClick={() => iniciarSesion(c)} className="btn-primary text-xs py-1.5">
                      <Zap size={12} /> Sesión
                    </button>
                  )}
                  <select value={c.estado} onChange={e => cambiarEstado(c.id, e.target.value)}
                    className="text-xs bg-white/5 border border-white/10 text-white rounded-lg px-2 py-1.5 cursor-pointer">
                    <option value="programada">Programada</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="en_curso">En curso</option>
                    <option value="completada">Completada</option>
                    <option value="cancelada">Cancelada</option>
                    <option value="no_asistio">No asistió</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <ModalNuevaCita cita={editCita} onClose={() => { setModalOpen(false); setEditCita(null); }} onSave={() => { setModalOpen(false); setEditCita(null); fetchCitas(); }} />
      )}
    </div>
  );
}
