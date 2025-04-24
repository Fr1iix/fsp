import React, { useEffect, useState } from 'react';
import { invitationAPI } from '../utils/api';
import Button from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import { Check, X, Users, Calendar, User, Clock, Info } from 'lucide-react';

interface Invitation {
  id: string;
  TeamId: string;
  UserId: string;
  InvitedBy: string;
  status: 'pending' | 'accepted' | 'rejected';
  CompetitionId: string;
  createdAt: string;
  Team?: {
    id: string;
    name: string;
    discription?: string;
  };
  Competition?: {
    id: string;
    name: string;
    format?: string;
    startdate?: string;
    enddate?: string;
  };
  Inviter?: {
    id: string;
    email: string;
    user_info?: {
      firstName?: string;
      lastName?: string;
      middleName?: string;
    };
  };
}

const Invitations: React.FC = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка приглашений
  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        setLoading(true);
        const data = await invitationAPI.getMyInvitations();
        console.log('Получены приглашения:', data);

        // Проверяем данные о командах
        if (data && data.length > 0) {
          data.forEach((invitation: Invitation, index: number) => {
            console.log(`Приглашение ${index + 1}:`, {
              id: invitation.id,
              TeamId: invitation.TeamId,
              Team: invitation.Team,
              CompetitionId: invitation.CompetitionId,
              Competition: invitation.Competition,
              InvitedBy: invitation.InvitedBy,
              Inviter: invitation.Inviter
            });

            // Проверка данных о приглашающем
            if (invitation.Inviter) {
              console.log('Информация о приглашающем:', {
                id: invitation.Inviter.id,
                email: invitation.Inviter.email,
                user_info: invitation.Inviter.user_info
              });
            } else {
              console.log('Отсутствует информация о приглашающем, хотя есть InvitedBy:', invitation.InvitedBy);
            }
          });
        }

        setInvitations(data);
        setError(null);
      } catch (err: any) {
        console.error('Ошибка при загрузке приглашений:', err);
        setError(err.message || 'Не удалось загрузить приглашения');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, []);

  // Обработчик ответа на приглашение
  const handleInvitationResponse = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await invitationAPI.respond(id, status);

      // Обновляем список приглашений
      setInvitations(prevInvitations =>
        prevInvitations.map(inv =>
          inv.id === id ? { ...inv, status } : inv
        )
      );
    } catch (err: any) {
      console.error('Ошибка при ответе на приглашение:', err);
      alert('Не удалось обработать приглашение. Попробуйте еще раз.');
    }
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

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin h-6 w-6 border-3 border-primary-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 mb-2 text-sm">Ошибка загрузки</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.location.reload()}
          className="text-xs"
        >
          Обновить
        </Button>
      </div>
    );
  }

  // Фильтруем только ожидающие ответа приглашения
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  if (pendingInvitations.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-neutral-500 text-sm">У вас нет активных приглашений</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingInvitations.map(invitation => (
        <Card
          key={invitation.id}
          className="overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 rounded-xl"
        >
          <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 pb-2 pt-3 px-3 border-b border-primary-100">
            <CardTitle className="text-sm font-medium text-primary-800 truncate flex items-center">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-500/10 mr-2 flex-shrink-0">
                <Users className="h-3 w-3 text-primary-600" />
              </div>
              {invitation.Team?.name || 'Неизвестная команда'}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-3 pb-2 px-3 bg-white">
            <div className="text-xs space-y-2">
              <p className="text-neutral-800 font-medium truncate flex items-center bg-neutral-50 px-2 py-1 rounded-md">
                <Info className="h-3 w-3 mr-1.5 text-primary-500 flex-shrink-0" />
                {invitation.Competition?.name || 'Неизвестное соревнование'}
              </p>

              <div className="grid grid-cols-1 gap-1.5 pl-1">
                {invitation.Competition?.startdate && (
                  <div className="flex items-center text-neutral-600 hover:text-primary-700 transition-colors">
                    <Calendar className="h-3 w-3 mr-1.5 flex-shrink-0 text-primary-400" />
                    <span className="truncate">{formatDate(invitation.Competition.startdate)}</span>
                  </div>
                )}

                <div className="flex items-center text-neutral-600 hover:text-primary-700 transition-colors">
                  <User className="h-3 w-3 mr-1.5 flex-shrink-0 text-primary-400" />
                  <span className="truncate">
                    {invitation.Inviter?.user_info && (invitation.Inviter.user_info.lastName || invitation.Inviter.user_info.firstName)
                      ? `${invitation.Inviter.user_info.lastName || ''} ${invitation.Inviter.user_info.firstName || ''}`
                      : invitation.Inviter?.email
                        ? invitation.Inviter.email
                        : `Пользователь #${invitation.InvitedBy || 'неизвестен'}`}
                  </span>
                </div>

                <div className="flex items-center text-neutral-600 hover:text-primary-700 transition-colors">
                  <Clock className="h-3 w-3 mr-1.5 flex-shrink-0 text-primary-400" />
                  <span className="truncate">{formatDate(invitation.createdAt)}</span>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="bg-neutral-50 py-2 px-3 flex justify-between gap-2 border-t border-neutral-100">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Check className="h-3 w-3" />}
              onClick={() => handleInvitationResponse(invitation.id, 'accepted')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 py-0.5 text-xs h-7 shadow-sm hover:shadow transition-all rounded-md font-medium"
            >
              Принять
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<X className="h-3 w-3" />}
              onClick={() => handleInvitationResponse(invitation.id, 'rejected')}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 py-0.5 text-xs h-7 shadow-sm hover:shadow transition-all rounded-md font-medium"
            >
              Отклонить
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default Invitations; 