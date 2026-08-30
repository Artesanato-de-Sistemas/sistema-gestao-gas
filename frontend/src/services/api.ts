import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8001/api',
});

// Interceptor: auto-append trailing slash for mutation methods
// Django's DefaultRouter only registers URLs with trailing slashes,
// and APPEND_SLASH=True cannot redirect POST/PUT/PATCH/DELETE with a body.
api.interceptors.request.use(
  (config) => {
    // Append trailing slash if not already present and method is not GET/HEAD
    const method = (config.method || '').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
        config.url = config.url + '/';
      }
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Session expired or not authenticated — force re-login
      localStorage.removeItem('token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    // 403 Forbidden: propagate so the page can show an inline error
    return Promise.reject(error);
  }
);
