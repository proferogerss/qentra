import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, Zap, BookOpen, Package, Settings, LogOut,
  Menu, X, Magnet
} from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard',  end: true },
  { to: '/pacientes', icon: Users,           label: 'Pacientes' },
  { to: '/citas',     icon: Calendar,        label: 'Agenda'    },
  { to: '/catalogo',  icon: BookOpen,        label: 'Catálogo PB' },
  { to: '/equipo',    icon: Package,         label: 'Equipo'    },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-mag-500 to-teal-500 flex items-center justify-center flex-shrink-0">
          <Magnet size={18} className="text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-white text-base leading-tight">Qentra</p>
          <p className="text-white/40 text-xs">Par Biomagnético</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
        {['admin','superadmin'].includes(user?.rol) && (
          <NavLink to="/admin"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setMobileOpen(false)}>
            <Settings size={16} />
            Administración
          </NavLink>
        )}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-white/5">
        <div className="glass rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-mag-500 to-teal-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user?.nombre?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.nombre}</p>
            <p className="text-xs text-white/40 capitalize">{user?.rol}</p>
          </div>
          <button onClick={handleLogout} className="text-white/40 hover:text-red-400 transition-colors p-1">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 flex-col border-r border-white/5 bg-mag-950/80">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-mag-950 border-r border-white/5 z-10">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-mag-950/80">
          <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Magnet size={16} className="text-mag-400" />
            <span className="font-display font-bold text-white text-sm">Qentra</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
