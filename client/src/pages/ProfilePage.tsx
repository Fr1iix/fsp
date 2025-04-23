import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.ts';
import { useRegistrationStore } from '../store/registrationStore.ts';
import { CompetitionRegistration, Competition } from '../types';
import { User, Award, Calendar, CheckCircle, XCircle, Clock, Mail, Phone, Github, Edit3, PlusCircle, ClipboardList } from 'lucide-react';
import Button from '../components/ui/Button.tsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.tsx';
import Badge from '../components/ui/Badge.tsx';
import api from '../utils/api';

interface RegistrationWithCompetition extends CompetitionRegistration {
  competition: Competition;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userInfo, isLoading: isUserLoading, loadUserInfo } = useAuthStore();
  const { userRegistrations, fetchUserRegistrations } = useRegistrationStore();

  // Добавляем правильную типизацию для achievements
  interface Achievement {
    id: string;
    competitionId: string;
    userId: string;
    place: number;
    isConfirmed: boolean;
    createdAt: string;
    updatedAt: string;
  }

  const [registrationsWithCompetitions, setRegistrationsWithCompetitions] = useState<RegistrationWithCompetition[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
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

  if (isUserLoading || !user) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
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
        <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="relative p-8">
            {/* Декоративные элементы */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-xl"></div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
              <div className="w-32 h-32 rounded-full bg-white p-1.5 flex items-center justify-center shadow-xl">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                  <User className="h-16 w-16 text-primary-600" />
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {userInfo?.lastName || 'Фамилия'} {userInfo?.firstName || 'Имя'} {userInfo?.middleName || ''}
                </h1>
                <p className="text-primary-100 mb-4 font-medium">{getRoleName(user.role)}</p>

                <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-y-3 gap-x-6 mt-5 text-white/90">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-primary-100" />
                    <span className="text-sm">{user.email}</span>
                  </div>

                  {userInfo?.birthday && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-primary-100" />
                      <span className="text-sm">
                        {new Date(userInfo.birthday).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-primary-100" />
                    <span className="text-sm">
                      Регистрация: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="!bg-white/95 shadow-md hover:!bg-white transition-all"
                  leftIcon={<Edit3 className="h-4 w-4" />}
                  onClick={() => navigate('/profile/edit')}
                >
                  Редактировать
                </Button>

                {user.role === 'regional' && (
                  <Button
                    variant="primary"
                    className="!bg-success-500 shadow-md hover:!bg-success-600 transition-all text-white"
                    leftIcon={<PlusCircle className="h-4 w-4" />}
                    onClick={() => navigate('/competition/request')}
                  >
                    Создать заявку на соревнование
                  </Button>
                )}

                {user.role === 'regional' && (
                  <Button
                    variant="primary"
                    className="!bg-accent-500 shadow-md hover:!bg-accent-600 transition-all text-white"
                    leftIcon={<ClipboardList className="h-4 w-4" />}
                    onClick={() => navigate('/competition/applications')}
                  >
                    Посмотреть заявки
                  </Button>
                )}

                {user.role === 'fsp' && (
                  <Button
                    variant="primary"
                    className="!bg-accent-500 shadow-md hover:!bg-accent-600 transition-all text-white"
                    leftIcon={<ClipboardList className="h-4 w-4" />}
                    onClick={() => navigate('/competition/requests')}
                  >
                    Посмотреть заявки
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Основная информация */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Левая колонка - детали пользователя */}
          <div className="lg:col-span-1 space-y-6">
            {/* Подробная информация */}
            <Card className="overflow-hidden !bg-white shadow-md rounded-xl border-none">
              <CardHeader className="bg-neutral-50 border-b border-neutral-100 py-4 rounded-xl">
                <CardTitle className="text-lg font-semibold text-neutral-800 text-center">Личная информация</CardTitle>
              </CardHeader>

              <CardContent className="p-0">
                {(userInfo?.phone || userInfo?.gender || userInfo?.github) ? (
                  <ul className="divide-y divide-neutral-100">
                    {userInfo?.phone && (
                      <li className="p-4 flex flex-col sm:flex-row sm:items-center group transition-colors hover:bg-neutral-50">
                        <span className="text-neutral-500 w-full sm:w-1/3 mb-1 sm:mb-0 font-medium">Телефон:</span>
                        <span className="text-neutral-800 flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-primary-500 flex-shrink-0" />
                          {userInfo.phone}
                        </span>
                      </li>
                    )}

                    {userInfo?.gender && (
                      <li className="p-4 flex flex-col sm:flex-row sm:items-center group transition-colors hover:bg-neutral-50">
                        <span className="text-neutral-500 w-full sm:w-1/3 mb-1 sm:mb-0 font-medium">Пол:</span>
                        <span className="text-neutral-800">{userInfo.gender}</span>
                      </li>
                    )}

                    {userInfo?.github && (
                      <li className="p-4 flex flex-col sm:flex-row sm:items-center group transition-colors hover:bg-neutral-50">
                        <span className="text-neutral-500 w-full sm:w-1/3 mb-1 sm:mb-0 font-medium">GitHub:</span>
                        <a
                          href={`https://github.com/${userInfo.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 flex items-center hover:underline"
                        >
                          <Github className="h-4 w-4 mr-2 flex-shrink-0" />
                          {userInfo.github}
                        </a>
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <User className="h-12 w-12 text-neutral-300 mb-3" />
                    <p className="text-neutral-500 mb-2">Информация о пользователе отсутствует</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => navigate('/profile/edit')}
                    >
                      Добавить информацию
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* О себе */}
            {userInfo?.discription && (
              <Card className="overflow-hidden !bg-white shadow-md rounded-xl border-none">
                <CardHeader className="bg-neutral-50 border-b border-neutral-100 py-4">
                  <CardTitle className="text-lg font-semibold text-neutral-800 text-center">О себе</CardTitle>
                </CardHeader>

                <CardContent className="p-5">
                  <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
                    {userInfo.discription}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Правая колонка - достижения и активность */}
          <div className="lg:col-span-2 space-y-6">
            {/* Достижения */}
            <Card className="overflow-hidden !bg-white shadow-md rounded-xl border-none">
              <CardHeader className="rounded-xl bg-neutral-50 border-b border-neutral-100 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-neutral-800 flex items-center">
                  <Award className="h-5 w-5 mr-2 text-primary-600" />
                  Достижения
                </CardTitle>

                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-primary-50"
                  onClick={() => navigate('/achievements')}
                >
                  Все достижения
                </Button>
              </CardHeader>

              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-neutral-500">
                    <div className="bg-neutral-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="h-12 w-12 text-neutral-300" />
                    </div>
                    <p className="text-lg font-medium mb-2 text-neutral-700">У вас пока нет достижений</p>
                    <p className="text-sm max-w-md mx-auto">Участвуйте в соревнованиях, чтобы получить награды и отметки о достижениях</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Предстоящие соревнования */}
            <Card className="overflow-hidden !bg-white shadow-md rounded-xl border-none">
              <CardHeader className="rounded-xl bg-neutral-50 border-b border-neutral-100 py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold text-neutral-800 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                  Мои соревнования
                </CardTitle>

                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-primary-50"
                  onClick={() => navigate('/competitions')}
                >
                  Все соревнования
                </Button>
              </CardHeader>

              <CardContent className="p-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-neutral-500">
                    <div className="bg-neutral-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-12 w-12 text-neutral-300" />
                    </div>
                    <p className="text-lg font-medium mb-2 text-neutral-700">Вы не зарегистрированы на соревнования</p>
                    <p className="text-sm max-w-md mx-auto mb-6">Найдите интересное соревнование и примите участие, чтобы проявить свои навыки!</p>
                    <Button
                      className="px-6 shadow-sm hover:shadow transition-all"
                      onClick={() => navigate('/competitions')}
                    >
                      Найти соревнования
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Добавляем использование registrationsWithCompetitions и achievements */}
            <div className="space-y-6">
              {/* Секция регистраций */}
              {registrationsWithCompetitions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Регистрации на соревнования</h3>
                  <div className="space-y-4">
                    {registrationsWithCompetitions.map((reg) => (
                      <div key={reg.id} className="p-4 bg-white rounded-lg shadow">
                        <h4>{reg.competition.title}</h4>
                        <p>Статус: {reg.status}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Секция достижений */}
              {achievements.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Достижения</h3>
                  <div className="space-y-4">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="p-4 bg-white rounded-lg shadow">
                        <p>Место: {achievement.place}</p>
                        <p>Статус: {achievement.isConfirmed ? 'Подтверждено' : 'На проверке'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;