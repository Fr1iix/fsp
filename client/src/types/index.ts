// Типы пользователей
export type UserRole = 'fsp' | 'regional' | 'athlete';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  region?: string;
  createdAt: string;
  updatedAt: string;
}

// Профиль спортсмена
export interface AthleteProfile extends User {
  role: 'athlete';
  achievements: Achievement[];
  teams: Team[];
  competitions: CompetitionRegistration[];
}

// Типы соревнований
export type CompetitionFormat = 'open' | 'regional' | 'federal';
export type CompetitionDiscipline =
  | 'product'
  | 'security'
  | 'algorithm'
  | 'robotics'
  | 'drones';

export type CompetitionStatus =
  | 'draft'
  | 'registration'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Competition {
  id: string;
  title: string;
  description: string;
  format: CompetitionFormat;
  discipline: CompetitionDiscipline;
  registrationStart: string;
  registrationEnd: string;
  startDate: string;
  endDate: string;
  status: CompetitionStatus;
  createdBy: string;
  region?: string[];
  maxParticipants?: number;
  createdAt: string;
  updatedAt: string;
}

// Заявки на соревнования
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

export interface Application {
  id: string;
  UserId: string;
  TeamId?: string;
  CompetitionId?: string;
  status: ApplicationStatus;
  UUID?: string;
  createdAt: string;
  updatedAt: string;
  User?: User;
  Team?: Team;
  Competition?: Competition;
  competitionData?: any;
}

export interface CompetitionRequest {
  id: string;
  title: string;
  description: string;
  format: CompetitionFormat;
  discipline: CompetitionDiscipline;
  region: string;
  startDate: string;
  endDate: string;
  maxParticipants: number;
  requesterId: string;
  requesterName: string;
  requesterRegion: string;
  status: ApplicationStatus;
  createdAt: string;
}

// Команды
export type TeamStatus = 'forming' | 'complete' | 'approved' | 'rejected';

export interface TeamMember {
  userId: string;
  firstName: string;
  lastName: string;
  role?: string;
  isCapitain: boolean;
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  competitionId: string;
  status: TeamStatus;
  members: TeamMember[];
  requiredRoles?: string[];
  createdAt: string;
  updatedAt: string;
}

// Регистрации
export type RegistrationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export interface CompetitionRegistration {
  id: string;
  competitionId: string;
  teamId?: string;
  userId?: string;
  status: RegistrationStatus;
  createdAt: string;
  updatedAt: string;
}

// Достижения
export interface Achievement {
  id: string;
  userId: string;
  competitionId: string;
  place: number;
  teamId?: string;
  isConfirmed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Состояния аутентификации
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}