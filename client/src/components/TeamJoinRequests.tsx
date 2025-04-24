import React, { useEffect, useState } from 'react';
import { invitationAPI, teamsAPI, competitionAPI } from '../utils/api';
import Button from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import { Check, X, User, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface JoinRequest {
  id: string;
  TeamId: string;
  UserId: string;
  InvitedBy: string;
  status: 'pending' | 'accepted' | 'rejected';
  CompetitionId: string;
  createdAt: string;
  type: 'join_request';
  Team?: {
    id: string;
    name: string;
    discription?: string;
    availableSlots?: number;
  };
  Competition?: {
    id: string;
    name: string;
    format?: string;
    startdate?: string;
    enddate?: string;
  };
  User?: {
    id: string;
    email: string;
    user_info?: {
      firstName?: string;
      lastName?: string;
      middleName?: string;
      phone?: string;
    };
  };
}

interface Team {
  id: string;
  name: string;
  discription?: string;
  CompetitionId: string;
  availableSlots?: number;
  requiredRoles?: string;
  teammembers?: any[];
}

interface TeamJoinRequestsProps {
  teamId?: string; // Если не указан, загружаем запросы для всех команд, где пользователь капитан
}

// Функция для получения отображаемого имени пользователя
const getUserDisplayName = (user: any) => {
  if (!user) {
    return 'Неизвестный пользователь';
  }
  
  if (user.user_info && (user.user_info.lastName || user.user_info.firstName)) {
    return `${user.user_info.lastName || ''} ${user.user_info.firstName || ''} ${user.user_info.middleName || ''}`.trim();
  }
  
  return user.email || `Пользователь #${user.id}`;
};

const TeamJoinRequests: React.FC<TeamJoinRequestsProps> = ({ teamId }) => {
  const { user } = useAuthStore();
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [captainTeams, setCaptainTeams] = useState<Team[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  
  // Загрузка всех команд для получения полной информации о командах
  const loadAllTeams = async () => {
    try {
      console.log('Загрузка всех команд...');
      const response = await teamsAPI.getAll();
      const teams = Array.isArray(response) ? response : (response.data || []);
      console.log(`Загружено ${teams.length} команд`);
      setAllTeams(teams);
      return teams;
    } catch (err) {
      console.error('Ошибка при загрузке всех команд:', err);
      return [];
    }
  };
  
  // Загрузка команд, где пользователь является капитаном
  const loadCaptainTeams = async () => {
    if (!user) {
      console.log('Пользователь не авторизован, не могу загрузить команды');
      return [];
    }
    
    try {
      console.log('Загрузка всех команд для поиска команд капитана...');
      console.log('User ID:', user.id);
      
      let teams = allTeams;
      if (teams.length === 0) {
        const response = await teamsAPI.getAll();
        teams = Array.isArray(response) ? response : (response.data || []);
        setAllTeams(teams);
      }
      
      console.log(`Загружено команд: ${teams.length}`);
      
      if (teams.length === 0) {
        console.log('Не найдено ни одной команды');
        return [];
      }
      
      // Проверка структуры данных команд
      if (teams.length > 0) {
        const sampleTeam = teams[0];
        console.log('Пример данных команды:', {
          id: sampleTeam.id,
          name: sampleTeam.name,
          hasTeammembers: !!sampleTeam.teammembers,
          teammembersCount: sampleTeam.teammembers?.length || 0
        });
        
        if (sampleTeam.teammembers && sampleTeam.teammembers.length > 0) {
          const sampleMember = sampleTeam.teammembers[0];
          console.log('Пример данных участника команды:', {
            UserId: sampleMember.UserId,
            is_capitan: sampleMember.is_capitan
          });
        }
      }
      
      // Фильтруем только команды, где пользователь является капитаном
      const captainTeams = teams.filter((team: any) => {
        if (!team.teammembers) {
          console.log(`Команда ${team.id} не имеет членов`);
          return false;
        }
        
        const isCaptain = team.teammembers.some((member: any) => {
          const isUserMember = member.UserId === user.id;
          const isCaptainRole = member.is_capitan === true;
          
          if (isUserMember) {
            console.log(`Пользователь ID=${user.id} является членом команды ${team.id}, капитан: ${isCaptainRole}`);
          }
          
          return isUserMember && isCaptainRole;
        });
        
        if (isCaptain) {
          console.log(`Пользователь является капитаном команды ${team.id} - ${team.name}`);
        }
        
        return isCaptain;
      });
      
      console.log(`Найдено ${captainTeams.length} команд, где пользователь ID=${user.id} является капитаном:`, 
        captainTeams.map((t: any) => ({ id: t.id, name: t.name })));
      setCaptainTeams(captainTeams);
      
      return captainTeams;
    } catch (err) {
      console.error('Ошибка при загрузке команд:', err);
      return [];
    }
  };

  // Загрузка соревнований для получения имен
  const loadCompetitions = async () => {
    try {
      console.log('Загрузка списка соревнований...');
      const response = await competitionAPI.getAll();
      console.log('Получены соревнования:', response);
      const comps = Array.isArray(response) ? response : [];
      setCompetitions(comps);
      return comps;
    } catch (err) {
      console.error('Ошибка при загрузке соревнований:', err);
      return [];
    }
  };

  // Дополняем данные запросов информацией о командах и соревнованиях
  const enrichJoinRequests = (requests: JoinRequest[], teams: Team[], comps: any[], allTeams: any[]) => {
    console.log('Обогащаем данные запросов полной информацией...');
    
    return requests.map(request => {
      let updatedRequest = { ...request };
      
      // Если у запроса нет данных о команде или имя команды "Неизвестная команда", пытаемся найти их
      if (!request.Team || !request.Team.name) {
        // Сначала ищем среди команд капитана
        let team = teams.find(t => t.id.toString() === request.TeamId.toString());
        
        // Если не найдено, ищем среди всех команд
        if (!team) {
          team = allTeams.find(t => t.id.toString() === request.TeamId.toString());
        }
        
        if (team) {
          console.log(`Нашли данные о команде ${team.id} - ${team.name}`);
          updatedRequest.Team = {
            id: team.id,
            name: team.name,
            discription: team.discription,
            availableSlots: team.availableSlots
          };
        } else {
          console.log(`Не удалось найти данные о команде с ID ${request.TeamId}`);
        }
      }
      
      // Если у запроса нет данных о соревновании, пытаемся найти их
      if (!request.Competition || !request.Competition.name) {
        const competition = comps.find(c => c.id.toString() === request.CompetitionId.toString());
        if (competition) {
          console.log(`Нашли данные о соревновании ${competition.id} - ${competition.name}`);
          updatedRequest.Competition = {
            id: competition.id,
            name: competition.name,
            format: competition.format,
            startdate: competition.startdate,
            enddate: competition.enddate
          };
        } else {
          console.log(`Не удалось найти данные о соревновании с ID ${request.CompetitionId}`);
        }
      }
      
      return updatedRequest;
    });
  };

  // Загрузка запросов на присоединение
  const loadJoinRequests = async () => {
    try {
      setLoading(true);
      
      // Предварительно загружаем все команды и соревнования для лучшего отображения
      const allTeamsList = await loadAllTeams();
      const allCompetitions = await loadCompetitions();
      const captTeams = await loadCaptainTeams();
      
      let allRequests: JoinRequest[] = [];
      
      // Если указан teamId, загружаем запросы только для этой команды
      if (teamId) {
        console.log(`Загрузка запросов для конкретной команды ID=${teamId}`);
        try {
          console.log(`Запрос к API: /invitations/join-requests/${teamId}`);
          const response = await invitationAPI.getTeamJoinRequests(teamId);
          console.log(`Получен ответ от сервера для конкретной команды ${teamId}:`, response);
          
          // Проверка формата ответа
          const requests = Array.isArray(response) ? response : [];
          console.log(`Получено ${requests.length} запросов для команды ${teamId}`);
          allRequests = requests;
        } catch (err) {
          console.error(`Ошибка при загрузке запросов для команды ${teamId}:`, err);
        }
      } 
      // Иначе загружаем все запросы для команд пользователя
      else {
        console.log(`Загрузка запросов для всех команд пользователя-капитана`);
        try {
          console.log(`Запрос к API: /invitations/my-teams-join-requests`);
          const response = await invitationAPI.getMyTeamsJoinRequests();
          console.log(`Получен ответ от сервера по запросам на присоединение:`, response);
          
          // Проверка формата ответа
          const requests = Array.isArray(response) ? response : [];
          console.log(`Получено ${requests.length} запросов для команд пользователя`);
          allRequests = requests;
          
          // Подробно логируем команды в запросах
          if (requests.length > 0) {
            requests.forEach((req, index) => {
              console.log(`Запрос #${index + 1} - TeamId: ${req.TeamId}`);
              console.log(`Объект Team в запросе:`, req.Team);
              
              // Ищем команду в allTeamsList
              const teamInAll = allTeamsList.find((t: any) => t.id.toString() === req.TeamId.toString());
              console.log(`Команда в allTeamsList:`, teamInAll ? {id: teamInAll.id, name: teamInAll.name} : 'не найдена');
              
              // Ищем команду в captTeams
              const teamInCapt = captTeams.find((t: any) => t.id.toString() === req.TeamId.toString());
              console.log(`Команда в captTeams:`, teamInCapt ? {id: teamInCapt.id, name: teamInCapt.name} : 'не найдена');
            });
          }
        } catch (err) {
          console.error(`Ошибка при загрузке запросов для команд пользователя:`, err);
        }
      }
      
      console.log(`Всего получено ${allRequests.length} запросов на присоединение`);
      if (allRequests.length > 0) {
        console.log('Пример первого запроса:', allRequests[0]);
      }
      
      // Дополняем запросы информацией о командах и соревнованиях
      if (allRequests.length > 0) {
        // Загрузим данные о командах напрямую по ID
        const teamIds = [...new Set(allRequests.map(req => req.TeamId))];
        console.log(`Уникальные ID команд в запросах: ${teamIds.join(', ')}`);
        
        for (const id of teamIds) {
          try {
            console.log(`Загружаем информацию о команде ID=${id} напрямую`);
            const teamInfo = await teamsAPI.getOne(id);
            console.log(`Получена информация о команде ID=${id}:`, teamInfo);
            
            // Добавляем или обновляем информацию о команде в allTeamsList
            const teamIndex = allTeamsList.findIndex((t: any) => t.id.toString() === id.toString());
            if (teamIndex >= 0) {
              allTeamsList[teamIndex] = teamInfo;
            } else {
              allTeamsList.push(teamInfo);
            }
          } catch (err) {
            console.error(`Ошибка при загрузке информации о команде ID=${id}:`, err);
          }
        }
        
        const enrichedRequests = enrichJoinRequests(allRequests, captTeams, allCompetitions, allTeamsList);
        allRequests = enrichedRequests;
      }
      
      setJoinRequests(allRequests);
      setError(null);
    } catch (err: any) {
      console.error('Ошибка при загрузке запросов на присоединение:', err);
      setError(err.message || 'Не удалось загрузить запросы на присоединение');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      console.log('Начало загрузки данных в TeamJoinRequests');
      await loadJoinRequests();
      console.log('Завершение загрузки данных в TeamJoinRequests');
    };

    if (user) {
      fetchData();
    } else {
      console.log('Пользователь не авторизован, не загружаем данные');
      setLoading(false);
    }
  }, [teamId, user]);

  // Обработчик ответа на запрос
  const handleRequestResponse = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      setLoading(true);
      console.log(`Отправка ответа на запрос ID=${id}, статус=${status}`);
      console.log(`Запрос к API: /invitations/join-request/${id}/respond`);
      const response = await invitationAPI.respondToJoinRequest(id, status);
      console.log('Ответ от сервера при ответе на запрос:', response);
      
      // Обновляем список запросов
      setJoinRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === id ? { ...req, status } : req
        )
      );
      
      // Если запрос принят, обновляем команды (количество свободных мест)
      if (status === 'accepted' && response.availableSlots !== undefined) {
        setCaptainTeams(prevTeams => 
          prevTeams.map(team => 
            team.id === joinRequests.find(req => req.id === id)?.TeamId 
              ? { ...team, availableSlots: response.availableSlots } 
              : team
          )
        );
      }
      
      alert(status === 'accepted' ? 'Заявка принята. Пользователь добавлен в команду.' : 'Заявка отклонена.');
    } catch (err: any) {
      console.error('Ошибка при ответе на запрос:', err);
      alert(err.response?.data?.message || 'Произошла ошибка при обработке запроса');
    } finally {
      setLoading(false);
    }
  };

  // Обновление списка запросов
  const handleRefresh = async () => {
    console.log('Обновление списка запросов...');
    await loadJoinRequests();
  };

  // Функция форматирования даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading && joinRequests.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={handleRefresh}>Попробовать снова</Button>
      </div>
    );
  }

  // Фильтруем только ожидающие ответа запросы
  const pendingRequests = joinRequests.filter(req => req.status === 'pending');
  console.log(`Фильтрация запросов: всего ${joinRequests.length}, ожидающих ${pendingRequests.length}`);

  if (pendingRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-500">Нет запросов на присоединение к вашим командам</p>
        <Button 
          variant="outline" 
          className="mt-4"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={handleRefresh}
        >
          Обновить
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Заявки на присоединение к командам</h3>
        <Button 
          variant="outline" 
          size="sm"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Обновить
        </Button>
      </div>
      
      {pendingRequests.map(request => {
        // Более тщательный поиск информации о команде
        let teamInfo: any = null;
        
        // 1. Сначала пытаемся использовать данные, которые уже есть в запросе
        if (request.Team && request.Team.name) {
          teamInfo = request.Team;
        } 
        // 2. Затем ищем в списке команд капитана
        else {
          const teamInCaptain = captainTeams.find((t: any) => t.id.toString() === request.TeamId.toString());
          if (teamInCaptain) {
            teamInfo = teamInCaptain;
          } 
          // 3. Затем ищем в списке всех команд
          else {
            const teamInAll = allTeams.find((t: any) => t.id.toString() === request.TeamId.toString());
            if (teamInAll) {
              teamInfo = teamInAll;
            }
          }
        }
        
        // Получаем информацию о соревновании
        const competition = competitions.find(c => c.id.toString() === request.CompetitionId.toString()) || request.Competition;
        // Получаем отображаемое имя пользователя
        const userName = getUserDisplayName(request.User);
        
        return (
          <Card key={request.id} className="overflow-hidden border-none shadow-md">
            <CardHeader className="bg-blue-50 pb-3">
              <CardTitle className="text-lg font-medium text-blue-700 flex items-center">
                <User className="h-5 w-5 inline-block mr-2 flex-shrink-0" />
                <span className="truncate">
                  Заявка от <strong>{userName}</strong> в команду <strong>{teamInfo?.name || 'Неизвестная команда'}</strong>
                </span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex flex-col">
                  <p className="text-neutral-700 font-medium">
                    {userName}
                  </p>
                  {request.User?.email && (
                    <p className="text-neutral-500 text-sm">
                      {request.User.email}
                    </p>
                  )}
                </div>
                
                {request.User?.user_info?.phone && (
                  <p className="text-neutral-600 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {request.User.user_info.phone}
                  </p>
                )}
                
                <p className="text-neutral-600 text-sm flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="font-medium">Команда:</span> {teamInfo?.name || 'Неизвестная команда'}
                </p>
                
                <p className="text-neutral-600 text-sm flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Соревнование:</span> {competition?.name || 'Неизвестное соревнование'}
                </p>
                
                {teamInfo?.availableSlots !== undefined && (
                  <p className="text-neutral-600 text-sm flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-medium">Свободных мест:</span> {teamInfo.availableSlots}
                  </p>
                )}
                
                <p className="text-neutral-600 text-sm flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Получено:</span> {formatDate(request.createdAt)}
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="bg-neutral-50 pt-3 flex justify-between">
              <Button
                variant="primary"
                leftIcon={<Check className="h-4 w-4" />}
                onClick={() => handleRequestResponse(request.id, 'accepted')}
                className="w-full mr-2 bg-green-500 hover:bg-green-600"
                disabled={loading || (teamInfo?.availableSlots !== undefined && teamInfo.availableSlots <= 0)}
              >
                Принять
              </Button>
              
              <Button
                variant="primary"
                leftIcon={<X className="h-4 w-4" />}
                onClick={() => handleRequestResponse(request.id, 'rejected')}
                className="w-full ml-2 bg-red-500 hover:bg-red-600"
                disabled={loading}
              >
                Отклонить
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default TeamJoinRequests; 