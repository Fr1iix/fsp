import { create } from 'zustand';
import { AuthState, User, UserRole } from '../types';
import { authAPI } from '../utils/api';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { token } = await authAPI.login(email, password);

      // Сохраняем токен в localStorage
      localStorage.setItem('token', token);

      // Декодируем токен для получения данных пользователя
      const decoded = jwtDecode<JwtPayload>(token);

      // Устанавливаем пользователя в стор
      set({
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          firstName: '',
          lastName: '',
          createdAt: '',
          updatedAt: ''
        },
        isLoading: false
      });
    } catch (error) {
      set({
        error: axios.isAxiosError(error)
          ? error.response?.data?.message || 'Ошибка входа'
          : 'Ошибка входа',
        isLoading: false
      });
    }
  },

  register: async (email, password, role = 'athlete') => {
    set({ isLoading: true, error: null });
    try {
      const { token } = await authAPI.register(email, password, role);

      // Сохраняем токен в localStorage
      localStorage.setItem('token', token);

      // Декодируем токен для получения данных пользователя
      const decoded = jwtDecode<JwtPayload>(token);

      // Устанавливаем пользователя в стор
      set({
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          firstName: '',
          lastName: '',
          createdAt: '',
          updatedAt: ''
        },
        isLoading: false
      });
    } catch (error) {
      set({
        error: axios.isAxiosError(error)
          ? error.response?.data?.message || 'Ошибка регистрации'
          : 'Ошибка регистрации',
        isLoading: false
      });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isLoading: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // Проверяем токен в localStorage
      const token = localStorage.getItem('token');

      if (!token) {
        set({ user: null, isLoading: false });
        return;
      }

      // Проверяем токен на сервере
      const { token: newToken } = await authAPI.check();

      // Обновляем токен в localStorage
      localStorage.setItem('token', newToken);

      // Декодируем токен для получения данных пользователя
      const decoded = jwtDecode<JwtPayload>(newToken);

      // Устанавливаем пользователя в стор
      set({
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          firstName: '',
          lastName: '',
          createdAt: '',
          updatedAt: ''
        },
        isLoading: false
      });
    } catch (error) {
      // При ошибке удаляем токен и сбрасываем авторизацию
      localStorage.removeItem('token');
      set({
        user: null,
        error: axios.isAxiosError(error)
          ? error.response?.data?.message || 'Ошибка аутентификации'
          : 'Ошибка аутентификации',
        isLoading: false
      });
    }
  },
}));