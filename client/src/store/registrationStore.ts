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

      // Обновляем локальные данные, вместо дополнительных запросов
      // Если нужно обновить данные, тут нужно просто обновить соответствующие массивы
      set(state => {
        const newRegistration = response.data;
        return {
          isLoading: false,
          // Добавляем новую регистрацию в списки, если она относится к текущим спискам
          registrations: registration.competitionId === state.registrations[0]?.competitionId
            ? [...state.registrations, newRegistration]
            : state.registrations,
          userRegistrations: registration.userId
            ? [...state.userRegistrations, newRegistration]
            : state.userRegistrations,
        };
      });

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
      const response = await api.patch(`/registrations/${id}/status`, { status });
      const updatedRegistration = response.data;

      // Обновляем существующие данные без дополнительных запросов
      set(state => ({
        isLoading: false,
        // Обновляем регистрацию в списке регистраций соревнования
        registrations: state.registrations.map(reg =>
          reg.id === id ? { ...reg, status } : reg
        ),
        // Обновляем регистрацию в списке пользовательских регистраций
        userRegistrations: state.userRegistrations.map(reg =>
          reg.id === id ? { ...reg, status } : reg
        ),
      }));
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
      await api.patch(`/registrations/${id}/withdraw`);

      // Обновляем локальные данные, вместо дополнительных запросов
      set(state => ({
        isLoading: false,
        // Обновляем статус в списке регистраций соревнования
        registrations: state.registrations.map(reg =>
          reg.id === id ? { ...reg, status: 'withdrawn' as RegistrationStatus } : reg
        ),
        // Обновляем статус в списке пользовательских регистраций
        userRegistrations: state.userRegistrations.map(reg =>
          reg.id === id ? { ...reg, status: 'withdrawn' as RegistrationStatus } : reg
        ),
      }));
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при отзыве регистрации',
        isLoading: false
      });
    }
  },
}));