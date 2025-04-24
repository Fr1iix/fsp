import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Calendar,
  MapPin,
  Users,
  Award,
  ArrowLeft,
  Plus,
  UserPlus,
  Clock,
  Info,
  AlertTriangle,
  Medal,
  Star,
  FileText,
  Share2,
  Timer,
  ChevronRight,
  Bookmark,
  User,
  Home
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import {
  CompetitionFormat,
  CompetitionDiscipline,
  CompetitionStatus
} from '../types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import CompetitionResults from '../components/CompetitionResults';
import CompetitionResultForm from '../components/CompetitionResultForm';
import api from '../utils/api';

// CSS стили для анимаций и визуальных эффектов
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.4s ease-out forwards;
  }
  .animate-item {
    opacity: 0;
    transform: translateY(10px);
    animation: fadeIn 0.5s ease-out forwards;
  }
  .animate-delay-1 { animation-delay: 0.1s; }
  .animate-delay-2 { animation-delay: 0.2s; }
  .animate-delay-3 { animation-delay: 0.3s; }
  .glass-card {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  .card-hover-effect {
    transition: all 0.3s ease;
  }
  .card-hover-effect:hover {
    transform: translateY(-5px);
  }
`;

// Определяем интерфейс для данных, которые приходят с сервера
interface CompetitionAPIData {
  id: string;
  name: string;
  discription: string;
  disciplineId?: string;
  format?: string;
  type?: string;
  startdate?: string;
  enddate?: string;
  startdate_cometition?: string;
  enddate_cometition?: string;
  maxParticipants?: number;
  status?: string;
  AddressId?: number;
  regionId?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Расширяем интерфейс для использования в компоненте
interface Competition {
  id: string;
  title: string;
  description: string;
  discipline: CompetitionDiscipline;
  format: CompetitionFormat;
  startDate: string;
  endDate: string;
  registrationStart: string | undefined;
  registrationEnd: string | undefined;
  status: CompetitionStatus;
  region?: string[];
  maxParticipants?: number;
  venue?: string;
}

const CompetitionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantsCount, setParticipantsCount] = useState<number>(0);
  const [teamsCount, setTeamsCount] = useState<number>(0);

  // Безопасное приведение значений из API к нужным типам
  const safeAsDiscipline = (value?: string): CompetitionDiscipline => {
    const validDisciplines: CompetitionDiscipline[] = ['product', 'security', 'algorithm', 'robotics', 'drones'];
    return validDisciplines.includes(value as CompetitionDiscipline)
      ? (value as CompetitionDiscipline)
      : 'product';
  };

  const safeAsFormat = (value?: string): CompetitionFormat => {
    const validFormats: CompetitionFormat[] = ['open', 'regional', 'federal'];
    return validFormats.includes(value as CompetitionFormat)
      ? (value as CompetitionFormat)
      : 'open';
  };

  const safeAsStatus = (value?: string): CompetitionStatus => {
    const validStatuses: CompetitionStatus[] = ['draft', 'registration', 'in_progress', 'completed', 'cancelled'];
    return validStatuses.includes(value as CompetitionStatus)
      ? (value as CompetitionStatus)
      : 'registration';
  };

  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Начинаем загрузку данных соревнования ID:', id);

        // Используем новый API-клиент
        const competitionData: CompetitionAPIData = await api.competitions.getOne(id!);
        console.log('Полученные данные соревнования:', competitionData);

        if (!competitionData) {
          console.error('Полученные данные пусты');
          setError('Не удалось загрузить информацию о соревновании - данные отсутствуют');
          setLoading(false);
          return;
        }

        // Преобразуем данные в нужный формат, если необходимо
        const formattedData: Competition = {
          id: competitionData.id,
          title: competitionData.name || 'Без названия',
          description: competitionData.discription || '',
          discipline: safeAsDiscipline(competitionData.disciplineId),
          format: safeAsFormat(competitionData.format),
          startDate: competitionData.startdate || new Date().toISOString(),
          endDate: competitionData.enddate || new Date().toISOString(),
          registrationStart: competitionData.startdate_cometition || undefined,
          registrationEnd: competitionData.enddate_cometition || undefined,
          status: safeAsStatus(competitionData.status),
          region: competitionData.regionId ? [competitionData.regionId.toString()] : [],
          maxParticipants: competitionData.maxParticipants
        };

        console.log('Форматированные данные:', formattedData);
        setCompetition(formattedData);

        // Получаем статистику участников и команд с использованием нового API
        try {
          const statsData = await api.competitions.getStats(id!);
          console.log('Данные статистики:', statsData);
          if (statsData) {
            setParticipantsCount(statsData.participantsCount || 0);
            setTeamsCount(statsData.teamsCount || 0);
          }
        } catch (statsErr) {
          console.warn('Не удалось загрузить статистику', statsErr);
        }

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
      product: {
        name: 'Продуктовое',
        variant: 'primary',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: <Star className="h-4 w-4" />
      },
      security: {
        name: 'Безопасность',
        variant: 'error',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: <AlertTriangle className="h-4 w-4" />
      },
      algorithm: {
        name: 'Алгоритмическое',
        variant: 'secondary',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        icon: <FileText className="h-4 w-4" />
      },
      robotics: {
        name: 'Робототехника',
        variant: 'success',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: <Info className="h-4 w-4" />
      },
      drones: {
        name: 'БПЛА',
        variant: 'warning',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: <Share2 className="h-4 w-4" />
      },
    };
    return info[discipline] || {
      name: 'Другое',
      variant: 'neutral',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: <Info className="h-4 w-4" />
    };
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
    const regStart = competition.registrationStart ? new Date(competition.registrationStart) : null;
    const regEnd = competition.registrationEnd ? new Date(competition.registrationEnd) : null;

    if (competition.status === 'cancelled') {
      return {
        text: 'Отменено',
        variant: 'error',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: <AlertTriangle className="h-4 w-4" />,
        progress: 0
      };
    }

    if (now > end) {
      return {
        text: 'Завершено',
        variant: 'neutral',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: <Medal className="h-4 w-4" />,
        progress: 100
      };
    }

    if (now >= start && now <= end) {
      const total = end.getTime() - start.getTime();
      const current = now.getTime() - start.getTime();
      const progress = Math.round((current / total) * 100);

      return {
        text: 'Проходит сейчас',
        variant: 'primary',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: <Timer className="h-4 w-4" />,
        progress
      };
    }

    if (regStart && regEnd && now >= regStart && now <= regEnd) {
      const total = regEnd.getTime() - regStart.getTime();
      const current = now.getTime() - regStart.getTime();
      const progress = Math.round((current / total) * 100);

      return {
        text: 'Регистрация открыта',
        variant: 'success',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: <UserPlus className="h-4 w-4" />,
        progress
      };
    }

    if (regStart && now < regStart) {
      return {
        text: 'Ожидается',
        variant: 'warning',
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: <Clock className="h-4 w-4" />,
        progress: 0
      };
    }

    return {
      text: 'Регистрация закрыта',
      variant: 'neutral',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      icon: <Clock className="h-4 w-4" />,
      progress: 0
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            <div className="absolute inset-3 border-t-4 border-blue-300 border-solid rounded-full animate-spin animate-delay-150"></div>
          </div>
          <p className="text-gray-700 font-medium">Загрузка соревнования...</p>
        </div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate('/competitions')}
              className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span>К списку соревнований</span>
            </button>
          </div>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {error || 'Соревнование не найдено'}
              </h2>
              <p className="text-gray-600 max-w-md mx-auto mb-8">
                Мы не смогли найти информацию о запрашиваемом соревновании. Возможно, оно было удалено или у вас нет к нему доступа.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                  onClick={() => navigate('/competitions')}
                  className="w-full sm:w-auto"
                >
                  Вернуться к списку
                </Button>
                <Button
                  variant="primary"
                  onClick={() => window.location.reload()}
                  className="w-full sm:w-auto"
                >
                  Попробовать снова
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const disciplineInfo = getDisciplineInfo(competition.discipline);
  const formatName = getFormatName(competition.format);
  const statusInfo = getStatusInfo(competition);
  const isOrganizer = user?.role === 'fsp';
  const isRegional = user?.role === 'regional';
  const canAddResults = isOrganizer || isRegional;
  const isRegistrationOpen = statusInfo.text === 'Регистрация открыта';
  const isCompetitionActive = statusInfo.text === 'Проходит сейчас';
  const isCompetitionFinished = statusInfo.text === 'Завершено';

  const handleParticipateClick = () => {
    navigate(`/competitions/${id}/participate`);
  };

  const refreshResults = () => {
    // Обновить результаты на странице
    const resultsComponent = document.querySelector('[data-results-component]');
    if (resultsComponent) {
      const event = new CustomEvent('refreshResults');
      resultsComponent.dispatchEvent(event);
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Не указано';
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: ru });
    } catch (error) {
      console.error('Ошибка форматирования даты:', error);
      return 'Неверный формат';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навигация */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/competitions')}
                className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Home className="h-5 w-5" />
              </button>
              <div className="hidden md:flex items-center">
                <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
                <span className="text-sm text-gray-500">Соревнования</span>
                <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
                <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                  {competition.title}
                </span>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-4">
                {isRegistrationOpen && (
                  <Button
                    variant="primary"
                    leftIcon={<UserPlus className="h-4 w-4" />}
                    onClick={handleParticipateClick}
                    size="sm"
                    className="hidden md:flex"
                  >
                    Принять участие
                  </Button>
                )}
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок страницы */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${disciplineInfo.bgColor} ${disciplineInfo.color}`}>
              {disciplineInfo.icon}
              <span className="ml-1.5">{disciplineInfo.name}</span>
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {formatName}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
              {statusInfo.icon}
              <span className="ml-1.5">{statusInfo.text}</span>
            </span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{competition.title}</h1>

          {statusInfo.progress !== undefined && statusInfo.progress > 0 && statusInfo.progress < 100 && (
            <div className="mb-5">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Прогресс</span>
                <span className="text-gray-600">{statusInfo.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${statusInfo.variant === 'primary' ? 'bg-blue-500' :
                    statusInfo.variant === 'success' ? 'bg-green-500' :
                      statusInfo.variant === 'warning' ? 'bg-orange-500' :
                        statusInfo.variant === 'error' ? 'bg-red-500' :
                          'bg-gray-500'
                    }`}
                  style={{ width: `${statusInfo.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {isRegistrationOpen && user && (
            <div className="mt-6 md:hidden">
              <Button
                variant="primary"
                leftIcon={<UserPlus className="h-5 w-5" />}
                onClick={handleParticipateClick}
                className="w-full"
              >
                Принять участие
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основное содержимое */}
          <div className="lg:col-span-2 space-y-8">
            {/* О соревновании */}
            <section className="bg-white/100 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">О соревновании</h2>
              </div>
              <div className="px-6 py-5">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {competition.description}
                </p>
              </div>
            </section>

            {/* Ключевая информация */}
            <section className="bg-white/100 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Детали</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                <div className="px-6 py-5">
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    Расписание
                  </h3>
                  <p className="text-gray-900 font-medium">
                    {formatDate(competition.startDate)} — {formatDate(competition.endDate)}
                  </p>
                  {competition.registrationStart && competition.registrationEnd && (
                    <div className="mt-3 text-sm text-gray-600">
                      <p className="font-medium text-gray-500 mb-1">Регистрация:</p>
                      <p>{formatDate(competition.registrationStart)} —</p>
                      <p>{formatDate(competition.registrationEnd)}</p>
                    </div>
                  )}
                </div>

                {competition.region && competition.region.length > 0 && (
                  <div className="px-6 py-5">
                    <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      Местоположение
                    </h3>
                    <p className="text-gray-900 font-medium">
                      {competition.region.join(', ')}
                    </p>
                    {competition.venue && (
                      <div className="mt-3 text-sm text-gray-600">
                        <p className="font-medium text-gray-500 mb-1">Место проведения:</p>
                        <p>{competition.venue}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="px-6 py-5">
                  <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    Участники
                  </h3>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-gray-900 mr-2">
                      {participantsCount}
                    </span>
                    <span className="text-gray-600">
                      {getNumEnding(participantsCount, ['участник', 'участника', 'участников'])}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {teamsCount > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="font-medium mr-2">{teamsCount}</span>
                        <span>{getNumEnding(teamsCount, ['команда', 'команды', 'команд'])}</span>
                      </div>
                    )}
                    {competition.maxParticipants && (
                      <div className="text-sm text-gray-600">
                        Макс. участников: <span className="font-medium">{competition.maxParticipants}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Результаты соревнования */}
            <section className="bg-white/100 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200 flex items-center">
                <Award className="h-5 w-5 mr-2 text-yellow-500" />
                <h2 className="text-lg font-medium text-gray-900">Результаты соревнования</h2>
              </div>
              <div>
                <CompetitionResults competitionId={id!} />
              </div>
            </section>
          </div>

          {/* Боковая панель */}
          <div>
            {canAddResults && (isCompetitionActive || isCompetitionFinished) && (
              <div className="bg-white/100 rounded-lg shadow overflow-hidden sticky top-20">
                <div className="px-6 py-5 border-b border-gray-200 flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">Добавить результаты</h3>
                </div>
                <div className="p-5">
                  <div className="mb-5">
                    <div className="flex border-b border-gray-200">
                      <button
                        className="pb-3 px-4 font-medium text-sm border-b-2 -mb-px text-blue-600 border-blue-600"
                      >
                        Участники
                      </button>
                    </div>
                  </div>

                  {isOrganizer && (
                    <CompetitionResultForm
                      competitionId={id!}
                      onResultAdded={refreshResults}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Исправим типы в функции getNumEnding
function getNumEnding(number: number, endings: string[]): string {
  const cases = [2, 0, 1, 1, 1, 2];
  return endings[
    number % 100 > 4 && number % 100 < 20
      ? 2
      : cases[number % 10 < 5 ? number % 10 : 5]
  ];
}

export default CompetitionPage; 