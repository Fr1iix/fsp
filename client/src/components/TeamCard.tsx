import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Check, X } from 'lucide-react';
import { Team } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card.tsx';
import Badge from './ui/Badge.tsx';
import Button from './ui/Button.tsx';

interface TeamCardProps {
  team: Team;
  competitionId: string;
  currentUserId?: string;
  onJoinRequest?: (teamId: string) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ 
  team, 
  competitionId, 
  currentUserId,
  onJoinRequest 
}) => {
  const navigate = useNavigate();
  
  // Проверяем, является ли текущий пользователь членом команды
  const isMember = currentUserId ? team.members.some(m => m.userId === currentUserId) : false;
  
  // Проверяем, может ли пользователь присоединиться к команде
  const canJoin = team.status === 'forming' && 
                  !isMember && 
                  currentUserId && 
                  (team.requiredRoles?.length ?? 0) > 0;
  
  // Преобразуем статус команды в понятное название и определяем цвет
  const getStatusInfo = (status: Team['status']) => {
    const statuses = {
      forming: { text: 'Набор участников', variant: 'warning' as const },
      complete: { text: 'Полный состав', variant: 'secondary' as const },
      approved: { text: 'Одобрена', variant: 'success' as const },
      rejected: { text: 'Отклонена', variant: 'error' as const }
    };
    return statuses[status] || { text: 'Неизвестный статус', variant: 'neutral' as const };
  };
  
  const statusInfo = getStatusInfo(team.status);
  
  const handleClick = () => {
    navigate(`/competitions/${competitionId}/teams/${team.id}`);
  };
  
  const handleJoinRequest = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onJoinRequest && !isMember) {
      onJoinRequest(team.id);
    }
  };

  return (
    <Card 
      className="hover:border-primary-300 transition-all duration-200" 
      hoverable 
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
          {team.members.length > 0 && (
            <div className="flex items-center text-neutral-700 text-sm">
              <Users className="h-4 w-4 mr-1" />
              <span>{team.members.length} {team.members.length === 1 ? 'участник' : 
                    team.members.length < 5 ? 'участника' : 'участников'}</span>
            </div>
          )}
        </div>
        <CardTitle className="line-clamp-2">{team.name}</CardTitle>
      </CardHeader>
      
      <CardContent>
        {team.members.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Состав команды:</h4>
            <ul className="space-y-1">
              {team.members.map((member) => (
                <li key={member.userId} className="flex items-center text-sm">
                  {member.isCapitain && <span className="text-primary-600 font-medium mr-1">★</span>}
                  <span>{member.firstName} {member.lastName}</span>
                  {member.role && <span className="text-neutral-500 ml-1">({member.role})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {team.requiredRoles && team.requiredRoles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Требуются:</h4>
            <div className="flex flex-wrap gap-1">
              {team.requiredRoles.map((role, index) => (
                <Badge key={index} variant="primary" size="sm">{role}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <div className="w-full">
          {canJoin ? (
            <Button 
              variant="primary" 
              size="sm" 
              fullWidth 
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={handleJoinRequest}
            >
              Подать заявку
            </Button>
          ) : isMember ? (
            <div className="flex items-center text-success-600 text-sm">
              <Check className="h-4 w-4 mr-1" />
              <span>Вы участник команды</span>
            </div>
          ) : team.status === 'forming' ? (
            <div className="text-neutral-500 text-sm italic text-center">
              Для присоединения войдите в систему
            </div>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
};

export default TeamCard;