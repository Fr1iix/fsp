import { create } from 'zustand';
import { AuthState, User } from '../types';
import { supabase } from '../lib/supabase.ts';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: User['role'], userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Получаем профиль пользователя
      const { data: userData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      set({ user: userData as User, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка входа', 
        isLoading: false 
      });
    }
  },

  register: async (email, password, role, userData) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Создаем профиль пользователя
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          email,
          role,
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          region: userData.region,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        if (profileError) throw profileError;

        // Получаем созданный профиль
        const { data: createdUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (fetchError) throw fetchError;

        set({ user: createdUser as User, isLoading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка регистрации', 
        isLoading: false 
      });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка выхода', 
        isLoading: false 
      });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.user) {
        // Получаем профиль пользователя
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        if (error) throw error;
        
        set({ user: userData as User, isLoading: false });
      } else {
        set({ user: null, isLoading: false });
      }
    } catch (error) {
      set({ 
        user: null, 
        error: error instanceof Error ? error.message : 'Ошибка аутентификации', 
        isLoading: false 
      });
    }
  },
}));