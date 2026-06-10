import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('qentra_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('qentra_token');
      localStorage.removeItem('qentra_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
