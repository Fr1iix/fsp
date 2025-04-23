import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Создаем экземпляр axios с базовым URL
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Middleware для добавления токена авторизации к запросам
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const ApplicationService = {
  // Получить все заявки
  getAll: (params = {}) => {
    return apiClient.get('/application', { params });
  },

  // Получить заявки по ID пользователя
  getByUser: (userId: number) => {
    return apiClient.get(`/application/user/${userId}`);
  },

  // Получить заявки текущего пользователя
  getMyApplications: () => {
    return apiClient.get('/application/my');
  },

  // Получить заявки для региона (для региональных представителей)
  getRegionalApplications: () => {
    return apiClient.get('/application/regional');
  },

  // Получить конкретную заявку по ID
  getOne: (id: number) => {
    return apiClient.get(`/application/${id}`);
  },

  // Создать новую заявку
  create: (data: any) => {
    return apiClient.post('/application', data);
  },

  // Создать заявку на участие в соревновании
  createParticipationRequest: (data: { CompetitionId: number; TeamId: number }) => {
    return apiClient.post('/application/participate', data);
  },

  // Обновить статус заявки
  updateStatus: (id: number, status: 'approved' | 'rejected') => {
    return apiClient.put(`/application/status/${id}`, { status });
  },

  // Обновить заявку
  update: (id: number, data: any) => {
    return apiClient.put(`/application/${id}`, data);
  },

  // Удалить заявку
  deleteApplication: (id: number) => {
    return apiClient.delete(`/application/${id}`);
  },

  // Получить детальную информацию о заявке
  getApplicationDetails: (id: number) => {
    return apiClient.get(`/application/details/${id}`);
  }
}; 