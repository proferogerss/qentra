import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('qentra_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('qentra_token');
    if (token) {
      api.get('/auth/me').then(r => { setUser(r.data); setLoading(false); })
        .catch(() => { localStorage.removeItem('qentra_token'); localStorage.removeItem('qentra_user'); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('qentra_token', data.token);
    localStorage.setItem('qentra_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('qentra_token');
    localStorage.removeItem('qentra_user');
    setUser(null);
  };

  return <AuthCtx.Provider value={{ user, login, logout, loading }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
