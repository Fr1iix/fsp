import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.ts';
import { useRegistrationStore } from '../store/registrationStore.ts';
import { CompetitionRegistration, Competition } from '../types';
import { User, Award, Calendar, CheckCircle, XCircle, Clock, Mail, Phone, MapPin, Github, Edit3 } from 'lucide-react';
import Button from '../components/ui/Button.tsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.tsx';
import Badge from '../components/ui/Badge.tsx';
import api from '../utils/api';

interface RegistrationWithCompetition extends CompetitionRegistration {
  competition: Competition;
}

// Обновим компонент для поддержки правильных типов для badge
const ProfileBadge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <span className="px-3 py-1 text-sm rounded-full bg-white text-neutral-800 shadow-sm flex items-center gap-1">
      {children}
    </span>
  );
};

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userInfo, isLoading: isUserLoading, loadUserInfo } = useAuthStore();
  const { userRegistrations, fetchUserRegistrations, isLoading: isRegLoading } = useRegistrationStore();

  const [registrationsWithCompetitions, setRegistrationsWithCompetitions] = useState<RegistrationWithCompetition[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Используем useCallback для функции загрузки данных, чтобы она не пересоздавалась при каждом рендере
  const loadData = useCallback(async () => {
    if (dataLoaded || !user) return;

    setIsLoading(true);
    try {
      await loadUserInfo(user.id);
      await fetchUserRegistrations(user.id);

      if (userRegistrations.length > 0) {
        const competitionIds = userRegistrations.map(reg => reg.competitionId);

        try {
          const response = await api.get('/competitions/multiple', {
            params: { ids: competitionIds.join(',') }
          });

          const registrationsWithDetails = userRegistrations.map(reg => {
            const competition = response.data.find((comp: Competition) => comp.id === reg.competitionId);
            return { ...reg, competition };
          }) as RegistrationWithCompetition[];

          setRegistrationsWithCompetitions(registrationsWithDetails);
        } catch (error) {
          console.error('Error loading competitions data:', error);
        }
      }

      try {
        const achievementsResponse = await api.get(`/achievements/user/${user.id}`);
        setAchievements(achievementsResponse.data || []);
      } catch (error) {
        console.error('Error loading achievements:', error);
      }

      // Отмечаем, что данные загружены, чтобы избежать повторной загрузки
      setDataLoaded(true);
    } catch (error) {
      console.error('Ошибка при загрузке данных профиля:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, loadUserInfo, fetchUserRegistrations, userRegistrations, dataLoaded]);

  // Загружаем данные только один раз при монтировании компонента или изменении пользователя
  useEffect(() => {
    if (user && !dataLoaded) {
      loadData();
    }
  }, [user, dataLoaded, loadData]);

  // Получаем статус регистрации в виде бейджа
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; variant: React.ComponentProps<typeof Badge>['variant'] }> = {
      pending: { text: 'На рассмотрении', variant: 'warning' },
      approved: { text: 'Одобрена', variant: 'success' },
      rejected: { text: 'Отклонена', variant: 'error' },
      withdrawn: { text: 'Отозвана', variant: 'neutral' },
    };

    const { text, variant } = statusMap[status] || { text: 'Неизвестно', variant: 'neutral' };

    return <Badge variant={variant}>{text}</Badge>;
  };

  // Получаем иконку статуса регистрации
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-success-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-error-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-warning-500" />;
      default:
        return <Clock className="h-5 w-5 text-neutral-500" />;
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Функция для получения человекопонятного названия роли
  const getRoleName = (role: string) => {
    switch (role) {
      case 'athlete': return 'Спортсмен';
      case 'regional': return 'Региональный представитель';
      case 'fsp': return 'Представитель ФСП';
      default: return 'Пользователь';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-5xl px-4 py-8 pt-24">
        {/* Верхняя часть профиля */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-400 rounded-lg shadow-lg mb-6 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-lg">
              <User className="h-16 w-16 text-primary-600" />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {userInfo?.firstName || 'Имя'} {userInfo?.lastName || 'Фамилия'}
              </h1>
              <p className="text-primary-100 mb-4">{getRoleName(user.role)}</p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <ProfileBadge>
                  <Mail className="h-4 w-4 mr-1" /> {user.email}
                </ProfileBadge>

                {userInfo?.phone && (
                  <ProfileBadge>
                    <Phone className="h-4 w-4 mr-1" /> {userInfo.phone}
                  </ProfileBadge>
                )}
              </div>
            </div>

            <div>
              <Button
                variant="outline"
                className="!bg-white shadow-md"
                leftIcon={<Edit3 className="h-4 w-4" />}
                onClick={() => navigate('/profile/edit')}
              >
                Редактировать
              </Button>
            </div>
          </div>
        </div>

        {/* Основная информация */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка - детали пользователя */}
          <div className="lg:col-span-1 space-y-6">
            {/* Подробная информация */}
            <Card className="overflow-hidden !bg-white shadow">
              <CardHeader className="bg-neutral-50 border-b border-neutral-100">
                <CardTitle className="text-lg">Личная информация</CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                <ul className="divide-y divide-neutral-100">
                  {userInfo?.middleName && (
                    <li className="p-4 flex items-center">
                      <span className="text-neutral-500 w-1/3">Отчество:</span>
                      <span className="font-medium">{userInfo.middleName}</span>
                    </li>
                  )}

                  <li className="p-4 flex items-center">
                    <span className="text-neutral-500 w-1/3">Пол:</span>
                    <span className="font-medium">{userInfo?.gender || 'Не указано'}</span>
                  </li>

                  {userInfo?.birthday && (
                    <li className="p-4 flex items-center">
                      <span className="text-neutral-500 w-1/3">Дата рождения:</span>
                      <span className="font-medium">
                        {new Date(userInfo.birthday).toLocaleDateString('ru-RU')}
                      </span>
                    </li>
                  )}

                  {userInfo?.address && (
                    <li className="p-4 flex items-center">
                      <span className="text-neutral-500 w-1/3">Адрес:</span>
                      <span className="font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-neutral-400" />
                        {userInfo.address}
                      </span>
                    </li>
                  )}

                  {userInfo?.github && (
                    <li className="p-4 flex items-center">
                      <span className="text-neutral-500 w-1/3">GitHub:</span>
                      <a
                        href={`https://github.com/${userInfo.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary-600 flex items-center hover:underline"
                      >
                        <Github className="h-4 w-4 mr-1" />
                        {userInfo.github}
                      </a>
                    </li>
                  )}

                  <li className="p-4 flex items-center">
                    <span className="text-neutral-500 w-1/3">Дата регистрации:</span>
                    <span className="font-medium">
                      {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* О себе */}
            {userInfo?.discription && (
              <Card className="overflow-hidden !bg-white shadow">
                <CardHeader className="bg-neutral-50 border-b border-neutral-100">
                  <CardTitle className="text-lg">О себе</CardTitle>
                </CardHeader>

                <CardContent className="p-4">
                  <p className="text-neutral-700 whitespace-pre-line">
                    {userInfo.discription}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Правая колонка - достижения и активность */}
          <div className="lg:col-span-2 space-y-6">
            {/* Достижения */}
            <Card className="overflow-hidden !bg-white shadow">
              <CardHeader className="bg-neutral-50 border-b border-neutral-100 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Award className="h-5 w-5 mr-2 text-primary-600" />
                  Достижения
                </CardTitle>

                <Button variant="outline" size="sm" onClick={() => navigate('/achievements')}>
                  Все достижения
                </Button>
              </CardHeader>

              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <Award className="h-14 w-14 mx-auto text-neutral-300 mb-3" />
                    <p className="text-lg font-medium mb-1">У вас пока нет достижений</p>
                    <p className="text-sm">Участвуйте в соревнованиях, чтобы получить их!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Предстоящие соревнования */}
            <Card className="overflow-hidden !bg-white shadow">
              <CardHeader className="bg-neutral-50 border-b border-neutral-100 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                  Мои соревнования
                </CardTitle>

                <Button variant="outline" size="sm" onClick={() => navigate('/competitions')}>
                  Все соревнования
                </Button>
              </CardHeader>

              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-neutral-500">
                    <Calendar className="h-14 w-14 mx-auto text-neutral-300 mb-3" />
                    <p className="text-lg font-medium mb-1">Вы не зарегистрированы на соревнования</p>
                    <p className="text-sm">Найдите интересное соревнование и примите участие!</p>
                    <Button
                      className="mt-4"
                      onClick={() => navigate('/competitions')}
                    >
                      Найти соревнования
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;