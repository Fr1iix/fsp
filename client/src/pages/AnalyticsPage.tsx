import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Download, Filter, RefreshCw, AlertCircle, BarChart3, Users, LineChart } from 'lucide-react';
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
  const COLORS = ['#6366F1', '#EC4899', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="container mx-auto px-4 py-8 mt-16 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Аналитика</h1>
          <p className="text-gray-500">Анализ данных и статистика</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
            className="transition-all bg-white/100 duration-200 hover:bg-gray-100 hover:border-gray-300"
          >
            Фильтры
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={resetFilters}
            className="transition-all bg-white/100 duration-200 hover:bg-gray-100 hover:border-gray-300"
          >
            Сбросить
          </Button>
          <Button
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={exportData}
            className="bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
          >
            Экспорт
          </Button>
        </div>
      </div>

      {/* Вкладки */}
      <div className="mb-6 bg-white/100 rounded-lg shadow-md p-1">
        <div className="flex">
          <button
            onClick={() => setActiveTab('competitions')}
            className={`flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium flex-1 transition-all duration-200 ${activeTab === 'competitions'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Соревнования
          </button>
          <button
            onClick={() => setActiveTab('athletes')}
            className={`flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium flex-1 transition-all duration-200 ${activeTab === 'athletes'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
              }`}
          >
            <Users className="h-4 w-4 mr-2" />
            Спортсмены
          </button>
        </div>
      </div>

      {/* Сообщение об ошибке */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 shadow-sm">
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
        <div className="bg-white/100 p-6 rounded-lg shadow-md mb-6 border border-gray-100 transition-all duration-300 animate-fadeIn">
          <h2 className="text-lg font-medium mb-4 text-gray-800 flex items-center">
            <Filter className="h-5 w-5 mr-2 text-indigo-500" />
            Фильтры
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дисциплина</label>
              <select
                name="disciplineId"
                value={filters.disciplineId}
                onChange={handleFilterChange}
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
              >
                <option value="">Все дисциплины</option>
                {disciplines.map(discipline => (
                  <option key={discipline.id} value={discipline.id}>{discipline.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Регион</label>
              <select
                name="regionId"
                value={filters.regionId}
                onChange={handleFilterChange}
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата начала</label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Дата окончания</label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
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
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowFilters(false)}
              className="transition-all duration-200 hover:bg-gray-100"
            >
              Отмена
            </Button>
            <Button
              onClick={applyFilters}
              className="bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
            >
              Применить
            </Button>
          </div>
        </div>
      )}

      {/* Индикатор загрузки */}
      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-600"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-r-2 border-l-2 border-indigo-400 absolute top-2 left-2"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-700">Загрузка</div>
          </div>
        </div>
      )}

      {/* Графики */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {activeTab === 'competitions' ? (
            <>
              <div className="bg-white/100 p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-indigo-500" />
                  Соревнования по дисциплинам
                </h3>
                <div className="h-80">
                  {chartData.disciplineData && chartData.disciplineData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.disciplineData} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                        <Legend />
                        <Bar
                          dataKey="value"
                          name="Количество"
                          fill="#6366F1"
                          radius={[4, 4, 0, 0]}
                          background={{ fill: '#f8fafc' }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg">
                      <p className="text-gray-500 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Нет данных для отображения
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white/100 p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300">
                <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-indigo-500" />
                  Соревнования по статусам
                </h3>
                <div className="h-80">
                  {chartData.statusData && chartData.statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.statusData || []}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={90}
                          innerRadius={40}
                          fill="#8884d8"
                          dataKey="value"
                          paddingAngle={3}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {(chartData.statusData || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                        <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" align="center" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg">
                      <p className="text-gray-500 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Нет данных для отображения
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white/100 p-5 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300 lg:col-span-2">
              <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center">
                <Users className="h-5 w-5 mr-2 text-indigo-500" />
                Спортсмены по регионам
              </h3>
              <div className="h-80">
                {chartData.regionData && chartData.regionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.regionData} barSize={40} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEE" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="value"
                        name="Количество"
                        fill="#8B5CF6"
                        stroke="#6D28D9"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex justify-center items-center h-full bg-gray-50 rounded-lg">
                    <p className="text-gray-500 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Нет данных для отображения
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Таблицы данных */}
      {!loading && (
        <div className="bg-white/100 rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-800 flex items-center">
              {activeTab === 'competitions' ? (
                <>
                  <BarChart3 className="h-5 w-5 mr-2 text-indigo-500" />
                  Список соревнований
                </>
              ) : (
                <>
                  <Users className="h-5 w-5 mr-2 text-indigo-500" />
                  Список спортсменов
                </>
              )}
            </h2>
          </div>
          <div className="overflow-x-auto">
            {activeTab === 'competitions' ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Название</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дисциплина</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Регион</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата начала</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                  </tr>
                </thead>
                <tbody className="bg-white/100 divide-y divide-gray-200">
                  {competitions.length > 0 ? (
                    competitions.map((competition) => (
                      <tr key={competition.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{competition.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{competition.discipline}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{competition.region}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(competition.startdate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${competition.status === 'Регистрация открыта' ? 'bg-green-100 text-green-800' :
                            competition.status === 'Регистрация закрыта' ? 'bg-yellow-100 text-yellow-800' :
                              competition.status === 'Завершено' ? 'bg-blue-100 text-blue-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                            {competition.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 bg-gray-50">
                        <div className="flex flex-col items-center justify-center">
                          <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                          <p>Нет данных для отображения</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ФИО</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Регион</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Количество соревнований</th>
                  </tr>
                </thead>
                <tbody className="bg-white/100 divide-y divide-gray-200">
                  {athletes.length > 0 ? (
                    athletes.map((athlete) => (
                      <tr key={athlete.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{athlete.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{athlete.region}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                            {athlete.competitionsCount}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500 bg-gray-50">
                        <div className="flex flex-col items-center justify-center">
                          <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                          <p>Нет данных для отображения</p>
                        </div>
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