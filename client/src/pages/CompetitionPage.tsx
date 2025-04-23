import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar, MapPin, Users, Award, ArrowLeft, Plus, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Competition } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import CompetitionResults from '../components/CompetitionResults';
import CompetitionResultForm from '../components/CompetitionResultForm';
import api from '../utils/api';

const CompetitionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/competitions/${id}`);
        setCompetition(response.data);
      } catch (err) {
        console.error('Error fetching competition:', err);
        setError('Не удалось загрузить информацию о соревновании');
      } finally {
        setLoading(false);
      }
    };

    fetchCompetition();
  }, [id]);

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

  const getFormatName = (format: Competition['format']) => {
    const formats = {
      open: 'Открытое',
      regional: 'Региональное',
      federal: 'Федеральное',
    };
    return formats[format] || 'Другое';
  };

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

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8 pt-24">
        <div className="flex justify-center py-16">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8 pt-24">
        <div className="text-center py-16">
          <p className="text-xl text-neutral-600 mb-4">{error || 'Соревнование не найдено'}</p>
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/competitions')}
          >
            Вернуться к списку соревнований
          </Button>
        </div>
      </div>
    );
  }

  const disciplineInfo = getDisciplineInfo(competition.discipline);
  const formatName = getFormatName(competition.format);
  const statusInfo = getStatusInfo(competition);
  const isOrganizer = user?.role === 'fsp' || user?.role === 'regional';
  const isRegistrationOpen = statusInfo.text === 'Регистрация открыта';

  const handleParticipateClick = () => {
    navigate(`/competitions/${id}/participate`);
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 pt-24">
      <div className="mb-8">
        <Button
          variant="outline"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/competitions')}
          className="mb-4"
        >
          Вернуться к списку соревнований
        </Button>

        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant={disciplineInfo.variant}>{disciplineInfo.name}</Badge>
          <Badge variant="secondary">{formatName}</Badge>
          <Badge variant={statusInfo.variant}>{statusInfo.text}</Badge>
        </div>

        <h1 className="text-3xl font-bold mb-4">{competition.title}</h1>
        <p className="text-neutral-600 mb-6">{competition.description}</p>

        {isRegistrationOpen && user && (
          <div className="mb-6">
            <Button
              variant="primary"
              leftIcon={<UserPlus className="h-5 w-5" />}
              onClick={handleParticipateClick}
              className="w-full md:w-auto"
            >
              Принять участие
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="flex items-center text-neutral-700">
            <Calendar className="h-5 w-5 mr-2" />
            <span>
              {format(new Date(competition.startDate), 'd MMMM yyyy', { locale: ru })} -{' '}
              {format(new Date(competition.endDate), 'd MMMM yyyy', { locale: ru })}
            </span>
          </div>

          {competition.region && competition.region.length > 0 && (
            <div className="flex items-center text-neutral-700">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{competition.region.join(', ')}</span>
            </div>
          )}

          {competition.maxParticipants && (
            <div className="flex items-center text-neutral-700">
              <Users className="h-5 w-5 mr-2" />
              <span>Макс. участников: {competition.maxParticipants}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Результаты
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CompetitionResults competitionId={id!} />
            </CardContent>
          </Card>
        </div>

        {isOrganizer && competition.status === 'in_progress' && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Добавить результаты
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CompetitionResultForm 
                  competitionId={id!} 
                  onResultAdded={() => {
                    // Refresh the results component
                    const resultsComponent = document.querySelector('[data-results-component]');
                    if (resultsComponent) {
                      const event = new CustomEvent('refreshResults');
                      resultsComponent.dispatchEvent(event);
                    }
                  }} 
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionPage; 