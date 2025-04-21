import { create } from 'zustand';
import { CompetitionRegistration, RegistrationStatus } from '../types';
import { supabase } from '../lib/supabase.ts';

interface RegistrationState {
  registrations: CompetitionRegistration[];
  userRegistrations: CompetitionRegistration[];
  isLoading: boolean;
  error: string | null;
}

interface RegistrationStore extends RegistrationState {
  fetchRegistrationsByCompetition: (competitionId: string) => Promise<void>;
  fetchUserRegistrations: (userId: string) => Promise<void>;
  createRegistration: (registration: Omit<CompetitionRegistration, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateRegistrationStatus: (id: string, status: RegistrationStatus) => Promise<void>;
  withdrawRegistration: (id: string) => Promise<void>;
}

export const useRegistrationStore = create<RegistrationStore>((set, get) => ({
  registrations: [],
  userRegistrations: [],
  isLoading: false,
  error: null,

  fetchRegistrationsByCompetition: async (competitionId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('competitionId', competitionId);

      if (error) throw error;

      set({ registrations: data as CompetitionRegistration[], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при загрузке регистраций', 
        isLoading: false 
      });
    }
  },

  fetchUserRegistrations: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*')
        .eq('userId', userId);

      if (error) throw error;

      set({ userRegistrations: data as CompetitionRegistration[], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при загрузке регистраций пользователя', 
        isLoading: false 
      });
    }
  },

  createRegistration: async (registration) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('registrations')
        .insert({
          ...registration,
          createdAt: now,
          updatedAt: now,
        })
        .select();

      if (error) throw error;
      
      // Обновляем список регистраций для соревнования
      await get().fetchRegistrationsByCompetition(registration.competitionId);
      
      // Если указан userId, обновляем также пользовательские регистрации
      if (registration.userId) {
        await get().fetchUserRegistrations(registration.userId);
      }
      
      set({ isLoading: false });
      
      return data[0]?.id || null;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при создании регистрации', 
        isLoading: false 
      });
      return null;
    }
  },

  updateRegistrationStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('registrations')
        .update({
          status,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Находим регистрацию, чтобы узнать competitionId и userId
      const registration = [...get().registrations, ...get().userRegistrations]
        .find(reg => reg.id === id);
      
      if (registration) {
        // Обновляем список регистраций для соревнования
        await get().fetchRegistrationsByCompetition(registration.competitionId);
        
        // Если указан userId, обновляем также пользовательские регистрации
        if (registration.userId) {
          await get().fetchUserRegistrations(registration.userId);
        }
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при обновлении статуса регистрации', 
        isLoading: false 
      });
    }
  },

  withdrawRegistration: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Находим регистрацию, чтобы узнать competitionId и userId
      const registration = [...get().registrations, ...get().userRegistrations]
        .find(reg => reg.id === id);
      
      const { error } = await supabase
        .from('registrations')
        .update({
          status: 'withdrawn',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      if (registration) {
        // Обновляем список регистраций для соревнования
        await get().fetchRegistrationsByCompetition(registration.competitionId);
        
        // Если указан userId, обновляем также пользовательские регистрации
        if (registration.userId) {
          await get().fetchUserRegistrations(registration.userId);
        }
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при отзыве регистрации', 
        isLoading: false 
      });
    }
  },
}));