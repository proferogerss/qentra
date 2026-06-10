import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Package, Plus, Edit, Trash2, Star, X, Save } from 'lucide-react';

const CATEGORIAS = ['imanes', 'equipo', 'accesorios', 'tecnologia', 'formacion'];

export default function EquipoPage() {
  const { user } = useAuth();
  const isAdmin = ['admin','superadmin'].includes(user?.rol);
  const [items, setItems] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetch = async () => {
    setLoading(true);
    const { data } = await api.get('/catalogo', { params: { categoria: categoria || undefined } });
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [categoria]);

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este artículo?')) return;
    await api.delete(`/catalogo/${id}`);
    fetch();
  };

  const specs = (item) => {
    try { return typeof item.especificaciones === 'string' ? JSON.parse(item.especificaciones) : item.especificaciones; }
    catch { return {}; }
  };

  return (
    <div className="fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Equipo & Tecnología</h1>
          <p className="text-white/40 text-sm">Catálogo de imanes y accesorios</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => { setEditItem(null); setModalOpen(true); }}>
            <Plus size={16} /> Agregar
          </button>
        )}
      </div>

      {/* Filtro categoría */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setCategoria('')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${!categoria ? 'bg-mag-500/20 border-mag-500/40 text-mag-300' : 'border-white/10 text-white/40'}`}>
          Todos
        </button>
        {CATEGORIAS.map(c => (
          <button key={c} onClick={() => setCategoria(c)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${categoria === c ? 'bg-mag-500/20 border-mag-500/40 text-mag-300' : 'border-white/10 text-white/40'}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-mag-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id}
              className="glass rounded-2xl overflow-hidden hover:ring-1 hover:ring-mag-500/30 transition-all cursor-pointer"
              onClick={() => setSelected(item)}>
              {/* Imagen */}
              <div className="h-32 bg-gradient-to-br from-mag-900 to-mag-800 flex items-center justify-center">
                {item.imagen
                  ? <img src={item.imagen} alt={item.nombre} className="h-full w-full object-contain p-4" />
                  : <Package size={40} className="text-mag-500/40" />
                }
              </div>
              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{item.nombre}</p>
                    <p className="text-xs text-white/30 capitalize mt-0.5">{item.categoria} · {item.subcategoria}</p>
                  </div>
                  {item.destacado && <Star size={14} className="text-gold-400 fill-gold-400 flex-shrink-0 mt-0.5" />}
                </div>
                {item.precio && (
                  <p className="text-teal-400 font-bold mt-2">${parseFloat(item.precio).toFixed(2)}</p>
                )}
                {isAdmin && (
                  <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                    <button className="btn-secondary text-xs py-1 px-2" onClick={() => { setEditItem(item); setModalOpen(true); }}>
                      <Edit size={11} />
                    </button>
                    <button className="btn-danger text-xs py-1 px-2" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detalle modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md glass rounded-2xl border border-white/10">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h3 className="font-display font-bold text-white">{selected.nombre}</h3>
              <button onClick={() => setSelected(null)}><X size={20} className="text-white/40" /></button>
            </div>
            <div className="p-5 space-y-4">
              {selected.descripcion && <p className="text-white/70 text-sm leading-relaxed">{selected.descripcion}</p>}
              {(() => {
                const sp = specs(selected);
                const keys = Object.keys(sp);
                if (!keys.length) return null;
                return (
                  <div className="bg-white/3 rounded-xl p-3 space-y-2">
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-wide">Especificaciones</p>
                    {keys.map(k => (
                      <div key={k} className="flex justify-between text-sm">
                        <span className="text-white/40 capitalize">{k.replace(/_/g,' ')}</span>
                        <span className="text-white">{typeof sp[k] === 'object' ? sp[k].join(', ') : sp[k]}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {selected.precio && <p className="text-teal-400 font-bold text-xl">${parseFloat(selected.precio).toFixed(2)}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Modal editar/crear */}
      {modalOpen && <ModalEquipo item={editItem} onClose={() => { setModalOpen(false); setEditItem(null); }} onSave={() => { setModalOpen(false); setEditItem(null); fetch(); }} />}
    </div>
  );
}

function ModalEquipo({ item, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: item?.nombre || '',
    categoria: item?.categoria || 'imanes',
    subcategoria: item?.subcategoria || '',
    descripcion: item?.descripcion || '',
    precio: item?.precio || '',
    disponible: item?.disponible ?? true,
    destacado: item?.destacado ?? false,
    orden: item?.orden || 0,
    imagen: item?.imagen || '',
  });

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleImg = e => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => setForm(p => ({ ...p, imagen: ev.target.result }));
    r.readAsDataURL(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (item?.id) await api.put(`/catalogo/${item.id}`, form);
      else await api.post('/catalogo', form);
      onSave();
    } catch { } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass rounded-2xl border border-white/10 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h3 className="font-bold text-white">{item ? 'Editar' : 'Nuevo artículo'}</h3>
          <button onClick={onClose}><X size={20} className="text-white/40" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto flex-1">
          <div><label className="label">Nombre *</label><input className="input" value={form.nombre} onChange={set('nombre')} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Categoría</label>
              <select className="input" value={form.categoria} onChange={set('categoria')}>
                {CATEGORIAS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div><label className="label">Subcategoría</label><input className="input" value={form.subcategoria} onChange={set('subcategoria')} /></div>
          </div>
          <div><label className="label">Descripción</label><textarea rows={2} className="input resize-none" value={form.descripcion} onChange={set('descripcion')} /></div>
          <div><label className="label">Precio</label><input type="number" className="input" value={form.precio} onChange={set('precio')} /></div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
              <input type="checkbox" checked={form.disponible} onChange={set('disponible')} className="rounded" /> Disponible
            </label>
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
              <input type="checkbox" checked={form.destacado} onChange={set('destacado')} className="rounded" /> Destacado
            </label>
          </div>
          <div>
            <label className="label">Imagen</label>
            <label className="btn-secondary text-sm cursor-pointer w-full justify-center">
              Subir imagen
              <input type="file" accept="image/*" className="hidden" onChange={handleImg} />
            </label>
            {form.imagen && <img src={form.imagen} alt="" className="mt-2 h-20 object-contain rounded-xl" />}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={14} />Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
