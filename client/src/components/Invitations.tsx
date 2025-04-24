import React, { useEffect, useState } from 'react';
import { invitationAPI } from '../utils/api';
import Button from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import { Check, X, Users } from 'lucide-react';

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
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Попробовать снова</Button>
      </div>
    );
  }

  // Фильтруем только ожидающие ответа приглашения
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  if (pendingInvitations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-500">У вас нет активных приглашений</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Приглашения в команду</h3>
      
      {pendingInvitations.map(invitation => (
        <Card key={invitation.id} className="overflow-hidden border-none shadow-md">
          <CardHeader className="bg-primary-50 pb-3">
            <CardTitle className="text-lg font-medium text-primary-700">
              <Users className="h-5 w-5 inline-block mr-2" />
              Приглашение в команду {invitation.Team?.name || 'Неизвестная команда'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-4">
            <div className="space-y-3">
              <p className="text-neutral-700">
                <strong>Соревнование:</strong> {invitation.Competition?.name || 'Неизвестное соревнование'}
              </p>
              
              {invitation.Competition?.startdate && (
                <p className="text-neutral-600 text-sm">
                  <strong>Дата начала:</strong> {formatDate(invitation.Competition.startdate)}
                </p>
              )}
              
              <p className="text-neutral-600 text-sm">
                <strong>Приглашение от:</strong> {
                  invitation.Inviter?.user_info && (invitation.Inviter.user_info.lastName || invitation.Inviter.user_info.firstName) 
                    ? `${invitation.Inviter.user_info.lastName || ''} ${invitation.Inviter.user_info.firstName || ''} ${invitation.Inviter.user_info.middleName || ''} (${invitation.Inviter.email})`
                    : invitation.Inviter?.email 
                      ? invitation.Inviter.email
                      : `Пользователь #${invitation.InvitedBy || 'неизвестен'}`
                }
              </p>
              
              <p className="text-neutral-600 text-sm">
                <strong>Получено:</strong> {formatDate(invitation.createdAt)}
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="bg-neutral-50 pt-3 flex justify-between">
            <Button
              variant="primary"
              leftIcon={<Check className="h-4 w-4" />}
              onClick={() => handleInvitationResponse(invitation.id, 'accepted')}
              className="w-full mr-2 bg-green-500 hover:bg-green-600"
            >
              Принять
            </Button>
            
            <Button
              variant="primary"
              leftIcon={<X className="h-4 w-4" />}
              onClick={() => handleInvitationResponse(invitation.id, 'rejected')}
              className="w-full ml-2 bg-red-500 hover:bg-red-600"
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