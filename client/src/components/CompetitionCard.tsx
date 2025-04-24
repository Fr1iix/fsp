import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar, Users, MapPin, Clock, ChevronRight } from 'lucide-react';
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

  // Вычисляем оставшееся время до конца регистрации
  const getRegistrationTimeLeft = () => {
    if (!competition.registrationEnd) return null;

    const now = new Date();
    const endDate = new Date(competition.registrationEnd);
    const diffTime = Math.abs(endDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
      return `${Math.floor(diffDays / 30)} мес.`;
    } else if (diffDays > 0) {
      return `${diffDays} дн.`;
    } else {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      return `${diffHours} ч.`;
    }
  };

  const handleClick = () => {
    navigate(`/competitions/${competition.id}`);
  };

  const handleParticipateClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем переход по карточке
    navigate(`/competitions/${competition.id}/participate`);
  };

  const disciplineInfo = getDisciplineInfo(competition.discipline);

  return (
    <Card
      className="group overflow-hidden border border-neutral-200 hover:border-primary-300 transition-all duration-300 hover:shadow-md bg-white relative"
      hoverable
      onClick={handleClick}
    >
      {/* Цветная полоса сверху карточки в зависимости от дисциплины */}
      <div className={`h-1.5 w-full bg-${disciplineInfo.variant}-500`}></div>

      <CardHeader className="px-6 pt-6 pb-3">
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant={disciplineInfo.variant} className="font-medium text-xs px-2 py-0.5">
            {disciplineInfo.name}
          </Badge>
          <Badge variant="secondary" className="font-medium text-xs px-2 py-0.5">
            {getFormatName(competition.format)}
          </Badge>
          <Badge variant={statusVariant} className="font-medium text-xs px-2 py-0.5">
            {statusText}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2 text-xl font-bold text-gray-800 group-hover:text-primary-700 transition-colors">
          {competition.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-6 pb-3">
        <p className="text-neutral-600 mb-4 line-clamp-2 text-sm">{competition.description}</p>

        <div className="space-y-2.5 text-sm">
          <div className="flex items-center text-neutral-700">
            <Calendar className="h-4 w-4 min-w-4 text-primary-500 mr-2.5" />
            <span>
              {format(new Date(competition.startDate), 'd MMMM yyyy', { locale: ru })}
            </span>
          </div>

          {competition.registrationEnd && isRegistrationOpen && (
            <div className="flex items-center text-neutral-700">
              <Clock className="h-4 w-4 min-w-4 text-primary-500 mr-2.5" />
              <span>
                Регистрация закроется через {getRegistrationTimeLeft()}
              </span>
            </div>
          )}

          {competition.region && competition.region.length > 0 && (
            <div className="flex items-center text-neutral-700">
              <MapPin className="h-4 w-4 min-w-4 text-primary-500 mr-2.5" />
              <span className="truncate">
                {competition.region.join(', ')}
              </span>
            </div>
          )}

          {competition.maxParticipants && (
            <div className="flex items-center text-neutral-700">
              <Users className="h-4 w-4 min-w-4 text-primary-500 mr-2.5" />
              <span>
                Макс. участников: {competition.maxParticipants}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 px-6 pb-6 border-t border-neutral-100 flex items-center justify-between">
        {isRegistrationOpen && user ? (
          <Button
            variant="primary"
            size="sm"
            className="w-full font-medium"
            onClick={handleParticipateClick}
          >
            Принять участие
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-primary-700 border-primary-300 font-medium"
            onClick={handleClick}
          >
            Подробнее <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Button>
        )}
      </CardFooter>

      {/* Индикатор бейджа популярности или срочности в углу */}
      {isRegistrationOpen && competition.registrationEnd && new Date(competition.registrationEnd).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 && (
        <div className="absolute top-0 right-0 -mr-12 -mt-1 transform rotate-45 bg-error-500 text-white text-xs py-1 w-40 text-center shadow-md">
          Скоро закроется
        </div>
      )}
    </Card>
  );
};

export default CompetitionCard;