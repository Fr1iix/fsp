import { CompetitionDiscipline, CompetitionFormat, CompetitionStatus } from '../types';

// Преобразование дисциплины в русское название
export const getDisciplineName = (discipline: CompetitionDiscipline): string => {
  const names: Record<CompetitionDiscipline, string> = {
    product: 'Продуктовое программирование',
    security: 'Программирование систем информационной безопасности',
    algorithm: 'Алгоритмическое программирование',
    robotics: 'Программирование робототехники',
    drones: 'Программирование беспилотных авиационных систем',
  };
  return names[discipline] || 'Неизвестная дисциплина';
};

// Преобразование формата соревнования в русское название
export const getFormatName = (format: CompetitionFormat): string => {
  const names: Record<CompetitionFormat, string> = {
    open: 'Открытое',
    regional: 'Региональное',
    federal: 'Всероссийское',
  };
  return names[format] || 'Неизвестный формат';
};

// Преобразование статуса соревнования в русское название
export const getStatusName = (status: CompetitionStatus): string => {
  const names: Record<CompetitionStatus, string> = {
    draft: 'Черновик',
    registration: 'Регистрация открыта',
    in_progress: 'Проходит',
    completed: 'Завершено',
    cancelled: 'Отменено',
  };
  return names[status] || 'Неизвестный статус';
};

// Определяем цвет бейджа для статуса соревнования
export const getStatusColor = (status: CompetitionStatus): string => {
  const colors: Record<CompetitionStatus, string> = {
    draft: 'neutral',
    registration: 'success',
    in_progress: 'primary',
    completed: 'secondary',
    cancelled: 'error',
  };
  return colors[status] || 'neutral';
};

// Определяем цвет бейджа для дисциплины
export const getDisciplineColor = (discipline: CompetitionDiscipline): string => {
  const colors: Record<CompetitionDiscipline, string> = {
    product: 'primary',
    security: 'error',
    algorithm: 'secondary',
    robotics: 'success',
    drones: 'warning',
  };
  return colors[discipline] || 'neutral';
};

// Форматирование даты в российском формате
export const formatDate = (date: string | Date): string => {
  if (!date) return '';

  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Форматирование даты и времени в российском формате
export const formatDateTime = (date: string | Date): string => {
  if (!date) return '';

  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Проверка, активна ли сейчас регистрация на соревнование
export const isRegistrationOpen = (competition: { registrationStart: string; registrationEnd: string }): boolean => {
  const now = new Date();
  const regStart = new Date(competition.registrationStart);
  const regEnd = new Date(competition.registrationEnd);

  return now >= regStart && now <= regEnd;
};

// Проверка, проходит ли соревнование сейчас
export const isCompetitionInProgress = (competition: { startDate: string; endDate: string }): boolean => {
  const now = new Date();
  const start = new Date(competition.startDate);
  const end = new Date(competition.endDate);

  return now >= start && now <= end;
};

// Проверка, завершилось ли соревнование
export const isCompetitionCompleted = (competition: { endDate: string }): boolean => {
  const now = new Date();
  const end = new Date(competition.endDate);

  return now > end;
};

// Функция для автоматического определения актуального статуса соревнования
export const getActualCompetitionStatus = (competition: {
  startDate: string;
  endDate: string;
  registrationStart?: string;
  registrationEnd?: string;
  status?: string;
}): CompetitionStatus => {
  // Если соревнование отменено, оставляем статус без изменений
  if (competition.status === 'cancelled') {
    return 'cancelled';
  }

  const now = new Date();
  const start = new Date(competition.startDate);
  const end = new Date(competition.endDate);

  // Если соревнование уже завершилось
  if (now > end) {
    return 'completed';
  }

  // Если соревнование сейчас проходит
  if (now >= start && now <= end) {
    return 'in_progress';
  }

  // Если есть данные о периоде регистрации
  if (competition.registrationStart && competition.registrationEnd) {
    const regStart = new Date(competition.registrationStart);
    const regEnd = new Date(competition.registrationEnd);

    // Если сейчас период регистрации
    if (now >= regStart && now <= regEnd) {
      return 'registration';
    }
  }

  // Если другие условия не выполнены и соревнование в статусе черновика, оставляем его
  if (competition.status === 'draft') {
    return 'draft';
  }

  // В остальных случаях (например, регистрация еще не началась или уже завершилась)
  // но соревнование еще не началось, возвращаем статус registration
  return 'registration';
};