import { create } from 'zustand';
import { Competition, CompetitionDiscipline, CompetitionFormat } from '../types';
import api from '../utils/api';

interface CompetitionFilters {
  format?: CompetitionFormat;
  discipline?: CompetitionDiscipline;
  region?: string;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface CompetitionState {
  competitions: Competition[];
  currentCompetition: Competition | null;
  isLoading: boolean;
  error: string | null;
  filters: CompetitionFilters;
}

interface CompetitionStore extends CompetitionState {
  fetchCompetitions: (filters?: CompetitionFilters) => Promise<void>;
  getCompetitionById: (id: string) => Promise<void>;
  createCompetition: (competition: Omit<Competition, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateCompetition: (id: string, updates: Partial<Competition>) => Promise<void>;
  setFilters: (filters: CompetitionFilters) => void;
}

export const useCompetitionStore = create<CompetitionStore>((set, get) => ({
  competitions: [],
  currentCompetition: null,
  isLoading: false,
  error: null,
  filters: {},

  fetchCompetitions: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      // Объединяем сохраненные фильтры с новыми
      const allFilters = { ...get().filters, ...filters };
      set({ filters: allFilters });

      // Отправляем фильтры на сервер
      const response = await api.get('/competitions', { params: allFilters });
      set({ competitions: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при загрузке соревнований',
        isLoading: false
      });
    }
  },

  getCompetitionById: async (id) => {
    set({ isLoading: true, error: null, currentCompetition: null });
    try {
      const response = await api.get(`/competitions/${id}`);
      set({ currentCompetition: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при загрузке соревнования',
        isLoading: false
      });
    }
  },

  createCompetition: async (competition) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/competitions', competition);

      // Обновляем список соревнований
      await get().fetchCompetitions();
      set({ isLoading: false });

      return response.data.id || null;
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при создании соревнования',
        isLoading: false
      });
      return null;
    }
  },

  updateCompetition: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/competitions/${id}`, updates);

      // Обновляем текущее соревнование если оно открыто
      if (get().currentCompetition?.id === id) {
        await get().getCompetitionById(id);
      }

      // Обновляем список соревнований
      await get().fetchCompetitions();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при обновлении соревнования',
        isLoading: false
      });
    }
  },

  setFilters: (filters) => {
    set({ filters });
  },
}));