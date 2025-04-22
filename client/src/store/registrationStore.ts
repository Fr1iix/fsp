import { create } from 'zustand';
import { CompetitionRegistration, RegistrationStatus } from '../types';
import api from '../utils/api';

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
      const response = await api.get(`/registrations/competition/${competitionId}`);
      set({ registrations: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при загрузке регистраций',
        isLoading: false
      });
    }
  },

  fetchUserRegistrations: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/registrations/user/${userId}`);
      set({ userRegistrations: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при загрузке регистраций пользователя',
        isLoading: false
      });
    }
  },

  createRegistration: async (registration) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/registrations', registration);

      // Обновляем список регистраций для соревнования
      await get().fetchRegistrationsByCompetition(registration.competitionId);

      // Если указан userId, обновляем также пользовательские регистрации
      if (registration.userId) {
        await get().fetchUserRegistrations(registration.userId);
      }

      set({ isLoading: false });

      return response.data.id || null;
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при создании регистрации',
        isLoading: false
      });
      return null;
    }
  },

  updateRegistrationStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      await api.patch(`/registrations/${id}/status`, { status });

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
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при обновлении статуса регистрации',
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

      await api.patch(`/registrations/${id}/withdraw`);

      if (registration) {
        // Обновляем список регистраций для соревнования
        await get().fetchRegistrationsByCompetition(registration.competitionId);

        // Если указан userId, обновляем также пользовательские регистрации
        if (registration.userId) {
          await get().fetchUserRegistrations(registration.userId);
        }
      }

      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при отзыве регистрации',
        isLoading: false
      });
    }
  },
}));