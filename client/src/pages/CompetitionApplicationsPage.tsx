import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore.ts';
import api, { applicationAPI } from '../utils/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Badge from '../components/ui/Badge.tsx';
import { CheckCircle, XCircle, RefreshCw, User, Calendar, AlertCircle } from 'lucide-react';

interface ApplicationItem {
  id: string;
  UserId: string;
  TeamId: string;
  CompetitionId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  UUID?: string;
  User?: {
    id: string;
    email: string;
    role?: string;
    user_info?: {
      firstName?: string;
      lastName?: string;
      middleName?: string;
      phone?: string;
    }
  };
  Team?: {
    id: string;
    name: string;
    discription?: string;
    points?: number;
    result?: number;
    competitionId?: string;
    members?: Array<{
      userId: string;
      firstName: string;
      lastName: string;
      isCapitan?: boolean;
    }>;
  };
  Competition?: {
    id: string;
    name: string;
    title?: string;
    discription?: string;
    discipline?: string;
    format?: string;
    startdate?: string;
    enddate?: string;
    maxParticipants?: number;
    status?: string;
    regionId?: string;
    AddressId?: string;
  };
}

const CompetitionApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const { user } = useAuthStore();

  // Добавим функцию для прямого запроса всех заявок (для отладки)
  const fetchAllApplicationsDirectly = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Загрузка всех заявок напрямую (режим отладки)');
      // Прямой запрос к API без использования хелпера
      const response = await api.get('/applications');
      console.log('Получен прямой ответ:', response.data);
      
      // Устанавливаем полученные заявки в состояние
      setApplications(response.data);
    } catch (error: any) {
      console.error('Ошибка при прямой загрузке заявок:', error);
      
      if (error.response) {
        console.error('Статус ошибки:', error.response.status);
        console.error('Данные ошибки:', error.response.data);
        setError(`Ошибка ${error.response.status}: ${error.response.data?.message || 'Не удалось загрузить заявки'}`);
      } else {
        setError('Не удалось загрузить заявки. Пожалуйста, попробуйте позже.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Проверяем наличие токена перед запросом
      const token = localStorage.getItem('token');
      console.log('Токен аутентификации:', token ? 'Присутствует' : 'Отсутствует');
      
      if (!token) {
        setError('Требуется авторизация. Пожалуйста, войдите в систему.');
        setIsLoading(false);
        return;
      }
      
      console.log('Загрузка заявок для пользователя:', user?.id, 'с ролью:', user?.role);
      console.log('Отправка запроса к API...');
      
      // Используем applicationAPI вместо прямого вызова api
      const applications = await applicationAPI.getAll();
      console.log('Получены заявки:', applications);
      
      // Выводим подробную информацию о каждой заявке для отладки
      applications.forEach((app: ApplicationItem, index: number) => {
        console.log(`Заявка ${index + 1}:`, {
          id: app.id,
          status: app.status,
          userId: app.UserId,
          teamId: app.TeamId,
          competitionId: app.CompetitionId,
        });
        
        // Более подробная отладка информации о команде
        if (app.Team) {
          console.log(`  Команда:`, {
            id: app.Team.id,
            name: app.Team.name,
            description: app.Team.discription,
            competitionId: app.Team.competitionId,
            members: app.Team.members
          });
        } else {
          console.log(`  Команда: данные отсутствуют (TeamId=${app.TeamId})`);
        }
        
        // Более подробная отладка информации о соревновании
        if (app.Competition) {
          console.log(`  Соревнование:`, {
            id: app.Competition.id,
            name: app.Competition.name,
            title: app.Competition.title,
            discipline: app.Competition.discipline,
            format: app.Competition.format
          });
        } else {
          console.log(`  Соревнование: данные отсутствуют (CompetitionId=${app.CompetitionId})`);
        }
        
        // Более подробная отладка информации о пользователе
        if (app.User) {
          console.log(`  Пользователь:`, {
            id: app.User.id,
            email: app.User.email,
            role: app.User.role,
            firstName: app.User.user_info?.firstName,
            lastName: app.User.user_info?.lastName
          });
        } else {
          console.log(`  Пользователь: данные отсутствуют (UserId=${app.UserId})`);
        }
      });
      
      // Устанавливаем полученные заявки в состояние
      setApplications(applications);
    } catch (error: any) {
      console.error('Ошибка при загрузке заявок:', error);
      
      // Более детальное логирование ошибки
      if (error.response) {
        console.error('Статус ошибки:', error.response.status);
        console.error('Данные ошибки:', error.response.data);
        setError(`Ошибка ${error.response.status}: ${error.response.data?.message || 'Не удалось загрузить заявки'}`);
      } else if (error.request) {
        console.error('Нет ответа от сервера:', error.request);
        setError('Сервер не отвечает. Проверьте соединение.');
      } else {
        console.error('Сообщение об ошибке:', error.message);
        setError('Не удалось загрузить заявки. Пожалуйста, попробуйте позже.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для обновления статуса заявки
  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      // Используем applicationAPI вместо прямого вызова api
      await applicationAPI.updateStatus(id, status);
      
      // Обновляем локальный список заявок
      setApplications(prevApplications => 
        prevApplications.map(app => 
          app.id === id ? { ...app, status } : app
        )
      );
      
      // Показываем сообщение об успешном обновлении
      alert(`Заявка ${status === 'approved' ? 'подтверждена' : 'отклонена'}`);
    } catch (error: any) {
      console.error('Ошибка при обновлении статуса заявки:', error);
      
      // Более детальное логирование ошибки
      if (error.response) {
        console.error('Статус ошибки:', error.response.status);
        console.error('Данные ошибки:', error.response.data);
        alert(`Ошибка ${error.response.status}: ${error.response.data?.message || 'Не удалось обновить статус'}`);
      } else {
        alert('Не удалось обновить статус заявки');
      }
    }
  };

  // Загружаем заявки при монтировании компонента
  useEffect(() => {
    fetchApplications();
  }, []);

  // Функция форматирования даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Получение значка статуса
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">На модерации</Badge>;
      case 'approved':
        return <Badge className="bg-green-500">Подтверждена</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Отклонена</Badge>;
      default:
        return <Badge className="bg-gray-500">Неизвестно</Badge>;
    }
  };

  // Функция получения названия соревнования
  const getCompetitionName = (competition?: any) => {
    if (!competition) return 'Соревнование не указано';
    
    // Проверяем различные поля, которые могут содержать название
    if (competition.title) return competition.title;
    if (competition.name) return competition.name;
    
    return 'Соревнование без названия';
  };

  // Функция получения дат соревнования в читаемом формате
  const getCompetitionDates = (competition?: any) => {
    if (!competition) return '';
    
    let result = '';
    
    // Добавляем даты проведения, если они есть
    if (competition.startdate_cometition && competition.enddate_cometition) {
      const startDate = formatDate(competition.startdate_cometition);
      const endDate = formatDate(competition.enddate_cometition);
      result = `${startDate} - ${endDate}`;
    } 
    // Иначе используем обычные даты старта и окончания
    else if (competition.startdate && competition.enddate) {
      const startDate = formatDate(competition.startdate);
      const endDate = formatDate(competition.enddate);
      result = `${startDate} - ${endDate}`;
    }
    
    return result;
  };

  // Функция получения названия команды
  const getTeamName = (team?: any, teamId?: string) => {
    if (team && team.name) {
      return team.name || 'Без названия';
    }
    
    if (teamId) {
      return `Команда ID:${teamId}`;
    }
    
    return 'Команда не указана';
  };

  // Функция получения имени пользователя
  const getUserName = (user?: any) => {
    if (!user) return 'Пользователь не указан';
    
    // Проверяем наличие user_info и данных в нем
    if (user.user_info && (user.user_info.firstName || user.user_info.lastName)) {
      // Формируем ФИО из имеющихся данных
      let name = '';
      
      if (user.user_info.lastName) {
        name += user.user_info.lastName;
      }
      
      if (user.user_info.firstName) {
        name += name ? ' ' + user.user_info.firstName : user.user_info.firstName;
      }
      
      if (user.user_info.middleName) {
        name += name ? ' ' + user.user_info.middleName : user.user_info.middleName;
      }
      
      return name;
    }
    
    // Если нет имени/фамилии, возвращаем email
    return user.email || 'Без имени';
  };

  // Функция для определения, является ли член команды капитаном
  const isCaptain = (member: any): boolean => {
    // Проверяем разные варианты написания поля капитана
    return Boolean(member.isCapitan || member.is_capitan);
  };

  // Функция для получения имени члена команды
  const getMemberName = (member: any): string => {
    // Проверяем наличие имени/фамилии
    if (member.firstName || member.lastName) {
      return `${member.lastName || ''} ${member.firstName || ''}`.trim();
    }
    
    // Проверяем наличие email или userId
    if (typeof member.email === 'string') {
      return member.email;
    }
    
    // Возвращаем ID пользователя
    return `ID: ${member.userId || 'не указан'}`;
  };

  const renderTeamDetails = (team?: any) => {
    if (!team) return 'Команда не найдена';
    
    let result = `Название: ${team.name || 'Не указано'}\n`;
    result += `ID: ${team.id}\n`;
    
    if (team.discription) {
      result += `Описание: ${team.discription}\n`;
    }
    
    if (team.members && team.members.length > 0) {
      result += '\nУчастники команды:\n';
      team.members.forEach((member: any, idx: number) => {
        result += `- ${isCaptain(member) ? '👑 ' : ''}${getMemberName(member)}\n`;
      });
    }
    
    return result;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-5xl px-4 py-8 pt-24">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Заявки команд на соревнования</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={fetchApplications}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" />
                Обновить
              </Button>
              
              {/* Кнопка для отладки - загрузка всех заявок */}
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800"
                onClick={fetchAllApplicationsDirectly}
                disabled={isLoading}
              >
                <AlertCircle className="h-4 w-4" />
                Загрузить все заявки (отладка)
              </Button>
              
              {/* Кнопка для отображения отладочной информации */}
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
              >
                {showDebugInfo ? 'Скрыть отладку' : 'Показать отладку'}
              </Button>
            </div>
          </div>

          {/* Отладочная информация */}
          {showDebugInfo && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
              <h3 className="font-bold mb-2 text-gray-700">Отладочная информация:</h3>
              <p><strong>Пользователь ID:</strong> {user?.id}</p>
              <p><strong>Роль:</strong> {user?.role}</p>
              <p><strong>Токен:</strong> {localStorage.getItem('token') ? 'Присутствует' : 'Отсутствует'}</p>
              <p><strong>Загружено заявок:</strong> {applications.length}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <div className="bg-neutral-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-12 w-12 text-neutral-300" />
              </div>
              <p className="text-lg font-medium mb-2 text-neutral-700">Заявок пока нет</p>
              <p className="text-sm max-w-md mx-auto">Здесь будут отображаться заявки команд на соревнования</p>
            </div>
          ) : (
            <div className="space-y-6">
              {applications.map((application) => (
                <Card key={application.id} className="overflow-hidden !bg-white border border-neutral-200">
                  <CardHeader className="bg-neutral-50 py-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {getCompetitionName(application.Competition)}
                        </CardTitle>
                        {application.Competition && getCompetitionDates(application.Competition) && (
                          <p className="text-sm text-neutral-500 mt-1">
                            {getCompetitionDates(application.Competition)}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(application.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Информация о команде */}
                      <div>
                        <h3 className="text-md font-semibold mb-3">Информация о команде</h3>
                        <div className="space-y-2">
                          <p className="text-sm text-neutral-600">
                            <span className="font-medium">Название команды:</span> {getTeamName(application.Team, application.TeamId)}
                          </p>
                          <p className="text-sm text-neutral-600">
                            <span className="font-medium">ID Команды:</span> {application.TeamId || 'Не указано'}
                          </p>
                          {application.Team?.discription && (
                            <p className="text-sm text-neutral-600">
                              <span className="font-medium">Описание команды:</span> {application.Team.discription}
                            </p>
                          )}
                          {application.Team?.members && application.Team.members.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-neutral-600">Участники команды:</p>
                              <ul className="text-sm text-neutral-600 list-disc pl-5 mt-1">
                                {application.Team.members.map((member, index) => (
                                  <li key={index}>
                                    {isCaptain(member) && '👑 '}
                                    {getMemberName(member)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Информация о соревновании и капитане */}
                      <div>
                        <h3 className="text-md font-semibold mb-3">Информация о соревновании</h3>
                        <div className="space-y-2">
                          <p className="text-sm text-neutral-600">
                            <span className="font-medium">Название:</span> {getCompetitionName(application.Competition)}
                          </p>
                          <p className="text-sm text-neutral-600">
                            <span className="font-medium">ID соревнования:</span> {application.CompetitionId || 'Не указано'}
                          </p>
                          {application.Competition?.discription && (
                            <p className="text-sm text-neutral-600">
                              <span className="font-medium">Описание:</span> {application.Competition.discription}
                            </p>
                          )}
                          {application.Competition?.format && (
                            <p className="text-sm text-neutral-600">
                              <span className="font-medium">Формат:</span> {application.Competition.format}
                            </p>
                          )}
                          {application.Competition?.discipline && (
                            <p className="text-sm text-neutral-600">
                              <span className="font-medium">Дисциплина:</span> {application.Competition.discipline}
                            </p>
                          )}
                          {getCompetitionDates(application.Competition) && (
                            <p className="text-sm text-neutral-600">
                              <span className="font-medium">Период проведения:</span> {getCompetitionDates(application.Competition)}
                            </p>
                          )}
                          
                          {/* Информация о капитане */}
                          <h3 className="text-md font-semibold mt-6 mb-3">Информация о капитане</h3>
                          <div className="space-y-2">
                            <p className="text-sm text-neutral-600">
                              <span className="font-medium">ФИО:</span> {getUserName(application.User)}
                            </p>
                            <p className="text-sm text-neutral-600">
                              <span className="font-medium">ID капитана:</span> {application.UserId || 'Не указано'}
                            </p>
                            <p className="text-sm text-neutral-600">
                              <span className="font-medium">Email:</span> {application.User?.email || 'Не указано'}
                            </p>
                            {application.User?.user_info?.phone && (
                              <p className="text-sm text-neutral-600">
                                <span className="font-medium">Телефон:</span> {application.User.user_info.phone}
                              </p>
                            )}
                            <p className="text-sm text-neutral-600">
                              <span className="font-medium">Дата подачи заявки:</span> {formatDate(application.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {/* Действия */}
                  <CardContent className="bg-gray-50 p-4 border-t border-neutral-200">
                    <div className="flex flex-wrap gap-2 justify-end">
                      {application.status === 'pending' && (
                        <>
                          <Button 
                            className="bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2"
                            onClick={() => handleUpdateStatus(application.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Подтвердить
                          </Button>
                          
                          <Button 
                            className="bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2"
                            onClick={() => handleUpdateStatus(application.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4" />
                            Отклонить
                          </Button>
                        </>
                      )}
                      
                      <Button 
                        variant="outline"
                        className="flex items-center justify-center gap-2"
                        onClick={() => {
                          console.log('Детали заявки:', application);
                          
                          const teamDetails = application.Team 
                            ? renderTeamDetails(application.Team)
                            : `ID команды: ${application.TeamId || 'Не указан'}`;
                            
                          const competitionDetails = application.Competition
                            ? `Название: ${application.Competition.name || application.Competition.title || 'Не указано'}
ID: ${application.Competition.id}
${application.Competition.discription ? `Описание: ${application.Competition.discription}` : ''}
${application.Competition.format ? `Формат: ${application.Competition.format}` : ''}
${application.Competition.discipline ? `Дисциплина: ${application.Competition.discipline}` : ''}`
                            : 'Соревнование не указано';
                            
                          const details = `
Заявка №${application.id}
Статус: ${application.status}

Информация о команде:
${teamDetails}

Информация о соревновании:
${competitionDetails}

Информация о капитане:
ID: ${application.UserId}
Имя: ${getUserName(application.User)}
Email: ${application.User?.email || 'Не указано'}

Дата создания: ${formatDate(application.createdAt)}
                          `;
                          alert(details);
                        }}
                      >
                        Подробнее
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitionApplicationsPage; 