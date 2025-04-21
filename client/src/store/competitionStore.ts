import { create } from 'zustand';
import { Competition, CompetitionDiscipline, CompetitionFormat } from '../types';
import { supabase } from '../lib/supabase.ts';

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

      let query = supabase
        .from('competitions')
        .select('*');

      // Применяем фильтры
      if (allFilters.format) {
        query = query.eq('format', allFilters.format);
      }
      
      if (allFilters.discipline) {
        query = query.eq('discipline', allFilters.discipline);
      }
      
      if (allFilters.region) {
        query = query.contains('region', [allFilters.region]);
      }
      
      if (allFilters.search) {
        query = query.ilike('title', `%${allFilters.search}%`);
      }
      
      if (allFilters.status) {
        query = query.eq('status', allFilters.status);
      }
      
      if (allFilters.dateFrom) {
        query = query.gte('startDate', allFilters.dateFrom);
      }
      
      if (allFilters.dateTo) {
        query = query.lte('endDate', allFilters.dateTo);
      }

      const { data, error } = await query.order('createdAt', { ascending: false });

      if (error) throw error;

      set({ competitions: data as Competition[], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при загрузке соревнований', 
        isLoading: false 
      });
    }
  },

  getCompetitionById: async (id) => {
    set({ isLoading: true, error: null, currentCompetition: null });
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      set({ currentCompetition: data as Competition, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при загрузке соревнования', 
        isLoading: false 
      });
    }
  },

  createCompetition: async (competition) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('competitions')
        .insert({
          ...competition,
          createdAt: now,
          updatedAt: now,
        })
        .select();

      if (error) throw error;
      
      // Обновляем список соревнований
      await get().fetchCompetitions();
      set({ isLoading: false });
      
      return data[0]?.id || null;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при создании соревнования', 
        isLoading: false 
      });
      return null;
    }
  },

  updateCompetition: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('competitions')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Обновляем текущее соревнование если оно открыто
      if (get().currentCompetition?.id === id) {
        await get().getCompetitionById(id);
      }
      
      // Обновляем список соревнований
      await get().fetchCompetitions();
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при обновлении соревнования', 
        isLoading: false 
      });
    }
  },

  setFilters: (filters) => {
    set({ filters });
  },
}));