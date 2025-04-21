import { create } from 'zustand';
import { Team, TeamStatus } from '../types';
import { supabase } from '../lib/supabase.ts';

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
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('competitionId', competitionId);

      if (error) throw error;

      set({ teams: data as Team[], isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при загрузке команд', 
        isLoading: false 
      });
    }
  },

  getTeamById: async (id) => {
    set({ isLoading: true, error: null, currentTeam: null });
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      set({ currentTeam: data as Team, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при загрузке команды', 
        isLoading: false 
      });
    }
  },

  createTeam: async (team) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('teams')
        .insert({
          ...team,
          createdAt: now,
          updatedAt: now,
        })
        .select();

      if (error) throw error;
      
      // Обновляем список команд
      await get().fetchTeamsByCompetition(team.competitionId);
      set({ isLoading: false });
      
      return data[0]?.id || null;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при создании команды', 
        isLoading: false 
      });
      return null;
    }
  },

  updateTeam: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Обновляем текущую команду если она открыта
      if (get().currentTeam?.id === id) {
        await get().getTeamById(id);
      }
      
      // Обновляем список команд для соответствующего соревнования
      if (get().currentTeam?.competitionId) {
        await get().fetchTeamsByCompetition(get().currentTeam.competitionId);
      }
      
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при обновлении команды', 
        isLoading: false 
      });
    }
  },

  joinTeam: async (teamId, userId, userDetails) => {
    set({ isLoading: true, error: null });
    try {
      // Получаем текущую команду
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      const team = teamData as Team;
      const newMember = {
        userId,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        isCapitain: false,
        joinedAt: new Date().toISOString(),
      };

      // Добавляем нового участника
      const { error } = await supabase
        .from('teams')
        .update({
          members: [...team.members, newMember],
          updatedAt: new Date().toISOString(),
        })
        .eq('id', teamId);

      if (error) throw error;

      // Обновляем данные команды
      await get().getTeamById(teamId);
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при присоединении к команде', 
        isLoading: false 
      });
    }
  },

  leaveTeam: async (teamId, userId) => {
    set({ isLoading: true, error: null });
    try {
      // Получаем текущую команду
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      const team = teamData as Team;
      
      // Удаляем участника из списка
      const updatedMembers = team.members.filter(member => member.userId !== userId);
      
      const { error } = await supabase
        .from('teams')
        .update({
          members: updatedMembers,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', teamId);

      if (error) throw error;

      // Обновляем данные команды
      await get().getTeamById(teamId);
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при выходе из команды', 
        isLoading: false 
      });
    }
  },

  updateTeamStatus: async (teamId, status) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          status,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', teamId);

      if (error) throw error;

      // Обновляем данные команды
      await get().getTeamById(teamId);
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка при обновлении статуса команды', 
        isLoading: false 
      });
    }
  },
}));