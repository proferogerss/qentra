import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, Plus, Trash2, CheckCircle, Zap, Search, Clock, X, Save } from 'lucide-react';
import CategoriaBadge from '../components/shared/CategoriaBadge';
import CuerpoSVG from '../components/sesion/CuerpoSVG';

export default function SesionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sesion, setSesion] = useState(null);
  const [todos, setTodos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [parSeleccionado, setParSeleccionado] = useState(null);
  const [segundos, setSegundos] = useState(0);
  const [corriendo, setCorriendo] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const [notas, setNotas] = useState('');
  const timerRef = useRef(null);

  const fetchSesion = async () => {
    const { data } = await api.get(`/sesiones/${id}`);
    setSesion(data);
    setNotas(data.observaciones_generales || '');
  };

  useEffect(() => {
    fetchSesion();
    api.get('/pares/todos').then(r => setTodos(r.data));
  }, [id]);

  // Cronómetro
  useEffect(() => {
    if (corriendo) {
      timerRef.current = setInterval(() => setSegundos(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [corriendo]);

  // Búsqueda de pares
  useEffect(() => {
    if (!busqueda.trim()) { setResultados([]); return; }
    setBuscando(true);
    const timer = setTimeout(async () => {
      const { data } = await api.get('/pares', { params: { search: busqueda, limit: 8 } });
      setResultados(data.data);
      setBuscando(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const agregarPar = async (par) => {
    await api.post(`/sesiones/${id}/pares`, { par_id: par.id });
    fetchSesion();
    setBusqueda('');
    setResultados([]);
  };

  const eliminarPar = async (parId) => {
    await api.delete(`/sesiones/${id}/pares/${parId}`);
    fetchSesion();
  };

  const cerrarSesion = async () => {
    setCerrando(true);
    await api.put(`/sesiones/${id}`, {
      estado: 'completada',
      duracion_segundos: segundos,
      observaciones_generales: notas,
    });
    navigate(`/pacientes/${sesion.paciente_id}`);
  };

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  if (!sesion) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-mag-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="fade-in max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(`/pacientes/${sesion.paciente_id}`)} className="btn-secondary px-2.5 py-2">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-white text-lg">Sesión activa</h1>
          <p className="text-white/40 text-sm">{sesion.paciente_nombre}</p>
        </div>
        {/* Timer */}
        <div className="glass px-4 py-2 rounded-xl flex items-center gap-2">
          <Clock size={14} className={corriendo ? 'text-green-400' : 'text-white/30'} />
          <span className="font-mono text-white font-bold">{fmt(segundos)}</span>
          <button onClick={() => setCorriendo(p => !p)} className="text-white/30 hover:text-white/60 ml-1 text-xs">
            {corriendo ? '⏸' : '▶'}
          </button>
        </div>
        <button onClick={cerrarSesion} className="btn-primary bg-green-600 hover:bg-green-700">
          <CheckCircle size={16} /> Cerrar sesión
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Cuerpo SVG interactivo */}
        <div className="glass-card">
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Zap size={15} className="text-mag-400" /> Mapa corporal
          </h2>
          <CuerpoSVG
            pares={todos}
            paresActivos={sesion.pares?.map(p => p.par_id) || []}
            onParClick={(par) => {
              setParSeleccionado(par);
              if (!sesion.pares?.find(sp => sp.par_id === par.id)) {
                agregarPar(par);
              }
            }}
          />
        </div>

        {/* Panel derecho */}
        <div className="space-y-4">
          {/* Buscar y agregar pares */}
          <div className="glass-card">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Search size={15} className="text-teal-400" /> Agregar par
            </h2>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input className="input pl-9 text-sm" placeholder="Buscar par, síntoma, microorganismo..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            {(resultados.length > 0 || buscando) && (
              <div className="mt-2 space-y-1 max-h-52 overflow-y-auto">
                {buscando ? (
                  <div className="text-center py-3 text-white/30 text-sm">Buscando...</div>
                ) : resultados.map(par => (
                  <button key={par.id} onClick={() => agregarPar(par)}
                    className="w-full text-left p-2.5 rounded-xl bg-white/3 hover:bg-white/8 transition-colors flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{par.nombre}</p>
                      {par.microorganismo && <p className="text-xs text-white/30 truncate">{par.microorganismo}</p>}
                    </div>
                    <CategoriaBadge categoria={par.categoria} />
                    <Plus size={14} className="text-mag-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pares encontrados */}
          <div className="glass-card">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Zap size={15} className="text-gold-400" /> Pares encontrados
              <span className="ml-auto text-white/30 text-xs">{sesion.pares?.length || 0} par(es)</span>
            </h2>
            {!sesion.pares?.length ? (
              <p className="text-white/20 text-sm text-center py-4">Usa el mapa o busca pares arriba</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sesion.pares.map((p, i) => (
                  <div key={p.id}
                    onClick={() => setParSeleccionado(p)}
                    className="flex items-start gap-3 p-2.5 rounded-xl bg-white/3 hover:bg-white/6 cursor-pointer transition-colors">
                    <span className="text-white/20 text-xs w-4 mt-0.5 flex-shrink-0">{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.nombre}</p>
                      {p.microorganismo && <p className="text-xs text-white/30">{p.microorganismo}</p>}
                    </div>
                    <CategoriaBadge categoria={p.categoria} />
                    <button onClick={(e) => { e.stopPropagation(); eliminarPar(p.id); }}
                      className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notas de sesión */}
          <div className="glass-card">
            <h2 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Save size={15} className="text-white/40" /> Observaciones
            </h2>
            <textarea className="input resize-none text-sm" rows={3}
              placeholder="Síntomas observados, evolución, recomendaciones..."
              value={notas} onChange={e => setNotas(e.target.value)} />
            <button onClick={() => api.put(`/sesiones/${id}`, { observaciones_generales: notas })}
              className="mt-2 text-xs text-mag-400 hover:text-mag-300">Guardar notas</button>
          </div>
        </div>
      </div>

      {/* Modal detalle de par seleccionado */}
      {parSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setParSeleccionado(null)} />
          <div className="relative w-full max-w-lg glass rounded-2xl border border-white/10 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-white text-lg">{parSeleccionado.nombre || parSeleccionado.nombre_corto}</h3>
                <CategoriaBadge categoria={parSeleccionado.categoria} />
              </div>
              <button onClick={() => setParSeleccionado(null)}><X size={20} className="text-white/40 hover:text-white" /></button>
            </div>
            <div className="space-y-3 text-sm">
              {parSeleccionado.microorganismo && (
                <div className="flex gap-2">
                  <span className="text-white/40 w-28 flex-shrink-0">Microorganismo</span>
                  <span className="text-white">{parSeleccionado.microorganismo}</span>
                </div>
              )}
              {parSeleccionado.punto_derecho && (
                <div className="flex gap-2">
                  <span className="text-white/40 w-28 flex-shrink-0">Punto D/I</span>
                  <span className="text-white">{parSeleccionado.punto_derecho} · {parSeleccionado.punto_izquierdo}</span>
                </div>
              )}
              {parSeleccionado.par_nombre && (
                <div className="flex gap-2">
                  <span className="text-white/40 w-28 flex-shrink-0">Par relacionado</span>
                  <span className="text-white">{parSeleccionado.par_nombre}</span>
                </div>
              )}
              {(parSeleccionado.sintomas || parSeleccionado.comentarios) && (
                <div className="border-t border-white/5 pt-3">
                  {parSeleccionado.sintomas && <p className="text-white/70 leading-relaxed">{parSeleccionado.sintomas}</p>}
                  {parSeleccionado.comentarios && <p className="text-white/40 text-xs mt-2 leading-relaxed">{parSeleccionado.comentarios}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
