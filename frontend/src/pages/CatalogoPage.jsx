import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Search, BookOpen, Filter, X } from 'lucide-react';
import CategoriaBadge from '../components/shared/CategoriaBadge';

const CATEGORIAS = ['todas','virus','bacterias','hongos','parasitos','disfuncion','psicoemocional','reservorios','complejos'];
const ZONAS = ['','cabeza','cuello','torax','abdomen','pelvis','espalda','extremidades'];

export default function CatalogoPage() {
  const [pares, setPares] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [zona, setZona] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchPares = async () => {
    setLoading(true);
    const params = { search, page, limit: 20 };
    if (categoria && categoria !== 'todas') params.categoria = categoria;
    if (zona) params.zona = zona;
    const { data } = await api.get('/pares', { params });
    setPares(data.data);
    setTotal(data.total);
    setLoading(false);
  };

  useEffect(() => { fetchPares(); }, [search, categoria, zona, page]);

  return (
    <div className="fade-in space-y-5">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Catálogo de Pares Biomagnéticos</h1>
        <p className="text-white/40 text-sm">{total} pares · Dr. Isaac Goiz Durán</p>
      </div>

      {/* Filtros */}
      <div className="glass-card space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input className="input pl-10" placeholder="Buscar por nombre, síntoma, microorganismo..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIAS.map(c => (
            <button key={c} onClick={() => { setCategoria(c === 'todas' ? '' : c); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${
                (c === 'todas' && !categoria) || categoria === c
                  ? 'bg-mag-500/20 border-mag-500/40 text-mag-300'
                  : 'border-white/10 text-white/40 hover:text-white/70'
              }`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <select className="input text-sm" value={zona} onChange={e => { setZona(e.target.value); setPage(1); }}>
            <option value="">Todas las zonas</option>
            {ZONAS.filter(z => z).map(z => (
              <option key={z} value={z} className="capitalize">{z}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de pares */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-mag-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {pares.map(par => (
            <button key={par.id} onClick={() => setSelected(par)}
              className="glass rounded-xl p-4 text-left hover:bg-white/8 transition-colors group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {par.numero && <span className="text-white/20 text-xs font-mono">#{par.numero}</span>}
                    <p className="font-semibold text-white text-sm truncate">{par.nombre}</p>
                  </div>
                  {par.microorganismo && (
                    <p className="text-xs text-teal-400/80 truncate">{par.microorganismo}</p>
                  )}
                </div>
                <CategoriaBadge categoria={par.categoria} />
              </div>
              {par.sintomas && (
                <p className="text-white/30 text-xs line-clamp-2 leading-relaxed">{par.sintomas}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {par.zona_cuerpo && <span className="text-white/20 text-xs capitalize">{par.zona_cuerpo}</span>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Paginación */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
          <span className="text-white/40 text-sm py-2">{page} / {Math.ceil(total/20)}</span>
          <button className="btn-secondary" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
        </div>
      )}

      {/* Modal detalle */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg glass rounded-2xl border border-white/10 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-white/5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {selected.numero && <span className="text-mag-400 text-sm font-mono font-bold">Par #{selected.numero}</span>}
                  <CategoriaBadge categoria={selected.categoria} />
                </div>
                <h3 className="font-display font-bold text-white text-lg">{selected.nombre}</h3>
              </div>
              <button onClick={() => setSelected(null)}><X size={20} className="text-white/40" /></button>
            </div>
            {/* Content */}
            <div className="overflow-y-auto p-5 space-y-4 text-sm">
              {selected.microorganismo && (
                <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3">
                  <p className="text-teal-400 font-semibold text-xs mb-0.5">Microorganismo asociado</p>
                  <p className="text-white">{selected.microorganismo}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {selected.punto_derecho && (
                  <div>
                    <p className="text-white/30 text-xs mb-0.5">Punto derecho</p>
                    <p className="text-white">{selected.punto_derecho}</p>
                  </div>
                )}
                {selected.punto_izquierdo && (
                  <div>
                    <p className="text-white/30 text-xs mb-0.5">Punto izquierdo</p>
                    <p className="text-white">{selected.punto_izquierdo}</p>
                  </div>
                )}
              </div>
              {selected.par_nombre && (
                <div>
                  <p className="text-white/30 text-xs mb-0.5">Par biomagnético</p>
                  <p className="text-white font-medium">{selected.par_nombre}</p>
                  <p className="text-white/50 text-xs">{selected.par_derecho} ↔ {selected.par_izquierdo}</p>
                </div>
              )}
              {selected.posicionamiento && (
                <div>
                  <p className="text-white/30 text-xs mb-0.5">Posicionamiento</p>
                  <p className="text-white/80 leading-relaxed">{selected.posicionamiento}</p>
                </div>
              )}
              {selected.sintomas && (
                <div>
                  <p className="text-white/30 text-xs mb-0.5">Síntomas / Indicaciones</p>
                  <p className="text-white/80 leading-relaxed">{selected.sintomas}</p>
                </div>
              )}
              {selected.comentarios && (
                <div className="bg-white/3 rounded-xl p-3">
                  <p className="text-white/30 text-xs mb-1">Comentarios clínicos</p>
                  <p className="text-white/60 leading-relaxed text-xs">{selected.comentarios}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
