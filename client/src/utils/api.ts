import axios from 'axios';
import { UserRole } from '../types';

const API_URL = 'http://localhost:5000/api';

// Создаем экземпляр axios с базовым URL
const $api = axios.create({
	baseURL: API_URL,
	withCredentials: true
});

// Интерцептор для добавления токена к запросам
$api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Интерцептор для обработки ошибок
$api.interceptors.response.use(
	(response) => response,
	(error) => {
		console.error('API Error:', error.response?.data || error.message);
		return Promise.reject(error);
	}
);

// API для аутентификации
export const authAPI = {
	// Регистрация пользователя
	register: async (email: string, password: string, role: UserRole) => {
		console.log('Sending registration request', { email, role });
		const { data } = await $api.post('/auth/register', { email, password, role });
		return data;
	},

	// Аутентификация пользователя
	login: async (email: string, password: string) => {
		const { data } = await $api.post('/auth/login', { email, password });
		return data;
	},

	// Проверка токена
	check: async () => {
		const { data } = await $api.get('/auth/refresh');
		return data;
	},

	// Проверка существования email
	checkEmail: async (email: string) => {
		const { data } = await $api.post('/user/check-email', { email });
		return data.exists;
	}
};

// API для работы с информацией о пользователе
export const userAPI = {
	// Получение данных пользователя
	getUserInfo: async (userId: string) => {
		const { data } = await $api.get(`/userInfo/getoneUserInfo/${userId}`);
		return data;
	},

	// Обновление данных пользователя
	updateUserInfo: async (userId: string, userInfo: any) => {
		const { data } = await $api.put(`/userInfo/updateUserInfo/${userId}`, userInfo);
		return data;
	}
};

// API для работы с соревнованиями
export const competitionAPI = {
	// Получение списка соревнований
	getAll: async () => {
		try {
			console.log('Выполняем запрос к API для получения соревнований');
			const { data } = await $api.get('/competitions/getCompetition');
			console.log('Получен ответ от API соревнований:', data);

			// Обеспечиваем, что результат всегда будет массивом
			if (!data) {
				console.warn('API вернул пустой ответ');
				return [];
			}

			if (!Array.isArray(data)) {
				console.warn('API вернул не массив:', data);
				if (data.id) {
					// Если получили одиночный объект
					return [data];
				}
				return [];
			}

			return data;
		} catch (error: any) {
			console.error('Ошибка при получении списка соревнований:', error);
			if (error.response) {
				console.error('Статус ошибки:', error.response.status);
				console.error('Данные ошибки:', error.response.data);
			}
			throw error;
		}
	},

	// Получение конкретного соревнования
	getOne: async (id: string) => {
		const { data } = await $api.get(`/competitions/${id}`);
		return data;
	},

	// Создание соревнования
	create: async (competition: any) => {
		console.log('Отправка запроса на создание соревнования:', competition);
		try {
			// Используем более подробный лог запроса
			const { data } = await $api.post('/competitions', competition);
			return data;
		} catch (error: any) {
			console.error('Ошибка при создании соревнования:', error);
			if (error.response) {
				console.error('Ответ сервера:', error.response.data);
				console.error('Статус:', error.response.status);
			}
			throw error;
		}
	},

	// Обновление соревнования
	update: async (id: string, updates: any) => {
		const { data } = await $api.put(`/competitions/${id}`, updates);
		return data;
	}
};

// API для работы с заявками на соревнования
export const applicationAPI = {
	// Получение всех заявок (для администраторов и ФСП)
	getAll: async (params?: { limit?: number; offset?: number; search?: string; status?: string }) => {
		const { data } = await $api.get('/applications', { params });
		return data;
	},

	// Получение заявок конкретного пользователя
	getByUser: async (userId: string) => {
		const { data } = await $api.get(`/applications/user/${userId}`);
		return data;
	},

	// Получение конкретной заявки
	getOne: async (id: string) => {
		const { data } = await $api.get(`/applications/${id}`);
		return data;
	},

	// Создание заявки
	create: async (application: any) => {
		const { data } = await $api.post('/applications', application);
		return data;
	},

	// Обновление статуса заявки (для ФСП)
	updateStatus: async (id: string, status: 'pending' | 'approved' | 'rejected') => {
		// Убедимся, что ID заявки в правильном формате
		const applicationId = String(id);
		console.log('Отправка запроса на обновление статуса:', { applicationId, status });
		try {
			const { data } = await $api.patch(`/applications/${applicationId}/status`, { status });
			return data;
		} catch (error) {
			console.error('Ошибка при обновлении статуса заявки:', error);
			throw error;
		}
	},

	// Обновление заявки
	update: async (id: string, updates: any) => {
		const { data } = await $api.put(`/applications/${id}`, updates);
		return data;
	},

	// Удаление заявки
	delete: async (id: string) => {
		const { data } = await $api.delete(`/applications/${id}`);
		return data;
	}
};

// API для работы с командами
export const teamsAPI = {
	// Получение списка команд
	getAll: async () => {
		const { data } = await $api.get('/teams');
		return data;
	},

	// Получение конкретной команды
	getOne: async (id: string) => {
		const { data } = await $api.get(`/teams/${id}`);
		return data;
	},

	// Создание команды
	create: async (team: any) => {
		const { data } = await $api.post('/teams', team);
		return data;
	}
};

// API для работы с аналитикой
export const analyticsAPI = {
	// Получение аналитики по соревнованиям
	getCompetitionsAnalytics: async (params?: {
		disciplineId?: string;
		regionId?: string;
		startDate?: string;
		endDate?: string;
		status?: string
	}) => {
		const { data } = await $api.get('/analytics/competitions', { params });
		return data;
	},

	// Получение аналитики по спортсменам
	getAthletesAnalytics: async (params?: {
		disciplineId?: string;
		regionId?: string
	}) => {
		const { data } = await $api.get('/analytics/athletes', { params });
		return data;
	},

	// Экспорт данных в Excel
	exportData: async (params?: {
		type: 'competitions' | 'athletes';
		disciplineId?: string;
		regionId?: string;
		startDate?: string;
		endDate?: string;
		status?: string
	}) => {
		const { data } = await $api.get('/analytics/export', {
			params,
			responseType: 'blob'
		});
		return data;
	},

	// Получение списка дисциплин
	getDisciplines: async () => {
		const { data } = await $api.get('/disciplines');
		return data;
	},

	// Получение списка регионов
	getRegions: async () => {
		const { data } = await $api.get('/regions');
		return data;
	}
};

export default $api; 