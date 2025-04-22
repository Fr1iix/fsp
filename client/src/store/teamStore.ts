import { create } from 'zustand';
import { Team, TeamStatus } from '../types';
import api from '../utils/api';

interface TeamState {
  teams: Team[];
  currentTeam: Team | null;
  isLoading: boolean;
  error: string | null;
}

interface TeamStore extends TeamState {
  fetchTeamsByCompetition: (competitionId: string) => Promise<void>;
  getTeamById: (id: string) => Promise<void>;
  createTeam: (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateTeam: (id: string, updates: Partial<Team>) => Promise<void>;
  joinTeam: (teamId: string, userId: string, userDetails: { firstName: string; lastName: string; }) => Promise<void>;
  leaveTeam: (teamId: string, userId: string) => Promise<void>;
  updateTeamStatus: (teamId: string, status: TeamStatus) => Promise<void>;
}

export const useTeamStore = create<TeamStore>((set, get) => ({
  teams: [],
  currentTeam: null,
  isLoading: false,
  error: null,

  fetchTeamsByCompetition: async (competitionId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/teams/competition/${competitionId}`);
      set({ teams: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при загрузке команд',
        isLoading: false
      });
    }
  },

  getTeamById: async (id) => {
    set({ isLoading: true, error: null, currentTeam: null });
    try {
      const response = await api.get(`/teams/${id}`);
      set({ currentTeam: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при загрузке команды',
        isLoading: false
      });
    }
  },

  createTeam: async (team) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/teams', team);

      // Обновляем список команд
      await get().fetchTeamsByCompetition(team.competitionId);
      set({ isLoading: false });

      return response.data.id || null;
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при создании команды',
        isLoading: false
      });
      return null;
    }
  },

  updateTeam: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/teams/${id}`, updates);

      // Обновляем текущую команду если она открыта
      if (get().currentTeam?.id === id) {
        await get().getTeamById(id);
      }

      // Обновляем список команд для соответствующего соревнования
      const currentTeam = get().currentTeam;
      if (currentTeam && currentTeam.competitionId) {
        await get().fetchTeamsByCompetition(currentTeam.competitionId);
      }

      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при обновлении команды',
        isLoading: false
      });
    }
  },

  joinTeam: async (teamId, userId, userDetails) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/teams/${teamId}/members`, {
        userId,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName
      });

      // Обновляем данные команды
      await get().getTeamById(teamId);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при присоединении к команде',
        isLoading: false
      });
    }
  },

  leaveTeam: async (teamId, userId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/teams/${teamId}/members/${userId}`);

      // Обновляем данные команды
      await get().getTeamById(teamId);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при выходе из команды',
        isLoading: false
      });
    }
  },

  updateTeamStatus: async (teamId, status) => {
    set({ isLoading: true, error: null });
    try {
      await api.patch(`/teams/${teamId}/status`, { status });

      // Обновляем данные команды
      await get().getTeamById(teamId);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error?.response?.data?.message || 'Ошибка при обновлении статуса команды',
        isLoading: false
      });
    }
  }
}));