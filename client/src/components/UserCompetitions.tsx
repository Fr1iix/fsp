import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api, { competitionAPI, teamsAPI, applicationAPI } from '../utils/api';
import { Card } from './ui/Card';
import { Calendar, Users, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import Button from './ui/Button';
import Badge from '../components/ui/Badge';

interface Competition {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  discription?: string;  // Поддержка разных вариантов именования полей
  startDate?: string;
  start_date?: string;
  startdate?: string;
  startdate_cometition?: string;
  endDate?: string;
  end_date?: string;
  enddate?: string;
  enddate_cometition?: string;
  location?: string;
  format?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Team {
  id: string;
  name: string;
  competitions?: Competition[];
  CompetitionId?: string;
}

interface UserCompetitionsProps {
  className?: string;
}

interface TeamApplication {
  id: string;
  teamId?: string;
  TeamId?: string;
  team?: Team;
  competitionId?: string;
  CompetitionId?: string;
  competition?: Competition;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

// Функция для форматирования даты с подробным логированием
const formatDate = (dateStr?: string): string => {
  if (!dateStr) {
    console.log('Пустая дата передана в formatDate');
    return 'Не указано';
  }

  console.log(`Попытка форматирования даты: "${dateStr}" (тип: ${typeof dateStr})`);
  
  // Для отладки пробуем разные варианты преобразования
  try {
    // Общее преобразование
    const date = new Date(dateStr);
    console.log(`Преобразование в Date: ${date}`, 'isValid:', !isNaN(date.getTime()));
    
    if (!isNaN(date.getTime())) {
      const formatted = date.toLocaleDateString('ru-RU');
      console.log(`Успешно отформатирована дата: ${formatted}`);
      return formatted;
    }
    
    // Если строка содержит специальные форматы
    if (dateStr.includes('T')) {
      console.log('Обнаружен ISO формат');
      const isoDate = new Date(dateStr);
      if (!isNaN(isoDate.getTime())) {
        return isoDate.toLocaleDateString('ru-RU');
      }
    } else if (dateStr.includes('-')) {
      console.log('Обнаружен формат с дефисами:', dateStr);
      const parts = dateStr.split('-');
      console.log('Части даты:', parts);
      
      if (parts.length === 3) {
        try {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const day = parseInt(parts[2]);
          
          console.log(`Преобразованные части: год=${year}, месяц=${month}, день=${day}`);
          
          const constructedDate = new Date(year, month, day);
          console.log('Созданная дата:', constructedDate);
          
          if (!isNaN(constructedDate.getTime())) {
            return constructedDate.toLocaleDateString('ru-RU');
          }
        } catch (e) {
          console.error('Ошибка при разборе даты с дефисами:', e);
        }
      }
    }
    
    // Когда не получается отформатировать дату, возвращаем оригинальное значение для отладки
    console.log('Не удалось отформатировать дату, возвращаем оригинал');
    return dateStr; // Возвращаем оригинальную строку, чтобы видеть фактические данные
  } catch (e) {
    console.error('Ошибка при форматировании даты:', e);
    return dateStr; // Возвращаем оригинальную строку, чтобы видеть фактические данные
  }
};

const UserCompetitions: React.FC<UserCompetitionsProps> = ({ className }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [userApplications, setUserApplications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);
  const [teamApplications, setTeamApplications] = useState<TeamApplication[]>([]);

  // Резервные данные для соревнований на случай, если API недоступен
  const fallbackCompetitions: Competition[] = [
    {
      id: '1',
      title: 'Олимпиада по программированию',
      name: 'Олимпиада по программированию',
      description: 'Всероссийская олимпиада по программированию для студентов',
      discription: 'Всероссийская олимпиада по программированию для студентов',
      startDate: '2024-05-15',
      endDate: '2024-05-17',
      location: 'Москва',
      format: 'Офлайн',
      status: 'active'
    },
    {
      id: '2',
      title: 'Хакатон по искусственному интеллекту',
      name: 'Хакатон по искусственному интеллекту',
      description: 'Разработка ИИ-решений для реальных бизнес-задач',
      discription: 'Разработка ИИ-решений для реальных бизнес-задач',
      startDate: '2024-06-10',
      endDate: '2024-06-12',
      location: 'Санкт-Петербург',
      format: 'Гибридный',
      status: 'active'
    }
  ];

  // Улучшенная нормализация данных соревнований для корректного отображения
  const normalizeCompetition = (comp: any): Competition => {
    if (!comp) return { id: 'unknown' };
    
    // Вывод оригинальных данных для отладки
    console.log('Исходные данные соревнования для нормализации:', comp);
    
    // Извлечение идентификатора
    const id = comp.id || comp.ID || comp.competitionId || comp.CompetitionId || 'unknown';
    
    // Извлечение названия (используем несколько полей и проверок)
    let title = '';
    if (typeof comp.title === 'string' && comp.title.trim()) {
      title = comp.title.trim();
    } else if (typeof comp.name === 'string' && comp.name.trim()) {
      title = comp.name.trim();
    } else if (typeof comp.Title === 'string' && comp.Title.trim()) {
      title = comp.Title.trim();
    } else if (typeof comp.Name === 'string' && comp.Name.trim()) {
      title = comp.Name.trim();
    } else {
      title = id; // Если название не найдено, используем ID
    }
    
    // Извлечение описания с проверкой на пустые строки
    let description = '';
    if (typeof comp.description === 'string' && comp.description.trim()) {
      description = comp.description.trim();
    } else if (typeof comp.discription === 'string' && comp.discription.trim()) {
      description = comp.discription.trim();
    } else if (typeof comp.Description === 'string' && comp.Description.trim()) {
      description = comp.Description.trim();
    } else if (typeof comp.Discription === 'string' && comp.Discription.trim()) {
      description = comp.Discription.trim();
    } else {
      description = 'Описание отсутствует';
    }
    
    // Извлечение дат с подробным логированием
    console.log('Исходные поля дат:', {
      startDate: comp.startDate,
      start_date: comp.start_date,
      StartDate: comp.StartDate,
      Start_date: comp.Start_date,
      startdate: comp.startdate,
      startdate_cometition: comp.startdate_cometition,
      endDate: comp.endDate,
      end_date: comp.end_date,
      EndDate: comp.EndDate,
      End_date: comp.End_date,
      enddate: comp.enddate,
      enddate_cometition: comp.enddate_cometition
    });

    // Попробуем найти дату начала в разных форматах, включая поля из базы данных
    let startDate = '';
    if (comp.startDate) {
      console.log('Найдено поле startDate:', comp.startDate);
      startDate = comp.startDate;
    } else if (comp.start_date) {
      console.log('Найдено поле start_date:', comp.start_date);
      startDate = comp.start_date;
    } else if (comp.startdate) {
      console.log('Найдено поле startdate:', comp.startdate);
      startDate = comp.startdate;
    } else if (comp.startdate_cometition) {
      console.log('Найдено поле startdate_cometition:', comp.startdate_cometition);
      startDate = comp.startdate_cometition;
    } else if (comp.StartDate) {
      console.log('Найдено поле StartDate:', comp.StartDate);
      startDate = comp.StartDate;
    } else if (comp.Start_date) {
      console.log('Найдено поле Start_date:', comp.Start_date);
      startDate = comp.Start_date;
    } else if (comp.start) {
      console.log('Найдено поле start:', comp.start);
      startDate = comp.start;
    }
    
    // Попробуем найти дату окончания в разных форматах, включая поля из базы данных
    let endDate = '';
    if (comp.endDate) {
      console.log('Найдено поле endDate:', comp.endDate);
      endDate = comp.endDate;
    } else if (comp.end_date) {
      console.log('Найдено поле end_date:', comp.end_date);
      endDate = comp.end_date;
    } else if (comp.enddate) {
      console.log('Найдено поле enddate:', comp.enddate);
      endDate = comp.enddate;
    } else if (comp.enddate_cometition) {
      console.log('Найдено поле enddate_cometition:', comp.enddate_cometition);
      endDate = comp.enddate_cometition;
    } else if (comp.EndDate) {
      console.log('Найдено поле EndDate:', comp.EndDate);
      endDate = comp.EndDate;
    } else if (comp.End_date) {
      console.log('Найдено поле End_date:', comp.End_date);
      endDate = comp.End_date;
    } else if (comp.end) {
      console.log('Найдено поле end:', comp.end);
      endDate = comp.end;
    }
    
    console.log('Итоговые даты перед нормализацией:', { startDate, endDate });
    
    // Извлечение местоположения и формата
    const location = (comp.location || comp.Location || '').toString();
    const format = (comp.format || comp.Format || '').toString();
    
    // Извлечение статуса
    const status = comp.status || comp.Status || 'active';
    
    // Создаем нормализованный объект соревнования
    const normalizedComp: Competition = {
      id,
      title,
      name: title,
      description,
      discription: description,
      startDate,
      start_date: startDate,
      endDate,
      end_date: endDate,
      location,
      format,
      status,
      createdAt: comp.createdAt || comp.created_at || comp.CreatedAt,
      updatedAt: comp.updatedAt || comp.updated_at || comp.UpdatedAt
    };
    
    console.log('Нормализованные данные соревнования:', normalizedComp);
    return normalizedComp;
  };

  // Функция для получения цвета статуса заявки
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
      case 'declined':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
      case 'waiting':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Функция для получения читаемого статуса заявки
  const getStatusText = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'accepted':
        return 'Одобрена';
      case 'rejected':
      case 'declined':
        return 'Отклонена';
      case 'pending':
      case 'waiting':
        return 'На рассмотрении';
      default:
        return status || 'Неизвестно';
    }
  };

  // Функция для определения URL соревнования
  const getCompetitionUrl = (competitionId: string) => {
    // Проверяем, является ли ID резервного соревнования
    const isFallbackCompetition = fallbackCompetitions.some(c => c.id === competitionId);
    if (isFallbackCompetition) {
      return '/competitions'; // Если это резервное соревнование, перенаправляем на страницу со списком
    }
    return `/competition/${competitionId}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setIsLoading(true);
      setError(null);
      setHasAttemptedFetch(true);
      
      // Массивы для хранения всех соревнований, которые нужно отобразить
      let allCompetitions: Competition[] = [];
      let competitionIds: Set<string> = new Set();
      let teams: Team[] = [];
      let applications: any[] = [];
      let combinedTeamApplications: TeamApplication[] = [];
      
      try {
        // 1. Получаем команды пользователя
        try {
          console.log('Запрашиваем команды пользователя...');
          const teamsResponse = await teamsAPI.getAll();
          teams = teamsResponse || [];
          console.log('Получены команды пользователя (сырые данные):', teams);
          setUserTeams(teams);
          
          // Собираем ID соревнований из команд
          teams.forEach((team: Team) => {
            if (team.CompetitionId) {
              competitionIds.add(team.CompetitionId);
              console.log(`Найден ID соревнования в команде: ${team.CompetitionId}`);
            }
          });
        } catch (error) {
          console.error('Ошибка при загрузке команд:', error);
          setUserTeams([]);
        }

        // 2. Получаем все соревнования
        try {
          console.log('Запрашиваем список соревнований...');
          const allCompetitionsResponse = await competitionAPI.getAll();
          const allCompetitionsData = allCompetitionsResponse || [];
          console.log('Получен список всех соревнований (сырые данные):', allCompetitionsData);
          
          // Нормализуем данные соревнований
          if (Array.isArray(allCompetitionsData)) {
            console.log('Получен массив соревнований, длина:', allCompetitionsData.length);
            allCompetitionsData.forEach(comp => {
              const normalizedComp = normalizeCompetition(comp);
              allCompetitions.push(normalizedComp);
            });
          } else if (allCompetitionsData && typeof allCompetitionsData === 'object') {
            console.log('Получен объект соревнования (не массив):', allCompetitionsData);
            const normalizedComp = normalizeCompetition(allCompetitionsData);
            allCompetitions.push(normalizedComp);
          }
        } catch (error) {
          console.error('Ошибка при загрузке соревнований:', error);
        }

        // 3. Получаем заявки пользователя
        try {
          console.log('Запрашиваем заявки пользователя...');
          const applicationsResponse = await applicationAPI.getByUser(user.id);
          applications = applicationsResponse || [];
          console.log('Получены заявки пользователя (сырые данные):', applications);
          setUserApplications(applications);
          
          // Добавляем ID соревнований из заявок
          if (Array.isArray(applications)) {
            applications.forEach((app: any) => {
              const compId = app.competitionId || app.CompetitionId;
              if (compId) {
                competitionIds.add(compId);
                console.log(`Найден ID соревнования в заявке: ${compId}`);
              }
            });
          }
        } catch (error) {
          console.error('Ошибка при загрузке заявок:', error);
          setUserApplications([]);
        }
        
        // 4. Если у нас есть ID соревнований, но нет полной информации о них, запрашиваем по ID
        if (competitionIds.size > 0) {
          console.log('ID соревнований для запроса:', [...competitionIds]);
          
          // Запрашиваем информацию о конкретных соревнованиях, если их нет в общем списке
          for (const compId of competitionIds) {
            if (!allCompetitions.some(c => c.id === compId)) {
              try {
                console.log(`Запрашиваем информацию о соревновании ${compId}...`);
                const compResponse = await competitionAPI.getOne(compId);
                console.log(`Полученные данные о соревновании ${compId}:`, compResponse);
                if (compResponse) {
                  const normalizedComp = normalizeCompetition(compResponse);
                  allCompetitions.push(normalizedComp);
                }
              } catch (error) {
                console.error(`Ошибка при загрузке соревнования ${compId}:`, error);
              }
            }
          }
        }
        
        // 5. Устанавливаем список соревнований
        console.log('Итоговый список соревнований для пользователя:', allCompetitions);
        if (allCompetitions.length > 0) {
          setCompetitions(allCompetitions);
        } else {
          // Если не получилось загрузить реальные соревнования, используем резервные
          console.log('Нет реальных соревнований, используем резервные данные');
          setCompetitions(fallbackCompetitions);
        }

        // 6. Обрабатываем заявки и команды для отображения статусов
        if (Array.isArray(applications) && applications.length > 0) {
          // Создаем объект для быстрого поиска соревнований по ID
          const competitionsMap = new Map<string, Competition>();
          allCompetitions.forEach(comp => {
            competitionsMap.set(comp.id, comp);
          });

          // Создаем объект для быстрого поиска команд по ID
          const teamsMap = new Map<string, Team>();
          teams.forEach(team => {
            teamsMap.set(team.id, team);
          });

          // Обрабатываем заявки
          applications.forEach((app: any) => {
            const teamId = app.teamId || app.TeamId;
            const compId = app.competitionId || app.CompetitionId;
            
            const teamApplication: TeamApplication = {
              id: app.id || 'unknown',
              teamId: teamId,
              TeamId: teamId,
              competitionId: compId,
              CompetitionId: compId,
              status: app.status || 'pending',
              createdAt: app.createdAt,
              updatedAt: app.updatedAt
            };

            // Добавляем информацию о команде и соревновании
            if (teamId && teamsMap.has(teamId)) {
              teamApplication.team = teamsMap.get(teamId);
            }
            
            if (compId && competitionsMap.has(compId)) {
              teamApplication.competition = competitionsMap.get(compId);
            }

            combinedTeamApplications.push(teamApplication);
          });

          console.log('Обработанные заявки команд:', combinedTeamApplications);
          setTeamApplications(combinedTeamApplications);
        }

      } catch (error) {
        console.error('Общая ошибка при загрузке данных:', error);
        console.log('Используем резервные данные из-за общей ошибки');
        setCompetitions(fallbackCompetitions);
        setError('Произошла ошибка при загрузке данных');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !hasAttemptedFetch) {
      fetchData();
    } else if (!hasAttemptedFetch) {
      // Если нет пользователя, все равно показываем резервные данные
      setCompetitions(fallbackCompetitions);
      setIsLoading(false);
      setHasAttemptedFetch(true);
    }
  }, [user, hasAttemptedFetch]);

  // Фильтруем соревнования, в которых участвует пользователь
  const userCompetitions = competitions.filter(competition => {
    // Если это резервные данные и у нас нет реальных данных, показываем их
    const isFallback = fallbackCompetitions.some(fc => fc.id === competition.id);
    if (isFallback && competitions.length <= fallbackCompetitions.length) {
      return true;
    }
    
    // Проверяем, есть ли одобренные заявки на это соревнование
    const hasApprovedApplication = userApplications.some(
      app => (app.competitionId === competition.id || app.CompetitionId === competition.id) && 
             (app.status === 'approved' || app.status === 'accepted')
    );

    // Проверяем, участвует ли команда пользователя в соревновании
    const isTeamParticipating = userTeams.some(team =>
      team.CompetitionId === competition.id ||
      team.competitions?.some(comp => comp.id === competition.id)
    );

    return hasApprovedApplication || isTeamParticipating;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error && userCompetitions.length === 0) {
    return (
      <div className="text-center py-10 text-neutral-500">
        <p className="text-red-500 mb-4">{error}</p>
        <Button
          className="px-6 shadow-sm hover:shadow transition-all"
          onClick={() => {
            setHasAttemptedFetch(false);
            setError(null);
          }}
        >
          Попробовать снова
        </Button>
      </div>
    );
  }

  if (userCompetitions.length === 0) {
    return (
      <div className="text-center py-10 text-neutral-500">
        <div className="bg-neutral-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-12 w-12 text-neutral-300" />
        </div>
        <p className="text-lg font-medium mb-2 text-neutral-700">Вы не зарегистрированы на соревнования</p>
        <p className="text-sm max-w-md mx-auto mb-6">
          Найдите интересное соревнование и примите участие, чтобы проявить свои навыки!
        </p>
        <Button
          className="px-6 shadow-sm hover:shadow transition-all"
          onClick={() => navigate('/competitions')}
        >
          Найти соревнования
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Соревнования пользователя */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-primary-600" />
          Мои соревнования
        </h3>
        {userCompetitions.length > 0 ? (
          userCompetitions.map((competition) => (
            <Card 
              key={competition.id} 
              className="p-4 hover:bg-neutral-50 transition-colors cursor-pointer"
              onClick={() => navigate(getCompetitionUrl(competition.id))}
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-neutral-800">
                    {competition.title || competition.name || competition.id}
                  </h3>
                  {competition.status && (
                    <Badge 
                      className={
                        competition.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 
                        competition.status.toLowerCase() === 'completed' ? 'bg-blue-100 text-blue-800' : 
                        competition.status.toLowerCase() === 'canceled' ? 'bg-red-100 text-red-800' : 
                        'bg-amber-100 text-amber-800'
                      }
                    >
                      {competition.status}
                    </Badge>
                  )}
                </div>
                
                {(competition.description || competition.discription) && (
                  <p className="text-sm text-neutral-600">
                    {competition.description || competition.discription}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="text-sm text-neutral-500">
                    <span className="font-medium">Начало:</span>{' '}
                    {formatDate(competition.startDate || competition.start_date || competition.startdate || competition.startdate_cometition)}
                  </div>
                  <div className="text-sm text-neutral-500">
                    <span className="font-medium">Конец:</span>{' '}
                    {formatDate(competition.endDate || competition.end_date || competition.enddate || competition.enddate_cometition)}
                  </div>
                  <div className="text-sm text-neutral-500">
                    <span className="font-medium">Место:</span>{' '}
                    {competition.location || 'Не указано'}
                  </div>
                  <div className="text-sm text-neutral-500">
                    <span className="font-medium">Формат:</span>{' '}
                    {competition.format || 'Не указан'}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-6 bg-neutral-50 rounded-lg">
            <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">У вас пока нет активных соревнований</p>
            <p className="text-sm text-neutral-500 mt-1 mb-4">
              Подайте заявку на участие в соревновании или дождитесь одобрения существующих заявок
            </p>
            <Button
              className="px-6 shadow-sm hover:shadow transition-all"
              onClick={() => navigate('/competitions')}
            >
              Найти соревнования
            </Button>
          </div>
        )}
      </div>

      {/* Отображение информации о командах и заявках */}
      {teamApplications.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary-600" />
            Мои заявки на участие в командах
          </h3>
          <div className="space-y-4">
            {teamApplications.map((app) => (
              <Card key={app.id} className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-md font-semibold text-neutral-800">
                      {app.team?.name || 'Неизвестная команда'}
                    </h4>
                    <div className="flex items-center">
                      <Badge className={`${getStatusColor(app.status)} ml-2`}>
                        {app.status === 'approved' || app.status === 'accepted' ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : app.status === 'rejected' || app.status === 'declined' ? (
                          <XCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {getStatusText(app.status)}
                      </Badge>
                    </div>
                  </div>
                  {app.competition && (
                    <p className="text-sm text-neutral-600">
                      <span className="font-medium">Соревнование:</span>{' '}
                      {app.competition.title || app.competition.name || 'Неизвестное соревнование'}
                    </p>
                  )}
                  {app.createdAt && (
                    <p className="text-xs text-neutral-500">
                      Дата подачи заявки: {formatDate(app.createdAt)}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCompetitions; 