import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore.ts';
import api, { applicationAPI, invitationAPI } from '../utils/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Badge from '../components/ui/Badge.tsx';
import { CheckCircle, XCircle, RefreshCw, User, Calendar, AlertCircle, UserPlus } from 'lucide-react';

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

// Интерфейс для приглашений участников команды
interface InvitationItem {
  id: string;
  TeamId: string;
  UserId: string;
  InvitedBy: string;
  status: 'pending' | 'accepted' | 'rejected';
  CompetitionId: string;
  createdAt: string;
  User?: {
    id: string;
    email: string;
    user_info?: {
      firstName?: string;
      lastName?: string;
      middleName?: string;
      phone?: string;
    }
  };
  Inviter?: {
    id: string;
    email: string;
    user_info?: {
      firstName?: string;
      lastName?: string;
      middleName?: string;
      phone?: string;
    }
  };
}

interface TeamMember {
  id?: string;
  userId?: string;
  UserId?: string;
  isCapitan?: boolean;
  is_capitan?: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  User?: {
    id: string;
    email: string;
    user_info?: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    }
  };
}

const CompetitionApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  // Состояние для хранения приглашений команд
  const [teamInvitations, setTeamInvitations] = useState<Record<string, InvitationItem[] | null>>({});
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

  // Функция для отображения информации о приглашениях
  const renderInvitations = (teamId: string) => {
    // Проверяем, загружены ли данные для этой команды
    if (teamInvitations[teamId] === undefined) {
      return (
        <p className="text-sm text-neutral-500 italic">Загрузка приглашений...</p>
      );
    }

    const invitations = teamInvitations[teamId];

    // Проверяем, есть ли у нас права на просмотр
    if (invitations === null) {
      return (
        <p className="text-sm text-neutral-500 italic">Нет прав для просмотра приглашений</p>
      );
    }

    // Если нет приглашений
    if (invitations.length === 0) {
      return (
        <p className="text-sm text-neutral-500 italic">Нет активных приглашений</p>
      );
    }

    return (
      <div>
        <ul className="text-sm text-neutral-600 list-disc pl-5">
          {invitations.map((invitation) => {
            // Получаем информацию о пользователе
            const user = invitation.User;
            const userInfo = user?.user_info;

            // Формируем ФИО
            const fullName = userInfo && (userInfo.lastName || userInfo.firstName || userInfo.middleName)
              ? `${userInfo.lastName || ''} ${userInfo.firstName || ''} ${userInfo.middleName || ''}`.trim()
              : '';

            // Получаем email и телефон
            const email = user?.email || '';
            const phone = userInfo?.phone || '';

            // Получаем статус для отображения
            const statusBadge = invitation.status === 'pending'
              ? <Badge className="bg-yellow-500 text-xs">Ожидает ответа</Badge>
              : invitation.status === 'accepted'
                ? <Badge className="bg-green-500 text-xs">Принято</Badge>
                : <Badge className="bg-red-500 text-xs">Отклонено</Badge>;

            return (
              <li key={invitation.id} className="mb-3 border-b pb-2 border-gray-100 last:border-0">
                {/* Если есть ФИО, email или телефон - выводим их, иначе только ID */}
                {(fullName || email || phone) ? (
                  <>
                    {fullName && (
                      <div>
                        <span className="font-medium">{fullName}</span>
                      </div>
                    )}

                    <div className="text-xs text-neutral-500 mt-0.5 flex flex-col">
                      {email && (
                        <span>Email: {email}</span>
                      )}
                      {phone && (
                        <span>Телефон: {phone}</span>
                      )}
                      <span>ID: {invitation.UserId}</span>
                    </div>
                  </>
                ) : (
                  <div>
                    <span className="font-medium">Пользователь ID: {invitation.UserId}</span>
                  </div>
                )}

                <div className="mt-1">
                  {statusBadge}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  // Загружаем заявки при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      await fetchApplications();

      // После загрузки заявок загружаем приглашения для всех команд
      const teamIds = applications
        .filter(app => app.TeamId)
        .map(app => app.TeamId);

      const uniqueTeamIds = [...new Set(teamIds)];
      console.log('Загрузка приглашений для команд:', uniqueTeamIds);

      // Загружаем приглашения для каждой команды
      for (const teamId of uniqueTeamIds) {
        await fetchTeamInvitations(teamId);
      }
    };

    loadData();
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

  // Функция получения информации о соревновании
  const getCompetitionInfo = (competition?: any) => {
    if (!competition) {
      return {
        name: 'Соревнование не указано',
        dates: '',
        description: '',
        format: '',
        discipline: ''
      };
    }

    // Определяем название (может быть в поле name или title)
    const name = competition.title || competition.name || 'Соревнование без названия';

    // Форматируем даты
    let dates = '';
    if (competition.startdate_cometition && competition.enddate_cometition) {
      dates = `${formatDate(competition.startdate_cometition)} - ${formatDate(competition.enddate_cometition)}`;
    } else if (competition.startdate && competition.enddate) {
      dates = `${formatDate(competition.startdate)} - ${formatDate(competition.enddate)}`;
    } else if (competition.startdate) {
      dates = formatDate(competition.startdate);
    }

    return {
      id: competition.id,
      name,
      dates,
      description: competition.discription || competition.description || '',
      format: competition.format || '',
      discipline: competition.discipline || ''
    };
  };

  // Получение команды и ее участников
  const getTeamInfo = (team?: any, teamId?: string) => {
    if (!team) {
      return {
        name: teamId ? `Команда ID:${teamId}` : 'Команда не указана',
        members: [] as TeamMember[]
      };
    }

    const members = team.Teammembers || team.members || [];
    const teamMembers = members.map((member: any): TeamMember => {
      // Если участник является объектом Teammember, берем данные из связанного User
      if (member.User) {
        return {
          id: member.User.id,
          isCapitan: member.is_capitan,
          firstName: member.User.user_info?.firstName || '',
          lastName: member.User.user_info?.lastName || '',
          email: member.User.email,
          phone: member.User.user_info?.phone || ''
        };
      }

      // Если участник уже преобразован в плоскую структуру
      return {
        id: member.userId || member.UserId,
        isCapitan: member.isCapitan || member.is_capitan,
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        email: member.email || '',
        phone: member.phone || ''
      };
    });

    return {
      name: team.name || 'Без названия',
      id: team.id,
      description: team.discription || team.description || '',
      members: teamMembers
    };
  };

  // Функция получения имени пользователя
  const getUserName = (user?: any) => {
    if (!user) return 'Пользователь не указан';

    // Проверяем наличие user_info и данных в нем
    if (user.user_info && (user.user_info.lastName || user.user_info.firstName)) {
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

      // Добавляем email в скобках, если он есть
      if (user.email) {
        name += ` (${user.email})`;
      }

      return name;
    }

    // Если нет имени/фамилии, возвращаем email
    return user.email || 'Без имени';
  };

  const renderTeamDetails = (team?: any) => {
    if (!team) return 'Команда не найдена';

    let result = `Название: ${team.name || 'Не указано'}\n`;
    result += `ID: ${team.id}\n`;

    if (team.discription || team.description) {
      result += `Описание: ${team.discription || team.description || ''}\n`;
    }

    if (team.members && team.members.length > 0) {
      result += '\nУчастники команды:\n';
      team.members.forEach((member: any, idx: number) => {
        // Формируем полное имя
        const fullName = member.lastName || member.firstName
          ? `${member.lastName || ''} ${member.firstName || ''}`.trim()
          : '';

        const memberId = member.id || member.userId || member.UserId || 'Не указан';
        const email = member.email || '';
        const phone = member.phone || '';

        // Если есть данные ФИО, email или телефон - выводим их
        if (fullName || email || phone) {
          result += `- ${(member.isCapitan || member.is_capitan) ? '👑 ' : ''}`;

          if (fullName) {
            result += `${fullName}\n`;
          } else {
            result += `Участник ID: ${memberId}\n`;
          }

          if (email) {
            result += `  Email: ${email}\n`;
          }

          if (phone) {
            result += `  Телефон: ${phone}\n`;
          }

          result += `  ID: ${memberId}\n`;
        } else {
          // Если нет данных, выводим только ID
          result += `- ${(member.isCapitan || member.is_capitan) ? '👑 ' : ''}Участник ID: ${memberId}\n`;
        }
      });
    }

    return result;
  };

  // Функция для загрузки приглашений команды
  const fetchTeamInvitations = async (teamId: string) => {
    try {
      console.log(`Загрузка приглашений для команды ID: ${teamId}`);

      // API запрос для получения приглашений команды через invitationAPI
      const invitations = await invitationAPI.getTeamInvitations(teamId);

      // Добавляем подробный отладочный вывод для проверки данных пользователей
      console.log(`Получено ${invitations.length} приглашений для команды ${teamId}`);
      invitations.forEach((invitation: InvitationItem, index: number) => {
        console.log(`[Отладка] Приглашение ${index + 1}:`, invitation);

        if (invitation.User) {
          console.log(`[Отладка] Пользователь:`, {
            id: invitation.User.id,
            email: invitation.User.email,
            user_info: invitation.User.user_info
          });
        } else {
          console.log(`[Отладка] Данные пользователя отсутствуют для ID: ${invitation.UserId}`);
        }
      });

      // Обновляем состояние
      setTeamInvitations(prev => ({
        ...prev,
        [teamId]: invitations
      }));

      return invitations;
    } catch (error: any) {
      // Проверяем, является ли ошибка ошибкой доступа (403)
      if (error.response && error.response.status === 403) {
        console.log(`Нет прав для просмотра приглашений команды ${teamId}: ${error.response.data.message}`);

        // Устанавливаем null для этой команды, чтобы UI показал сообщение об отсутствии прав
        setTeamInvitations(prev => ({
          ...prev,
          [teamId]: null
        }));
      } else {
        console.error(`Ошибка при загрузке приглашений для команды ${teamId}:`, error);

        // При других ошибках устанавливаем пустой массив
        setTeamInvitations(prev => ({
          ...prev,
          [teamId]: []
        }));
      }
      return [];
    }
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
                          {getCompetitionInfo(application.Competition).name}
                        </CardTitle>
                        {application.Competition && getCompetitionInfo(application.Competition).dates && (
                          <p className="text-sm text-neutral-500 mt-1">
                            {getCompetitionInfo(application.Competition).dates}
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
                          {(() => {
                            const teamInfo = getTeamInfo(application.Team, application.TeamId);
                            return (
                              <>
                                <p className="text-sm text-neutral-600">
                                  <span className="font-medium">Название команды:</span> {teamInfo.name}
                                </p>
                                <p className="text-sm text-neutral-600">
                                  <span className="font-medium">ID Команды:</span> {application.TeamId || 'Не указано'}
                                </p>
                                {teamInfo.description && (
                                  <p className="text-sm text-neutral-600">
                                    <span className="font-medium">Описание команды:</span> {teamInfo.description}
                                  </p>
                                )}
                                {teamInfo.members && teamInfo.members.length > 0 && (
                                  <div>
                                    <p className="text-sm font-medium text-neutral-600">Участники команды:</p>
                                    <ul className="text-sm text-neutral-600 list-disc pl-5 mt-1">
                                      {teamInfo.members.map((member: TeamMember, index: number) => {
                                        // Формируем полное имя
                                        const fullName = member.lastName || member.firstName
                                          ? `${member.lastName || ''} ${member.firstName || ''}`.trim()
                                          : '';

                                        // Определяем ID участника
                                        const memberId = member.id || member.userId || member.UserId || `Не указан`;

                                        // Получаем email и телефон
                                        const email = member.email || '';
                                        const phone = member.phone || '';

                                        return (
                                          <li key={index} className="mb-2 border-b pb-2 border-gray-100 last:border-0">
                                            {/* Если есть имя, email или телефон - выводим их, иначе только ID */}
                                            {(fullName || email || phone) ? (
                                              <>
                                                {fullName && (
                                                  <div>
                                                    {(member.isCapitan || member.is_capitan) && '👑 '}
                                                    <span className="font-medium">{fullName}</span>
                                                  </div>
                                                )}

                                                <div className="text-xs text-neutral-500 mt-0.5 flex flex-col">
                                                  {email && (
                                                    <span>Email: {email}</span>
                                                  )}
                                                  {phone && (
                                                    <span>Телефон: {phone}</span>
                                                  )}
                                                  <span>ID: {memberId}</span>
                                                </div>
                                              </>
                                            ) : (
                                              <div>
                                                {(member.isCapitan || member.is_capitan) && '👑 '}
                                                <span className="font-medium">Участник ID: {memberId}</span>
                                              </div>
                                            )}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                )}

                                {/* Добавляем блок с приглашениями */}
                                {application.TeamId && (
                                  <div className="mt-4">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-neutral-600">Приглашения:</p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs py-1 px-2 h-7"
                                        onClick={() => fetchTeamInvitations(application.TeamId)}
                                      >
                                        <RefreshCw className="h-3 w-3 mr-1" />
                                        Обновить
                                      </Button>
                                    </div>

                                    <div className="mt-2">
                                      {teamInvitations[application.TeamId] === undefined ? (
                                        <p className="text-sm text-neutral-500 italic">Загрузка приглашений...</p>
                                      ) : renderInvitations(application.TeamId)}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Информация о соревновании и капитане */}
                      <div>
                        <h3 className="text-md font-semibold mb-3">Информация о соревновании</h3>
                        <div className="space-y-2">
                          {(() => {
                            const competitionInfo = getCompetitionInfo(application.Competition);
                            return (
                              <>
                                <p className="text-sm text-neutral-600">
                                  <span className="font-medium">Название:</span> {competitionInfo.name}
                                </p>
                                <p className="text-sm text-neutral-600">
                                  <span className="font-medium">ID соревнования:</span> {application.CompetitionId || 'Не указано'}
                                </p>
                                {competitionInfo.description && (
                                  <p className="text-sm text-neutral-600">
                                    <span className="font-medium">Описание:</span> {competitionInfo.description}
                                  </p>
                                )}
                                {competitionInfo.format && (
                                  <p className="text-sm text-neutral-600">
                                    <span className="font-medium">Формат:</span> {competitionInfo.format}
                                  </p>
                                )}
                                {competitionInfo.discipline && (
                                  <p className="text-sm text-neutral-600">
                                    <span className="font-medium">Дисциплина:</span> {competitionInfo.discipline}
                                  </p>
                                )}
                                {competitionInfo.dates && (
                                  <p className="text-sm text-neutral-600">
                                    <span className="font-medium">Период проведения:</span> {competitionInfo.dates}
                                  </p>
                                )}
                              </>
                            );
                          })()}

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

                          const competitionInfo = getCompetitionInfo(application.Competition);
                          const competitionDetails = application.Competition
                            ? `Название: ${competitionInfo.name}
ID: ${application.Competition.id}
${competitionInfo.description ? `Описание: ${competitionInfo.description}` : ''}
${competitionInfo.format ? `Формат: ${competitionInfo.format}` : ''}
${competitionInfo.discipline ? `Дисциплина: ${competitionInfo.discipline}` : ''}
${competitionInfo.dates ? `Период: ${competitionInfo.dates}` : ''}`
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