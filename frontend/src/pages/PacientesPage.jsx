import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Search, Plus, Users, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import ModalPaciente from '../components/pacientes/ModalPaciente';

export default function PacientesPage() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPaciente, setEditPaciente] = useState(null);

  const fetchPacientes = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/pacientes', { params: { search, page, limit: 20 } });
      setPacientes(data.data);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPacientes(); }, [search, page]);

  const handleSave = () => { setModalOpen(false); setEditPaciente(null); fetchPacientes(); };

  const sexoIcon = (s) => s === 'femenino' ? '♀' : s === 'masculino' ? '♂' : '○';

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Pacientes</h1>
          <p className="text-white/40 text-sm">{total} registrados</p>
        </div>
        <button className="btn-primary" onClick={() => { setEditPaciente(null); setModalOpen(true); }}>
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input type="text" className="input pl-10" placeholder="Buscar por nombre, correo, código..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-mag-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !pacientes.length ? (
        <div className="glass-card text-center py-14">
          <Users size={40} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30">Sin pacientes{search ? ' con esa búsqueda' : ''}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pacientes.map(p => (
            <div key={p.id} onClick={() => navigate(`/pacientes/${p.id}`)}
              className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-white/8 transition-colors cursor-pointer group">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-mag-500 to-teal-500 flex items-center justify-center">
                {p.foto
                  ? <img src={p.foto} alt="" className="w-full h-full object-cover" />
                  : <span className="text-sm font-bold text-white">{p.nombre[0]}{p.apellido_paterno[0]}</span>
                }
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white text-sm">{p.nombre} {p.apellido_paterno} {p.apellido_materno}</p>
                  <span className="text-white/20 text-xs">{sexoIcon(p.sexo)}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-white/30 text-xs">{p.codigo}</span>
                  {p.telefono && <span className="text-white/30 text-xs">{p.telefono}</span>}
                  {p.ultima_sesion && (
                    <span className="text-white/30 text-xs flex items-center gap-1">
                      <Calendar size={10} />
                      {format(new Date(p.ultima_sesion), 'd MMM yyyy', { locale: es })}
                    </span>
                  )}
                </div>
              </div>
              {/* Right */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {parseInt(p.total_sesiones) > 0 && (
                  <span className="text-xs bg-mag-500/20 text-mag-300 px-2 py-0.5 rounded-full">
                    {p.total_sesiones} sesiones
                  </span>
                )}
                <ChevronRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
          <span className="text-white/40 text-sm py-2">{page}</span>
          <button className="btn-secondary" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ModalPaciente paciente={editPaciente} onClose={() => { setModalOpen(false); setEditPaciente(null); }} onSave={handleSave} />
      )}
    </div>
  );
}
