import { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Settings, Users, Plus, Edit, Save, X } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);

  if (!['admin','superadmin'].includes(user?.rol)) return <Navigate to="/" replace />;

  const fetch = async () => {
    const { data } = await api.get('/usuarios');
    setUsuarios(data);
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div className="fade-in space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
          <Settings size={22} className="text-mag-400" /> Administración
        </h1>
      </div>

      {/* Usuarios */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white flex items-center gap-2"><Users size={16} className="text-teal-400" /> Usuarios del sistema</h2>
          <button className="btn-primary text-sm" onClick={() => { setEditUser(null); setModalOpen(true); }}>
            <Plus size={14} /> Agregar
          </button>
        </div>
        <div className="space-y-2">
          {usuarios.map(u => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mag-500 to-teal-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {u.nombre[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium text-white text-sm">{u.nombre}</p>
                <p className="text-white/30 text-xs">{u.email} · <span className="capitalize">{u.rol}</span></p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${u.activo ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                {u.activo ? 'Activo' : 'Inactivo'}
              </span>
              <button className="btn-secondary text-xs py-1.5 px-2.5" onClick={() => { setEditUser(u); setModalOpen(true); }}>
                <Edit size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && <ModalUsuario usuario={editUser} onClose={() => { setModalOpen(false); setEditUser(null); }} onSave={() => { setModalOpen(false); setEditUser(null); fetch(); }} />}
    </div>
  );
}

function ModalUsuario({ usuario, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    email: usuario?.email || '',
    password: '',
    rol: usuario?.rol || 'terapeuta',
    telefono: usuario?.telefono || '',
    especialidad: usuario?.especialidad || '',
    activo: usuario?.activo ?? true,
  });
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (usuario?.id) await api.put(`/usuarios/${usuario.id}`, form);
      else await api.post('/usuarios', form);
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
          <h3 className="font-bold text-white">{usuario ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          <button onClick={onClose}><X size={20} className="text-white/40" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <div><label className="label">Nombre *</label><input className="input" value={form.nombre} onChange={set('nombre')} required /></div>
          {!usuario && <div><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={set('email')} required /></div>}
          {!usuario && <div><label className="label">Contraseña *</label><input type="password" className="input" value={form.password} onChange={set('password')} required /></div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Rol</label>
              <select className="input" value={form.rol} onChange={set('rol')}>
                <option value="terapeuta">Terapeuta</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
            <div><label className="label">Teléfono</label><input className="input" value={form.telefono} onChange={set('telefono')} /></div>
          </div>
          <div><label className="label">Especialidad</label><input className="input" value={form.especialidad} onChange={set('especialidad')} /></div>
          {usuario && (
            <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
              <input type="checkbox" checked={form.activo} onChange={set('activo')} /> Usuario activo
            </label>
          )}
          {error && <p className="text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-xl p-3">{error}</p>}
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
