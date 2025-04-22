import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.ts';
import { useRegistrationStore } from '../store/registrationStore.ts';
import { CompetitionRegistration, Competition } from '../types';
import { User, Award, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import Button from '../components/ui/Button.tsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.tsx';
import Badge from '../components/ui/Badge.tsx';
import api from '../utils/api';

interface RegistrationWithCompetition extends CompetitionRegistration {
  competition: Competition;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: isUserLoading } = useAuthStore();
  const { userRegistrations, fetchUserRegistrations, isLoading: isRegLoading } = useRegistrationStore();

  const [registrationsWithCompetitions, setRegistrationsWithCompetitions] = useState<RegistrationWithCompetition[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      setIsLoading(true);

      try {
        // Загружаем регистрации пользователя
        await fetchUserRegistrations(user.id);

        // Получаем данные о соревнованиях для каждой регистрации
        if (userRegistrations.length > 0) {
          const competitionIds = userRegistrations.map(reg => reg.competitionId);

          try {
            const response = await api.get('/competitions/multiple', {
              params: { ids: competitionIds.join(',') }
            });

            // Объединяем данные регистраций с данными соревнований
            const registrationsWithDetails = userRegistrations.map(reg => {
              const competition = response.data.find((comp: Competition) => comp.id === reg.competitionId);
              return { ...reg, competition };
            }) as RegistrationWithCompetition[];

            setRegistrationsWithCompetitions(registrationsWithDetails);
          } catch (error) {
            console.error('Error loading competitions data:', error);
          }
        }

        // Загружаем достижения пользователя
        try {
          const achievementsResponse = await api.get(`/achievements/user/${user.id}`);
          setAchievements(achievementsResponse.data || []);
        } catch (error) {
          console.error('Error loading achievements:', error);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user, fetchUserRegistrations, userRegistrations]);

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

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 pt-24">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Личный кабинет</h1>
        <Button
          variant="outline"
          onClick={() => navigate('/profile/edit')}
          className="!bg-white keep-white-bg shadow-sm"
        >
          Редактировать профиль
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Профиль пользователя */}
        <Card className="md:col-span-1 !bg-white shadow">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="h-12 w-12 text-primary-600" />
              </div>
            </div>
            <CardTitle className="text-center">
              {user.firstName} {user.lastName}
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-500">Email</p>
                <p>{user.email}</p>
              </div>

              <div>
                <p className="text-sm text-neutral-500">Роль</p>
                <p>{user.role === 'athlete' ? 'Спортсмен' :
                  user.role === 'regional' ? 'Региональный представитель' : 'Представитель ФСП'}</p>
              </div>

              {user.region && (
                <div>
                  <p className="text-sm text-neutral-500">Регион</p>
                  <p>{user.region}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-neutral-500">Дата регистрации</p>
                <p>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Достижения и регистрации */}
        <div className="md:col-span-2 space-y-6">
          {/* Достижения */}
          <Card className="!bg-white shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-primary-600" />
                Достижения
              </CardTitle>
            </CardHeader>

            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
                </div>
              ) : achievements.length > 0 ? (
                <div className="space-y-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="p-3 bg-white border border-neutral-100 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{achievement.competitions.title}</h4>
                          <p className="text-sm text-neutral-600">
                            {achievement.place === 1 ? '🥇 Первое место' :
                              achievement.place === 2 ? '🥈 Второе место' :
                                achievement.place === 3 ? '🥉 Третье место' :
                                  `${achievement.place} место`}
                          </p>
                        </div>
                        <Badge
                          variant={achievement.isConfirmed ? 'success' : 'warning'}
                          size="sm"
                        >
                          {achievement.isConfirmed ? 'Подтверждено' : 'Не подтверждено'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  У вас пока нет достижений. Участвуйте в соревнованиях!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Регистрации на соревнования */}
          <Card className="!bg-white shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                Мои регистрации
              </CardTitle>
            </CardHeader>

            <CardContent>
              {isLoading || isRegLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
                </div>
              ) : registrationsWithCompetitions.length > 0 ? (
                <div className="space-y-4">
                  {registrationsWithCompetitions.map((reg) => (
                    <div
                      key={reg.id}
                      className="p-4 bg-white border border-neutral-100 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/competitions/${reg.competitionId}`)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="pt-1">
                          {getStatusIcon(reg.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium">{reg.competition?.title}</h4>
                            {getStatusBadge(reg.status)}
                          </div>
                          <p className="text-sm text-neutral-600 mt-1">
                            Дата соревнования: {reg.competition ? new Date(reg.competition.startDate).toLocaleDateString('ru-RU') : 'Н/Д'}
                          </p>
                          {reg.teamId && (
                            <p className="text-sm text-neutral-600">
                              Командная заявка
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  Вы еще не зарегистрировались ни на одно соревнование
                </div>
              )}

              <div className="mt-6">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/competitions')}
                >
                  Найти соревнования
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;