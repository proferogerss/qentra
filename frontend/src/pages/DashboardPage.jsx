import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Users, Calendar, Zap, TrendingUp, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CategoriaBadge from '../components/shared/CategoriaBadge';

const ESTADO_COLOR = {
  programada: 'bg-blue-500/20 text-blue-300',
  confirmada: 'bg-green-500/20 text-green-300',
  en_curso: 'bg-yellow-500/20 text-yellow-300',
  completada: 'bg-white/10 text-white/50',
  cancelada: 'bg-red-500/20 text-red-300',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const hoy = format(new Date(), "EEEE d 'de' MMMM", { locale: es });

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-mag-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <p className="text-white/40 text-sm capitalize">{hoy}</p>
        <h1 className="font-display text-2xl font-bold text-white mt-1">
          Bienvenido, {user?.nombre?.split(' ')[0]} 👋
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Pacientes', value: data?.pacientes ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Citas hoy', value: data?.citasHoy ?? 0, icon: Calendar, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Sesiones totales', value: data?.sesionesTotal ?? 0, icon: Zap, color: 'text-mag-400', bg: 'bg-mag-500/10' },
          { label: 'Pares en catálogo', value: 30, icon: TrendingUp, color: 'text-teal-400', bg: 'bg-teal-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass-card">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-display font-bold text-white">{value}</p>
            <p className="text-white/40 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Próximas citas */}
        <div className="glass-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <Clock size={16} className="text-mag-400" /> Próximas citas
            </h2>
            <Link to="/citas" className="text-mag-400 text-xs hover:text-mag-300 flex items-center gap-1">
              Ver todas <ChevronRight size={12} />
            </Link>
          </div>
          {!data?.citasProximas?.length ? (
            <p className="text-white/30 text-sm text-center py-4">Sin citas próximas</p>
          ) : (
            <div className="space-y-2">
              {data.citasProximas.map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/3 hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mag-500 to-teal-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {c.paciente_nombre?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{c.paciente_nombre}</p>
                    <p className="text-xs text-white/40">{format(new Date(c.fecha_hora), 'HH:mm · d MMM', { locale: es })}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADO_COLOR[c.estado] || 'bg-white/10 text-white/50'}`}>
                    {c.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pares más frecuentes */}
        <div className="glass-card">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-teal-400" /> Pares más frecuentes
          </h2>
          {!data?.paresTop?.length ? (
            <p className="text-white/30 text-sm text-center py-4">Sin datos aún</p>
          ) : (
            <div className="space-y-2">
              {data.paresTop.map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-white/3">
                  <span className="text-white/20 text-xs w-4 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{p.nombre}</p>
                  </div>
                  <CategoriaBadge categoria={p.categoria} />
                  <span className="text-white/40 text-xs">{p.frecuencia}x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { to: '/pacientes', label: 'Nuevo paciente', desc: 'Registrar paciente', icon: Users },
          { to: '/citas', label: 'Agendar cita', desc: 'Nueva cita', icon: Calendar },
          { to: '/catalogo', label: 'Catálogo PB', desc: 'Ver pares', icon: Zap },
          { to: '/equipo', label: 'Equipo', desc: 'Catálogo', icon: TrendingUp },
        ].map(({ to, label, desc, icon: Icon }) => (
          <Link key={to} to={to} className="glass-card hover:bg-white/8 transition-colors group cursor-pointer">
            <Icon size={20} className="text-mag-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-sm font-semibold text-white">{label}</p>
            <p className="text-xs text-white/40">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
