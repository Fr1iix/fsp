import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, Calendar, MapPin, X, ClipboardList, Users, ArrowRight } from 'lucide-react';
import { competitionAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore.ts';
import { Competition, CompetitionDiscipline, CompetitionFormat } from '../types';
import Button from '../components/ui/Button.tsx';
import Input from '../components/ui/Input.tsx';
import Select from '../components/ui/Select.tsx';
import { Card, CardContent } from '../components/ui/Card.tsx';

// Адаптер для преобразования данных сервера в формат фронтенда
const adaptCompetition = (serverCompetition: any): Competition => {
  console.log('Обрабатываем соревнование с сервера:', serverCompetition);

  // Проверка наличия необходимых полей
  if (!serverCompetition || !serverCompetition.id) {
    console.error('Получено некорректное соревнование:', serverCompetition);
    throw new Error('Некорректные данные соревнования');
  }

  const result = {
    id: serverCompetition.id.toString(),
    title: serverCompetition.name || 'Без названия',
    description: serverCompetition.discription || 'Без описания',
    format: serverCompetition.format as CompetitionFormat || 'regional',
    discipline: serverCompetition.type as CompetitionDiscipline || 'product',
    registrationStart: serverCompetition.startdate || new Date().toISOString(),
    registrationEnd: serverCompetition.enddate || new Date().toISOString(),
    startDate: serverCompetition.startdate_cometition || serverCompetition.startdate || new Date().toISOString(),
    endDate: serverCompetition.enddate_cometition || serverCompetition.enddate || new Date().toISOString(),
    status: mapServerStatus(serverCompetition.status),
    createdBy: serverCompetition.createdBy || '',
    region: serverCompetition.regionId ? [serverCompetition.regionId.toString()] : [],
    maxParticipants: serverCompetition.maxParticipants || 0,
    createdAt: serverCompetition.createdAt || new Date().toISOString(),
    updatedAt: serverCompetition.updatedAt || new Date().toISOString()
  };

  console.log('Преобразованное соревнование:', result);
  return result;
};

// Преобразование статуса с сервера в формат фронтенда
const mapServerStatus = (serverStatus: string): "draft" | "registration" | "in_progress" | "completed" | "cancelled" => {
  const statusMap: Record<string, any> = {
    'Регистрация открыта': 'registration',
    'В процессе': 'in_progress',
    'Завершено': 'completed',
    'Отменено': 'cancelled',
    'Черновик': 'draft'
  };

  return statusMap[serverStatus] || 'registration';
};

interface FilterState {
  format?: CompetitionFormat;
  discipline?: CompetitionDiscipline;
  region?: string;
  search?: string;
  status?: string;
}

const CompetitionListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const { user } = useAuthStore();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    format: queryParams.get('format') as CompetitionFormat || undefined,
    discipline: queryParams.get('discipline') as CompetitionDiscipline || undefined,
    region: queryParams.get('region') || undefined,
    search: queryParams.get('search') || undefined,
    status: queryParams.get('status') || undefined,
  });

  const [searchTerm, setSearchTerm] = useState(queryParams.get('search') || '');
  const [filterOpen, setFilterOpen] = useState(true); // По умолчанию фильтры открыты

  // Загрузка соревнований
  useEffect(() => {
    const fetchCompetitions = async () => {
      setIsLoading(true);
      try {
        console.log('Запрос на получение соревнований...');
        const response = await competitionAPI.getAll();
        console.log('Ответ API:', response);

        // Проверяем, что получили массив данных
        if (!Array.isArray(response)) {
          console.error('API вернул не массив:', response);
          setError('Неверный формат данных от API');
          setCompetitions([]);
          setIsLoading(false);
          return;
        }

        console.log('Количество соревнований в ответе:', response.length);

        // Преобразуем данные с сервера в формат фронтенда
        let adaptedCompetitions = [];
        try {
          adaptedCompetitions = response.map(comp => adaptCompetition(comp));
        } catch (adaptError) {
          console.error('Ошибка при преобразовании данных:', adaptError);
          setError('Ошибка при обработке данных');
          setCompetitions([]);
          setIsLoading(false);
          return;
        }

        console.log('Преобразованные соревнования:', adaptedCompetitions);
        setCompetitions(adaptedCompetitions);
        setError(null);
      } catch (err: any) {
        console.error('Ошибка при загрузке соревнований:', err);
        if (err.response) {
          console.error('Статус ошибки:', err.response.status);
          console.error('Данные ошибки:', err.response.data);
        }
        setError(err.response?.data?.message || 'Не удалось загрузить соревнования');
        setCompetitions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompetitions();
  }, [location.search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilter({ search: searchTerm });
  };

  const handleFilterChange = (name: string, value: string) => {
    applyFilter({ [name]: value === 'all' ? undefined : value });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({});
    navigate('/competitions');
  };

  const applyFilter = (newFilter: Record<string, string | undefined>) => {
    const updatedFilters = { ...filters, ...newFilter };
    setFilters(updatedFilters);

    // Обновляем URL
    const params = new URLSearchParams();
    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    navigate(`/competitions?${params.toString()}`);
  };

  // Фильтрация соревнований
  const filteredCompetitions = competitions.filter(comp => {
    // Фильтр по поисковому запросу
    if (filters.search && !comp.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    // Фильтр по формату
    if (filters.format && comp.format !== filters.format) {
      return false;
    }

    // Фильтр по дисциплине
    if (filters.discipline && comp.discipline !== filters.discipline) {
      return false;
    }

    // Фильтр по статусу
    if (filters.status && comp.status !== filters.status) {
      return false;
    }

    return true;
  });

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined);

  // Функция для перехода к детальной странице соревнования
  const handleCompetitionClick = (id: string) => {
    navigate(`/competitions/${id}`);
  };

  // Функция для получения форматированной даты
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Получение бейджа для статуса соревнования
  const getStatusBadge = (status: string) => {
    const statusClasses = {
      registration: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      draft: 'bg-yellow-100 text-yellow-800',
    } as Record<string, string>;

    const statusNames = {
      registration: 'Регистрация открыта',
      in_progress: 'Проходит',
      completed: 'Завершено',
      cancelled: 'Отменено',
      draft: 'Черновик',
    } as Record<string, string>;

    const className = statusClasses[status] || statusClasses.draft;
    const displayName = statusNames[status] || 'Неизвестно';

    return (
      <span className={`${className} px-2 py-1 rounded-full text-xs font-medium`}>
        {displayName}
      </span>
    );
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 pt-24">
      <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Соревнования</h1>
      <p className="text-neutral-500 mb-8">Найдите интересующие вас соревнования и примите участие</p>

      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Input
              placeholder="Поиск соревнований..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 rounded-lg border-neutral-200 focus:border-primary-500 shadow-sm"
            />
            <button type="submit" className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-primary-500 transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </div>
        </form>

        <div className="flex gap-2">
          <Button
            variant={filterOpen ? 'primary' : 'outline'}
            onClick={() => setFilterOpen(!filterOpen)}
            className="shadow-sm hover:shadow transition-shadow"
          >
            <Filter className="h-4 w-4 mr-2" />
            Фильтры
          </Button>

          {user && user.role === 'fsp' && (
            <Button
              variant="accent"
              onClick={() => navigate('/competition/requests')}
              className="shadow-sm hover:shadow-md transition-all"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Заявки
            </Button>
          )}
        </div>
      </div>

      {filterOpen && (
        <Card className="mb-8 overflow-hidden border-none shadow-md transition-all">
          <CardContent className="p-6 bg-white/80 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Select
                label="Формат"
                value={filters.format || 'all'}
                onChange={(e) => handleFilterChange('format', e.target.value)}
                options={[
                  { value: 'all', label: 'Все форматы' },
                  { value: 'open', label: 'Открытые' },
                  { value: 'regional', label: 'Региональные' },
                  { value: 'federal', label: 'Федеральные' },
                ]}
                className="rounded-lg border-neutral-200 focus:border-primary-500 shadow-sm"
              />

              <Select
                label="Дисциплина"
                value={filters.discipline || 'all'}
                onChange={(e) => handleFilterChange('discipline', e.target.value)}
                options={[
                  { value: 'all', label: 'Все дисциплины' },
                  { value: 'product', label: 'Продуктовое программирование' },
                  { value: 'security', label: 'Информационная безопасность' },
                  { value: 'algorithm', label: 'Алгоритмическое программирование' },
                  { value: 'robotics', label: 'Робототехника' },
                  { value: 'drones', label: 'БПЛА' },
                ]}
                className="rounded-lg border-neutral-200 focus:border-primary-500 shadow-sm"
              />

              <Select
                label="Статус"
                value={filters.status || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={[
                  { value: 'all', label: 'Все статусы' },
                  { value: 'registration', label: 'Регистрация открыта' },
                  { value: 'in_progress', label: 'Проходит сейчас' },
                  { value: 'completed', label: 'Завершенные' },
                ]}
                className="rounded-lg border-neutral-200 focus:border-primary-500 shadow-sm"
              />

              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="md:col-span-3 mt-2"
                >
                  <X className="h-4 w-4 mr-2" />
                  Сбросить все фильтры
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="mb-6 p-4 bg-error-50 border border-error-100 rounded-lg text-error-700 shadow-sm">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
        </div>
      ) : filteredCompetitions.length > 0 ? (
        <div className="flex flex-col gap-8">
          {filteredCompetitions.map((competition) => (
            <div
              key={competition.id}
              className="group bg-white/100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-neutral-100 hover:border-primary-100 hover:bg-primary-50/10"
              onClick={() => handleCompetitionClick(competition.id)}
            >
              <div className="flex flex-col md:flex-row">
                <div className="relative w-full md:w-80 h-56 md:h-auto bg-gradient-to-r from-primary-100 to-primary-50 flex items-end">
                  <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 sm:flex-row">
                    {/* Форматирование бейджа статуса */}
                    <div className={`
                      px-3 py-1.5 rounded-full text-xs font-medium shadow-md 
                      ${competition.status === 'registration' ? 'bg-green-500 text-white' :
                        competition.status === 'in_progress' ? 'bg-blue-500 text-white' :
                          competition.status === 'completed' ? 'bg-neutral-500 text-white' :
                            competition.status === 'cancelled' ? 'bg-red-500 text-white' :
                              'bg-amber-500 text-white'}
                    `}>
                      {competition.status === 'registration' ? 'Регистрация открыта' :
                        competition.status === 'in_progress' ? 'Проходит' :
                          competition.status === 'completed' ? 'Завершено' :
                            competition.status === 'cancelled' ? 'Отменено' :
                              'Черновик'}
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 flex gap-2 z-10">
                    {/* Бейдж формата */}
                    <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm shadow-md text-primary-700 border border-primary-50">
                      {competition.format === 'open' ? 'Открытое' :
                        competition.format === 'regional' ? 'Региональное' :
                          competition.format === 'federal' ? 'Федеральное' : 'Другое'}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-full py-4 px-6 bg-gradient-to-r from-primary-600/90 to-accent-600/90 text-white relative z-10 group-hover:from-primary-700/90 group-hover:to-accent-700/90 transition-colors">
                    <div className="text-sm font-medium uppercase tracking-wider">
                      {competition.discipline === 'product' ? 'Продуктовое программирование' :
                        competition.discipline === 'security' ? 'Информационная безопасность' :
                          competition.discipline === 'algorithm' ? 'Алгоритмическое программирование' :
                            competition.discipline === 'robotics' ? 'Робототехника' :
                              competition.discipline === 'drones' ? 'БПЛА' : 'Другое'}
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-neutral-800 group-hover:text-primary-600 transition-colors">{competition.title}</h3>
                  <p className="text-neutral-600 mb-6 md:mb-8 leading-relaxed">{competition.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 text-sm text-neutral-600">
                    <div className="flex items-center bg-neutral-50 p-3 rounded-lg group-hover:bg-white transition-colors">
                      <Calendar className="h-5 w-5 mr-3 text-primary-500" />
                      <div>
                        <div className="font-semibold text-neutral-700">Дата начала</div>
                        <div>{formatDate(competition.startDate)}</div>
                      </div>
                    </div>

                    {competition.region && competition.region.length > 0 && (
                      <div className="flex items-center bg-neutral-50 p-3 rounded-lg group-hover:bg-white transition-colors">
                        <MapPin className="h-5 w-5 mr-3 text-primary-500" />
                        <div>
                          <div className="font-semibold text-neutral-700">Регион</div>
                          <div>{competition.region.join(', ')}</div>
                        </div>
                      </div>
                    )}

                    {competition.maxParticipants && competition.maxParticipants > 0 && (
                      <div className="flex items-center bg-neutral-50 p-3 rounded-lg group-hover:bg-white transition-colors">
                        <Users className="h-5 w-5 mr-3 text-primary-500" />
                        <div>
                          <div className="font-semibold text-neutral-700">Участников</div>
                          <div>до {competition.maxParticipants}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 md:mt-8 pt-4 border-t border-neutral-100 flex justify-end">
                    <div className="text-primary-600 font-medium flex items-center group-hover:translate-x-1 transition-transform">
                      <span className="bg-primary-500 text-white px-4 md:px-5 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center">
                        Подробнее
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-neutral-100">
          <div className="inline-flex justify-center items-center w-20 h-20 rounded-full bg-neutral-100 mb-6">
            <Search className="h-10 w-10 text-neutral-400" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-700 mb-3">
            Соревнования не найдены
          </h2>
          <p className="text-neutral-500 mb-8 max-w-md mx-auto">
            Попробуйте изменить параметры фильтрации или создайте новое соревнование
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="shadow-sm hover:shadow-md px-6 py-2"
            >
              <X className="h-4 w-4 mr-2" />
              Сбросить все фильтры
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CompetitionListPage;