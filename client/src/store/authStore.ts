import { create } from 'zustand';
import { AuthState, User, UserRole } from '../types';
import { authAPI, userAPI } from '../utils/api';
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
  loadUserInfo: (userId: string) => Promise<void>;
  updateUserInfo: (userId: string, userInfo: any) => Promise<void>;
  userInfo: any | null;
  userInfoLoaded: boolean; // Флаг для отслеживания загрузки информации
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  userInfo: null,
  userInfoLoaded: false, // Изначально информация не загружена
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        isLoading: false
      });

      // Загружаем информацию о пользователе
      await get().loadUserInfo(decoded.id);
    } catch (error) {
      console.error('Ошибка при входе:', error);
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
      console.log('Registering user with email', email, 'and role', role);
      const { token } = await authAPI.register(email, password, role);

      // Сохраняем токен в localStorage
      localStorage.setItem('token', token);

      // Декодируем токен для получения данных пользователя
      const decoded = jwtDecode<JwtPayload>(token);
      console.log('Token decoded successfully', decoded);

      // Устанавливаем пользователя в стор
      set({
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          firstName: '',
          lastName: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        isLoading: false
      });

      // Загружаем информацию о пользователе
      try {
        await get().loadUserInfo(decoded.id);
      } catch (loadError) {
        console.error('Ошибка при загрузке информации о пользователе после регистрации:', loadError);
        // Не блокируем процесс регистрации из-за ошибки загрузки информации
      }
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
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
    set({
      user: null,
      userInfo: null,
      userInfoLoaded: false, // Сбрасываем флаг загрузки
      isLoading: false
    });
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        isLoading: false
      });

      // Загружаем информацию о пользователе если ещё не загружена
      const { userInfoLoaded } = get();
      if (!userInfoLoaded) {
        await get().loadUserInfo(decoded.id);
      }
    } catch (error) {
      console.error('Ошибка при проверке аутентификации:', error);
      // При ошибке удаляем токен и сбрасываем авторизацию
      localStorage.removeItem('token');
      set({
        user: null,
        userInfo: null,
        userInfoLoaded: false,
        error: axios.isAxiosError(error)
          ? error.response?.data?.message || 'Ошибка аутентификации'
          : 'Ошибка аутентификации',
        isLoading: false
      });
    }
  },

  loadUserInfo: async (userId) => {
    // Проверяем, загружена ли уже информация
    const { userInfoLoaded, userInfo } = get();
    if (userInfoLoaded && userInfo) {
      return;
    }

    try {
      console.log('Loading user info for user ID:', userId);
      const userInfo = await userAPI.getUserInfo(userId);
      console.log('User info loaded:', userInfo);

      // Обновляем пользователя с дополнительной информацией
      set(state => {
        if (state.user) {
          return {
            user: {
              ...state.user,
              firstName: userInfo.firstName || '',
              lastName: userInfo.lastName || '',
              // Добавляем другие поля из userInfo при необходимости
            },
            userInfo: userInfo,
            userInfoLoaded: true // Отмечаем, что информация загружена
          };
        }
        return state;
      });
    } catch (error) {
      console.error('Ошибка при загрузке информации о пользователе:', error);
      // Отмечаем, что попытка загрузки была совершена
      set({ userInfoLoaded: true });
    }
  },

  updateUserInfo: async (userId, userInfo) => {
    set({ isLoading: true });
    try {
      const updatedInfo = await userAPI.updateUserInfo(userId, userInfo);

      // Обновляем информацию в сторе
      set(state => {
        if (state.user) {
          return {
            user: {
              ...state.user,
              firstName: updatedInfo.firstName || state.user.firstName,
              lastName: updatedInfo.lastName || state.user.lastName,
              // Добавляем другие поля при необходимости
            },
            userInfo: updatedInfo,
            userInfoLoaded: true,
            isLoading: false
          };
        }
        return { ...state, isLoading: false };
      });
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      set({
        error: axios.isAxiosError(error)
          ? error.response?.data?.message || 'Ошибка обновления профиля'
          : 'Ошибка обновления профиля',
        isLoading: false
      });
    }
  }
}));