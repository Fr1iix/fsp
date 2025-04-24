import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore.ts';
import { applicationAPI, invitationAPI } from '../utils/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Badge from '../components/ui/Badge.tsx';
import { CheckCircle, XCircle, RefreshCw, User, Calendar, AlertCircle, ChevronDown, ChevronUp, Mail, Phone, FileText, Crown, Users, UserPlus } from 'lucide-react';

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
  // Состояние для хранения приглашений команд
  const [teamInvitations, setTeamInvitations] = useState<Record<string, InvitationItem[] | null>>({});
  const { user } = useAuthStore();
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Функция для переключения состояния развернутости карточки
  const toggleCardExpansion = (id: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Проверяем наличие токена перед запросом
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Требуется авторизация. Пожалуйста, войдите в систему.');
        setIsLoading(false);
        return;
      }

      // Используем applicationAPI вместо прямого вызова api
      const applications = await applicationAPI.getAll();

      // Устанавливаем полученные заявки в состояние
      setApplications(applications);
    } catch (error: any) {
      console.error('Ошибка при загрузке заявок:', error);

      if (error.response) {
        setError(`Ошибка ${error.response.status}: ${error.response.data?.message || 'Не удалось загрузить заявки'}`);
      } else if (error.request) {
        setError('Сервер не отвечает. Проверьте соединение.');
      } else {
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

      if (error.response) {
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
        <ul className="text-sm text-neutral-600 list-none space-y-3">
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
              <li key={invitation.id} className="p-3 rounded-lg border border-neutral-100 bg-white hover:bg-blue-50 transition-all duration-200">
                {/* Если есть ФИО, email или телефон - выводим их, иначе только ID */}
                {(fullName || email || phone) ? (
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 rounded-full h-8 w-8 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      {fullName && (
                        <div>
                          <span className="font-medium">{fullName}</span>
                        </div>
                      )}

                      <div className="text-xs text-neutral-500 mt-1.5 space-y-1">
                        {email && (
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1.5" />
                            {email}
                          </div>
                        )}
                        {phone && (
                          <div className="flex items-center">
                            <Phone className="h-3 w-3 mr-1.5" />
                            {phone}
                          </div>
                        )}
                        <div className="flex items-center">
                          <User className="h-3 w-3 mr-1.5" />
                          ID: {invitation.UserId}
                        </div>
                      </div>

                      <div className="mt-2">
                        {statusBadge}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="font-medium">Пользователь ID: {invitation.UserId}</span>
                    <div className="mt-2">
                      {statusBadge}
                    </div>
                  </div>
                )}
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
        return <Badge className="bg-yellow-500 text-white">На модерации</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 text-white">Подтверждена</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white">Отклонена</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white">Неизвестно</Badge>;
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

  // Функция для загрузки приглашений команды
  const fetchTeamInvitations = async (teamId: string) => {
    try {
      // API запрос для получения приглашений команды через invitationAPI
      const invitations = await invitationAPI.getTeamInvitations(teamId);

      // Обновляем состояние
      setTeamInvitations(prev => ({
        ...prev,
        [teamId]: invitations
      }));

      return invitations;
    } catch (error: any) {
      // Проверяем, является ли ошибка ошибкой доступа (403)
      if (error.response && error.response.status === 403) {
        // Устанавливаем null для этой команды, чтобы UI показал сообщение об отсутствии прав
        setTeamInvitations(prev => ({
          ...prev,
          [teamId]: null
        }));
      } else {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto max-w-5xl px-4 py-8 pt-24">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-6 border border-blue-100/50 transition-all duration-300">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 border-b border-blue-100/50 pb-6">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 md:mb-0">
              Заявки на соревнования
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow rounded-full px-5 py-2"
                onClick={fetchApplications}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin h-16 w-16 border-4 border-blue-500 rounded-full border-t-transparent mb-6 blur-[1px]"></div>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-medium text-lg">Загрузка заявок...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50/80 backdrop-blur-sm text-red-600 p-8 rounded-2xl border border-red-100 flex items-start gap-5 shadow-lg">
              <AlertCircle className="h-8 w-8 mt-0.5 flex-shrink-0 text-red-500" />
              <div>
                <h3 className="font-bold text-xl mb-2">Ошибка загрузки</h3>
                <p className="text-red-500">{error}</p>
              </div>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-200/50">
                <User className="h-12 w-12 text-white" />
              </div>
              <p className="text-2xl font-semibold mb-3 text-gray-700">Заявок пока нет</p>
              <p className="text-neutral-500 max-w-md mx-auto">Здесь будут отображаться заявки команд на соревнования</p>
            </div>
          ) : (
            <div className="space-y-8">
              {applications.map((application) => {
                const isExpanded = expandedCards[application.id] || false;
                const competitionInfo = getCompetitionInfo(application.Competition);
                const teamInfo = getTeamInfo(application.Team, application.TeamId);
                return (
                  <Card
                    key={application.id}
                    className={`overflow-hidden !bg-white border border-neutral-100 hover:border-blue-200 transition-all duration-300 ${isExpanded ? 'shadow-xl' : 'shadow-md'} rounded-2xl transform hover:-translate-y-1`}
                  >
                    <CardHeader className="bg-gradient-to-r from-blue-100 via-blue-50 to-indigo-100 py-5">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                          <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            {competitionInfo.name}
                          </CardTitle>
                          {competitionInfo.dates && (
                            <div className="flex items-center text-sm text-neutral-500 mt-1.5">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                              {competitionInfo.dates}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(application.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1.5 h-auto text-neutral-500 hover:text-blue-600 hover:bg-blue-50/80 rounded-full transition-all duration-200"
                            onClick={() => toggleCardExpansion(application.id)}
                          >
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Информация о команде */}
                          <div className="border-b pb-6 md:border-b-0 md:border-r border-blue-100/50 md:pb-0 md:pr-8">
                            <h3 className="text-md font-semibold mb-5 flex items-center gap-2 text-blue-700">
                              <Users className="h-4 w-4 text-blue-500" />
                              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Информация о команде
                              </span>
                            </h3>
                            <div className="space-y-5 max-w-lg">
                              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl shadow-sm border border-blue-100/70">
                                <p className="text-lg font-semibold text-blue-800 mb-1.5">{teamInfo.name}</p>
                                <div className="text-xs text-neutral-500">ID: {application.TeamId || 'Не указано'}</div>
                                {teamInfo.description && (
                                  <p className="text-sm text-neutral-600 mt-3 leading-relaxed">
                                    {teamInfo.description}
                                  </p>
                                )}
                              </div>

                              {teamInfo.members && teamInfo.members.length > 0 && (
                                <div className="mt-5">
                                  <p className="text-sm font-medium text-neutral-600 mb-3 flex items-center">
                                    <Users className="h-4 w-4 mr-1.5 text-blue-500" />
                                    Участники команды:
                                  </p>
                                  <div className="bg-white rounded-xl border border-neutral-100/80 divide-y overflow-hidden shadow-sm">
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

                                      const isCapitan = member.isCapitan || member.is_capitan;

                                      return (
                                        <div
                                          key={index}
                                          className={`p-4 hover:bg-blue-50/80 transition-colors duration-200 ${isCapitan ? 'bg-yellow-50/30 border-l-4 border-yellow-400' : ''}`}
                                        >
                                          {/* Если есть имя, email или телефон - выводим их, иначе только ID */}
                                          {(fullName || email || phone) ? (
                                            <div className="flex items-start gap-3">
                                              <div className={`rounded-full h-10 w-10 flex items-center justify-center text-white flex-shrink-0 ${isCapitan ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}>
                                                {isCapitan ? <Crown className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                              </div>
                                              <div className="flex-1">
                                                {fullName && (
                                                  <div className="flex items-center">
                                                    <span className="font-medium text-gray-700">{fullName}</span>
                                                    {isCapitan && (
                                                      <span className="ml-2 text-xs bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-0.5 rounded-full flex items-center gap-1 text-white shadow-sm">
                                                        <Crown className="h-3 w-3" />
                                                        Капитан
                                                      </span>
                                                    )}
                                                  </div>
                                                )}

                                                <div className="text-xs text-neutral-500 mt-1.5 space-y-1">
                                                  {email && (
                                                    <div className="flex items-center">
                                                      <Mail className="h-3 w-3 mr-1.5 text-blue-400" />
                                                      {email}
                                                    </div>
                                                  )}
                                                  {phone && (
                                                    <div className="flex items-center">
                                                      <Phone className="h-3 w-3 mr-1.5 text-blue-400" />
                                                      {phone}
                                                    </div>
                                                  )}
                                                  <div className="flex items-center">
                                                    <User className="h-3 w-3 mr-1.5 text-blue-400" />
                                                    ID: {memberId}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex items-center">
                                              <div className={`rounded-full h-10 w-10 flex items-center justify-center text-white flex-shrink-0 mr-3 ${isCapitan ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}>
                                                {isCapitan ? <Crown className="h-5 w-5" /> : <User className="h-5 w-5" />}
                                              </div>
                                              <div>
                                                <span className="font-medium">Участник ID: {memberId}</span>
                                                {isCapitan && (
                                                  <span className="ml-2 text-xs bg-gradient-to-r from-yellow-400 to-amber-500 px-3 py-0.5 rounded-full flex items-center gap-1 text-white shadow-sm">
                                                    <Crown className="h-3 w-3" />
                                                    Капитан
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Приглашения */}
                              {application.TeamId && (
                                <div className="mt-6">
                                  <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-medium text-neutral-600 flex items-center">
                                      <UserPlus className="h-4 w-4 mr-1.5 text-blue-500" />
                                      Приглашения:
                                    </p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs py-1 px-3 h-7 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-full shadow-sm hover:shadow transition-all duration-200"
                                      onClick={() => fetchTeamInvitations(application.TeamId)}
                                    >
                                      <RefreshCw className="h-3 w-3 mr-1.5" />
                                      Обновить
                                    </Button>
                                  </div>

                                  <div className="rounded-xl border border-neutral-100 p-5 bg-white shadow-sm">
                                    {teamInvitations[application.TeamId] === undefined ? (
                                      <div className="flex items-center justify-center text-neutral-500 py-4">
                                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent mr-3"></div>
                                        <p className="text-sm">Загрузка приглашений...</p>
                                      </div>
                                    ) : renderInvitations(application.TeamId)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Информация о соревновании и капитане */}
                          <div className="pt-4 md:pt-0 md:pl-8">
                            <div className="mb-8">
                              <h3 className="text-md font-semibold mb-5 flex items-center gap-2 text-blue-700">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                  Информация о соревновании
                                </span>
                              </h3>
                              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl shadow-sm border border-blue-100/70 space-y-4">
                                <p className="text-lg font-semibold text-blue-800">{competitionInfo.name}</p>
                                <div className="text-xs text-neutral-500">ID: {application.CompetitionId || 'Не указано'}</div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mt-2">
                                  {competitionInfo.discipline && (
                                    <div className="text-sm flex items-start gap-1.5">
                                      <span className="font-medium text-blue-700">Дисциплина:</span>
                                      <span className="text-neutral-700">{competitionInfo.discipline}</span>
                                    </div>
                                  )}
                                  {competitionInfo.format && (
                                    <div className="text-sm flex items-start gap-1.5">
                                      <span className="font-medium text-blue-700">Формат:</span>
                                      <span className="text-neutral-700">{competitionInfo.format}</span>
                                    </div>
                                  )}
                                  {competitionInfo.dates && (
                                    <div className="text-sm col-span-2 flex items-center">
                                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                                      <span className="font-medium text-blue-700 mr-1.5">Период:</span>
                                      <span className="text-neutral-700">{competitionInfo.dates}</span>
                                    </div>
                                  )}
                                </div>

                                {competitionInfo.description && (
                                  <div className="text-sm mt-3 border-t border-blue-100 pt-3">
                                    <p className="font-medium text-blue-700 mb-1.5">Описание:</p>
                                    <p className="text-neutral-600 leading-relaxed">{competitionInfo.description}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Информация о капитане */}
                            <div>
                              <h3 className="text-md font-semibold mb-5 flex items-center gap-2 text-blue-700">
                                <Crown className="h-4 w-4 text-blue-500" />
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                  Информация о капитане
                                </span>
                              </h3>
                              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl shadow-sm border border-blue-100/70">
                                <div className="flex items-start gap-4">
                                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full h-12 w-12 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                                    <User className="h-6 w-6" />
                                  </div>

                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-700 text-lg">{getUserName(application.User)}</p>
                                    <div className="text-xs text-neutral-500 mt-3 space-y-1.5">
                                      <div className="flex items-center">
                                        <Mail className="h-3.5 w-3.5 mr-2 text-blue-400" />
                                        {application.User?.email || 'Не указано'}
                                      </div>

                                      {application.User?.user_info?.phone && (
                                        <div className="flex items-center">
                                          <Phone className="h-3.5 w-3.5 mr-2 text-blue-400" />
                                          {application.User.user_info.phone}
                                        </div>
                                      )}

                                      <div className="flex items-center">
                                        <User className="h-3.5 w-3.5 mr-2 text-blue-400" />
                                        ID: {application.UserId || 'Не указан'}
                                      </div>

                                      <div className="flex items-center">
                                        <Calendar className="h-3.5 w-3.5 mr-2 text-blue-400" />
                                        Заявка подана: {formatDate(application.createdAt)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}

                    {/* Краткая информация видна когда карточка свернута */}
                    {!isExpanded && (
                      <CardContent className="p-5">
                        <div className="flex flex-wrap items-center gap-4 justify-between">
                          <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full h-12 w-12 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                              <User className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-700">{getUserName(application.User)}</div>
                              <div className="text-sm text-neutral-500 flex items-center gap-1.5 mt-0.5">
                                <Users className="h-3.5 w-3.5 text-blue-400" />
                                Капитан команды "{teamInfo.name}"
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 shadow-sm hover:shadow transition-all duration-200 rounded-full px-4"
                            onClick={() => toggleCardExpansion(application.id)}
                          >
                            <span className="mr-1.5">Подробнее</span>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    )}

                    {/* Действия */}
                    <CardContent className="bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 p-5 border-t border-neutral-100">
                      <div className="flex flex-wrap gap-3 justify-end">
                        {application.status === 'pending' && (
                          <>
                            <Button
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-5"
                              onClick={() => handleUpdateStatus(application.id, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Подтвердить
                            </Button>

                            <Button
                              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-5"
                              onClick={() => handleUpdateStatus(application.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4" />
                              Отклонить
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitionApplicationsPage; 