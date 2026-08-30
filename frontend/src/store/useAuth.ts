import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isAdmin: (() => {
    try {
      const stored = localStorage.getItem('auth_user');
      if (!stored) return false;
      const u = JSON.parse(stored) as User;
      return u?.role === 'ADMIN';
    } catch {
      return false;
    }
  })(),
  login: (user, token) => {
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true, isAdmin: user.role === 'ADMIN' });
  },
  logout: () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, isAdmin: false });
  },
}));
