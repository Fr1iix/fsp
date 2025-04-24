import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { analyticsAPI } from '../utils/api';

// Типы данных
interface Competition {
  id: number;
  name: string;
  discipline: string;
  region: string;
  startdate: string;
  status: string;
}

interface Athlete {
  id: number;
  fullName: string;
  region: string;
  competitionsCount: number;
}

interface Discipline {
  id: number;
  name: string;
}

interface Region {
  id: number;
  name: string;
}

const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'competitions' | 'athletes'>('competitions');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Фильтры
  const [filters, setFilters] = useState({
    disciplineId: '',
    regionId: '',
    startDate: '',
    endDate: '',
    status: ''
  });

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchDisciplines();
    fetchRegions();
    fetchCompetitions();
    fetchAthletes();
  }, []);

  // Загрузка дисциплин
  const fetchDisciplines = async () => {
    try {
      const response = await analyticsAPI.getDisciplines();
      setDisciplines(response);
    } catch (error) {
      console.error('Ошибка при загрузке дисциплин:', error);
      setError('Не удалось загрузить дисциплины');
    }
  };

  // Загрузка регионов
  const fetchRegions = async () => {
    try {
      const response = await analyticsAPI.getRegions();
      setRegions(response);
    } catch (error) {
      console.error('Ошибка при загрузке регионов:', error);
      setError('Не удалось загрузить регионы');
    }
  };

  // Загрузка соревнований с фильтрами
  const fetchCompetitions = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filters.disciplineId) params.disciplineId = filters.disciplineId;
      if (filters.regionId) params.regionId = filters.regionId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;

      const data = await analyticsAPI.getCompetitionsAnalytics(params);
      setCompetitions(data);
    } catch (error) {
      console.error('Ошибка при загрузке соревнований:', error);
      setError('Не удалось загрузить данные о соревнованиях');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка спортсменов с фильтрами
  const fetchAthletes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (filters.regionId) params.regionId = filters.regionId;
      if (filters.disciplineId) params.disciplineId = filters.disciplineId;

      const data = await analyticsAPI.getAthletesAnalytics(params);
      setAthletes(data);
    } catch (error) {
      console.error('Ошибка при загрузке спортсменов:', error);
      setError('Не удалось загрузить данные о спортсменах');
    } finally {
      setLoading(false);
    }
  };

  // Обработка изменения фильтров
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Применение фильтров
  const applyFilters = () => {
    if (activeTab === 'competitions') {
      fetchCompetitions();
    } else {
      fetchAthletes();
    }
    setShowFilters(false);
  };

  // Сброс фильтров
  const resetFilters = () => {
    setFilters({
      disciplineId: '',
      regionId: '',
      startDate: '',
      endDate: '',
      status: ''
    });
    if (activeTab === 'competitions') {
      fetchCompetitions();
    } else {
      fetchAthletes();
    }
  };

  // Экспорт данных
  const exportData = async () => {
    setError(null);
    try {
      const params: any = {
        type: activeTab
      };
      if (filters.disciplineId) params.disciplineId = filters.disciplineId;
      if (filters.regionId) params.regionId = filters.regionId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;

      console.log('Экспорт данных с параметрами:', params);
      
      const blob = await analyticsAPI.exportData(params);
      
      // Проверка, что полученные данные действительно являются Blob
      if (!(blob instanceof Blob)) {
        console.error('Полученные данные не являются Blob:', blob);
        throw new Error('Неверный формат данных для скачивания');
      }
      
      console.log('Получен Blob размером:', blob.size, 'bytes, тип:', blob.type);
      
      // Если размер Blob слишком мал, возможно это сообщение об ошибке
      if (blob.size < 100 && blob.type.includes('json')) {
        const text = await blob.text();
        console.error('Возможная ошибка в Blob:', text);
        try {
          const error = JSON.parse(text);
          throw new Error(error.message || 'Ошибка при экспорте данных');
        } catch (e) {
          throw new Error(`Ошибка при экспорте данных: ${text}`);
        }
      }
      
      // Создаем ссылку для скачивания файла
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Ошибка при экспорте данных:', error);
      setError(error.message || 'Не удалось экспортировать данные');
    }
  };

  // Подготовка данных для графиков
  const prepareChartData = () => {
    if (activeTab === 'competitions') {
      // Данные для графика соревнований по дисциплинам
      const disciplineData = competitions.reduce((acc: any[], comp) => {
        const existing = acc.find(item => item.name === comp.discipline);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ name: comp.discipline, value: 1 });
        }
        return acc;
      }, []);

      // Данные для графика соревнований по статусам
      const statusData = competitions.reduce((acc: any[], comp) => {
        const existing = acc.find(item => item.name === comp.status);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ name: comp.status, value: 1 });
        }
        return acc;
      }, []);

      return { disciplineData, statusData };
    } else {
      // Данные для графика спортсменов по регионам
      const regionData = athletes.reduce((acc: any[], athlete) => {
        const existing = acc.find(item => item.name === athlete.region);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ name: athlete.region, value: 1 });
        }
        return acc;
      }, []);

      return { regionData };
    }
  };

  const chartData = prepareChartData();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="container mx-auto px-4 py-8 mt-16">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-800">Аналитика</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Фильтры
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={resetFilters}
          >
            Сбросить
          </Button>
          <Button
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={exportData}
          >
            Экспорт
          </Button>
        </div>
      </div>

      {/* Сообщение об ошибке */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Фильтры */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-medium mb-4">Фильтры</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Дисциплина</label>
              <select
                name="disciplineId"
                value={filters.disciplineId}
                onChange={handleFilterChange}
                className="w-full p-2 border border-neutral-300 rounded-md"
              >
                <option value="">Все дисциплины</option>
                {disciplines.map(discipline => (
                  <option key={discipline.id} value={discipline.id}>{discipline.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Регион</label>
              <select
                name="regionId"
                value={filters.regionId}
                onChange={handleFilterChange}
                className="w-full p-2 border border-neutral-300 rounded-md"
              >
                <option value="">Все регионы</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>{region.name}</option>
                ))}
              </select>
            </div>
            {activeTab === 'competitions' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Дата начала</label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-neutral-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Дата окончания</label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-neutral-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Статус</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full p-2 border border-neutral-300 rounded-md"
                  >
                    <option value="">Все статусы</option>
                    <option value="Регистрация открыта">Регистрация открыта</option>
                    <option value="Регистрация закрыта">Регистрация закрыта</option>
                    <option value="Завершено">Завершено</option>
                    <option value="Отменено">Отменено</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={applyFilters}>Применить</Button>
          </div>
        </div>
      )}

      {/* Вкладки */}
      <div className="mb-6">
        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('competitions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'competitions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Соревнования
            </button>
            <button
              onClick={() => setActiveTab('athletes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'athletes'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              Спортсмены
            </button>
          </nav>
        </div>
      </div>

      {/* Индикатор загрузки */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      )}

      {/* Графики */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {activeTab === 'competitions' ? (
            <>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium mb-4">Соревнования по дисциплинам</h3>
                <div className="h-80">
                  {chartData.disciplineData && chartData.disciplineData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.disciplineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" name="Количество" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-neutral-500">Нет данных для отображения</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium mb-4">Соревнования по статусам</h3>
                <div className="h-80">
                  {chartData.statusData && chartData.statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.statusData || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {(chartData.statusData || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-neutral-500">Нет данных для отображения</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-4 rounded-lg shadow-sm lg:col-span-2">
              <h3 className="text-lg font-medium mb-4">Спортсмены по регионам</h3>
              <div className="h-80">
                {chartData.regionData && chartData.regionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.regionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#82ca9d" name="Количество" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-neutral-500">Нет данных для отображения</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Таблицы данных */}
      {!loading && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200">
            <h2 className="text-lg font-medium">
              {activeTab === 'competitions' ? 'Список соревнований' : 'Список спортсменов'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            {activeTab === 'competitions' ? (
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Название</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Дисциплина</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Регион</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Дата начала</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Статус</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {competitions.length > 0 ? (
                    competitions.map((competition) => (
                      <tr key={competition.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{competition.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{competition.discipline}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{competition.region}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {new Date(competition.startdate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{competition.status}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-neutral-500">
                        Нет данных для отображения
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">ФИО</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Регион</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Количество соревнований</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {athletes.length > 0 ? (
                    athletes.map((athlete) => (
                      <tr key={athlete.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{athlete.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{athlete.region}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{athlete.competitionsCount}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-sm text-neutral-500">
                        Нет данных для отображения
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage; 