import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar, Users, MapPin } from 'lucide-react';
import { Competition } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card.tsx';
import Badge from './ui/Badge.tsx';

interface CompetitionCardProps {
  competition: Competition;
}

const CompetitionCard: React.FC<CompetitionCardProps> = ({ competition }) => {
  const navigate = useNavigate();

  // Преобразуем дисциплину в русское название и определяем цвет бейджа
  const getDisciplineInfo = (discipline: Competition['discipline']) => {
    const info = {
      product: { name: 'Продуктовое', variant: 'primary' as const },
      security: { name: 'Безопасность', variant: 'error' as const },
      algorithm: { name: 'Алгоритмическое', variant: 'secondary' as const },
      robotics: { name: 'Робототехника', variant: 'success' as const },
      drones: { name: 'БПЛА', variant: 'warning' as const },
    };
    return info[discipline] || { name: 'Другое', variant: 'neutral' as const };
  };

  // Преобразуем формат в русское название
  const getFormatName = (format: Competition['format']) => {
    const formats = {
      open: 'Открытое',
      regional: 'Региональное',
      federal: 'Федеральное',
    };
    return formats[format] || 'Другое';
  };

  // Определяем статус соревнования для отображения
  const getStatusInfo = (competition: Competition) => {
    const now = new Date();
    const start = new Date(competition.startDate);
    const end = new Date(competition.endDate);
    const regStart = new Date(competition.registrationStart);
    const regEnd = new Date(competition.registrationEnd);

    if (competition.status === 'cancelled') {
      return { text: 'Отменено', variant: 'error' as const };
    }

    if (now > end) {
      return { text: 'Завершено', variant: 'neutral' as const };
    }

    if (now >= start && now <= end) {
      return { text: 'Проходит сейчас', variant: 'primary' as const };
    }

    if (now >= regStart && now <= regEnd) {
      return { text: 'Регистрация открыта', variant: 'success' as const };
    }

    if (now < regStart) {
      return { text: 'Ожидается', variant: 'warning' as const };
    }

    return { text: 'Регистрация закрыта', variant: 'neutral' as const };
  };

  const disciplineInfo = getDisciplineInfo(competition.discipline);
  const formatName = getFormatName(competition.format);
  const statusInfo = getStatusInfo(competition);

  const handleClick = () => {
    navigate(`/competitions/${competition.id}`);
  };

  return (
    <Card 
      className="hover:border-primary-300 transition-all duration-200" 
      hoverable 
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant={disciplineInfo.variant}>{disciplineInfo.name}</Badge>
          <Badge variant="secondary">{formatName}</Badge>
          <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
        </div>
        <CardTitle className="line-clamp-2">{competition.title}</CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-neutral-600 mb-4 line-clamp-3">{competition.description}</p>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-neutral-700">
            <Calendar className="h-4 w-4 mr-2" />
            <span>
              {format(new Date(competition.startDate), 'd MMMM yyyy', { locale: ru })}
            </span>
          </div>
          
          {competition.region && competition.region.length > 0 && (
            <div className="flex items-center text-neutral-700">
              <MapPin className="h-4 w-4 mr-2" />
              <span>
                {competition.region.join(', ')}
              </span>
            </div>
          )}
          
          {competition.maxParticipants && (
            <div className="flex items-center text-neutral-700">
              <Users className="h-4 w-4 mr-2" />
              <span>
                Макс. участников: {competition.maxParticipants}
              </span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="text-xs text-neutral-500">
          Начало регистрации: {format(new Date(competition.registrationStart), 'd MMMM', { locale: ru })}
          {' • '} 
          Завершение регистрации: {format(new Date(competition.registrationEnd), 'd MMMM', { locale: ru })}
        </div>
      </CardFooter>
    </Card>
  );
};

export default CompetitionCard;