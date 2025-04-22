import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, Calendar, MapPin, X, ClipboardList } from 'lucide-react';
import { useCompetitionStore } from '../store/competitionStore.ts';
import { useAuthStore } from '../store/authStore.ts';
import { CompetitionDiscipline, CompetitionFormat } from '../types';
import CompetitionCard from '../components/CompetitionCard.tsx';
import Button from '../components/ui/Button.tsx';
import Input from '../components/ui/Input.tsx';
import Select from '../components/ui/Select.tsx';
import { Card } from '../components/ui/Card.tsx';

const CompetitionListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const { user } = useAuthStore();
  const { competitions, isLoading, error, fetchCompetitions, filters, setFilters } = useCompetitionStore();

  const [searchTerm, setSearchTerm] = useState(queryParams.get('search') || '');
  const [filterOpen, setFilterOpen] = useState(false);

  // Инициализация фильтров из URL-параметров
  useEffect(() => {
    const initialFilters = {
      format: queryParams.get('format') as CompetitionFormat || undefined,
      discipline: queryParams.get('discipline') as CompetitionDiscipline || undefined,
      region: queryParams.get('region') || undefined,
      search: queryParams.get('search') || undefined,
      status: queryParams.get('status') || undefined,
    };

    setFilters(initialFilters);
    fetchCompetitions(initialFilters);
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
    fetchCompetitions({});
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
    fetchCompetitions(updatedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 pt-24">
      <h1 className="text-3xl font-bold mb-8">Соревнования</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Поиск соревнований..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            fullWidth
          />
        </form>

        <div className="flex gap-2">
          <Button
            variant={filterOpen ? 'primary' : 'outline'}
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            Фильтры
          </Button>

          {user && user.role === 'fsp' && (
            <Button
              variant="accent"
              leftIcon={<ClipboardList className="h-4 w-4" />}
              onClick={() => navigate('/competition/requests')}
            >
              Посмотреть заявки
            </Button>
          )}
        </div>
      </div>

      {filterOpen && (
        <Card className="mb-8 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            />

            {hasActiveFilters && (
              <Button
                variant="outline"
                leftIcon={<X className="h-4 w-4" />}
                onClick={clearFilters}
                className="md:col-span-3"
              >
                Сбросить все фильтры
              </Button>
            )}
          </div>
        </Card>
      )}

      {error && (
        <div className="bg-error-50 text-error-700 p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
        </div>
      ) : competitions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((competition) => (
            <CompetitionCard key={competition.id} competition={competition} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/95 rounded-lg shadow-xl">
          <p className="text-xl text-neutral-600 mb-4">
            Соревнования не найдены
          </p>
          <p className="text-neutral-500 mb-6">
            Попробуйте изменить параметры фильтрации или создайте новое соревнование
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              leftIcon={<X className="h-4 w-4" />}
              onClick={clearFilters}
            >
              Сбросить все фильтры
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default CompetitionListPage;