import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar, Users, MapPin } from 'lucide-react';
import { Competition } from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card.tsx';
import Badge from './ui/Badge.tsx';
import Button from './ui/Button.tsx';
import { useAuthStore } from '../store/authStore.ts';
import { getActualCompetitionStatus, getStatusName, getStatusColor } from '../utils/helpers';

interface CompetitionCardProps {
  competition: Competition;
}

const CompetitionCard: React.FC<CompetitionCardProps> = ({ competition }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

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

  // Получаем актуальный статус соревнования
  const actualStatus = getActualCompetitionStatus(competition);

  // Получаем русское название статуса и его цвет
  const statusText = getStatusName(actualStatus);
  const statusVariant = getStatusColor(actualStatus) as "primary" | "error" | "secondary" | "success" | "warning" | "neutral";

  // Проверяем, открыта ли регистрация
  const isRegistrationOpen = actualStatus === 'registration';

  const handleClick = () => {
    navigate(`/competitions/${competition.id}`);
  };

  const handleParticipateClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем переход по карточке
    navigate(`/competitions/${competition.id}/participate`);
  };

  return (
    <Card
      className="hover:border-primary-300 transition-all duration-200"
      hoverable
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant={getDisciplineInfo(competition.discipline).variant}>
            {getDisciplineInfo(competition.discipline).name}
          </Badge>
          <Badge variant="secondary">{getFormatName(competition.format)}</Badge>
          <Badge variant={statusVariant}>{statusText}</Badge>
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

      {isRegistrationOpen && user && (
        <CardFooter className="pt-4 border-t border-neutral-100">
          <Button
            variant="primary"
            size="sm"
            className="w-full"
            onClick={handleParticipateClick}
          >
            Принять участие
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default CompetitionCard;