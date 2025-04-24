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
		try {
			console.log(`Выполняем запрос к API для получения соревнования с ID: ${id}`);
			const response = await $api.get(`/Competition/${id}`);
			console.log('Получен ответ от API соревнования:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('Ошибка при получении соревнования:', error);
			if (error.response) {
				console.error('Статус ошибки:', error.response.status);
				console.error('Данные ошибки:', error.response.data);
			}
			throw error;
		}
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
	// Получить все заявки (для админов)
	getAll: async () => {
		const { data } = await $api.get('/applications');
		return data;
	},

	// Создать новую заявку
	create: async (applicationData: any) => {
		const { data } = await $api.post('/applications', applicationData);
		return data;
	},

	// Обновить статус заявки
	updateStatus: async (id: string, status: 'approved' | 'rejected') => {
		const { data } = await $api.patch(`/applications/${id}/status`, { status });
		return data;
	},

	// Создать заявку на участие в соревновании
	createParticipation: async (competitionId: string, teamId?: string) => {
		const { data } = await $api.post('/applications/participation', { 
			CompetitionId: competitionId,
			TeamId: teamId
		});
		return data;
	},

	// Получить заявки текущего пользователя
	getMyApplications: async () => {
		const { data } = await $api.get('/applications/my');
		return data;
	},

	// Получить заявки для соревнований в регионе (для региональных представителей)
	getRegionalApplications: async () => {
		const { data } = await $api.get('/applications/regional');
		return data;
	},

	// Получить одну заявку по ID
	getOne: async (id: string) => {
		const { data } = await $api.get(`/applications/${id}`);
		return data;
	},

	// Получение заявок конкретного пользователя
	getByUser: async (userId: string) => {
		const { data } = await $api.get(`/applications/user/${userId}`);
		return data;
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
	create: async (teamData: {
		name: string;
		discription?: string;
		CompetitionId: string;
	}) => {
		console.log('Отправка запроса на создание команды:', teamData);
		try {
			const { data } = await $api.post('/teams', teamData);
			return data;
		} catch (error: any) {
			console.error('Ошибка при создании команды:', error);
			if (error.response) {
				console.error('Ответ сервера:', error.response.data);
				console.error('Статус:', error.response.status);
			}
			throw error;
		}
	},

	// Добавление участника в команду
	addMember: async (teamData: {
		is_capitan?: boolean;
		UserId: string;
		TeamId: string;
	}) => {
		console.log('Отправка запроса на добавление участника в команду:', teamData);
		try {
			// Проверим наличие всех требуемых полей
			if (!teamData.UserId || !teamData.TeamId) {
				throw new Error('Не все обязательные поля указаны');
			}
			
			// Используем правильный URL согласно маршрутов сервера
			const { data } = await $api.post('/team-members', teamData);
			return data;
		} catch (error: any) {
			console.error('Ошибка при добавлении участника в команду:', error);
			if (error.response) {
				console.error('Ответ сервера:', error.response.data);
				console.error('Статус:', error.response.status);
			}
			throw error;
		}
	},

	// Отправка заявки на участие в соревновании для команды
	submitApplication: async (applicationData: {
		UserId: string;
		TeamId: string;
		CompetitionId: string;
		status?: string;
	}) => {
		console.log('Отправка заявки на участие в соревновании:', applicationData);
		try {
			const { data } = await $api.post('/applications', applicationData);
			return data;
		} catch (error: any) {
			console.error('Ошибка при отправке заявки:', error);
			if (error.response) {
				console.error('Ответ сервера:', error.response.data);
				console.error('Статус:', error.response.status);
			}
			throw error;
		}
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

// API для работы с приглашениями в команду
export const invitationAPI = {
	// Получение всех приглашений для текущего пользователя
	getMyInvitations: async () => {
		const { data } = await $api.get('/invitations/my');
		return data;
	},
	
	// Создание нового приглашения
	create: async (invitationData: {
		UserId: string;
		TeamId: string;
		CompetitionId: string;
	}) => {
		const { data } = await $api.post('/invitations', invitationData);
		return data;
	},
	
	// Ответ на приглашение (принять/отклонить)
	respond: async (id: string, status: 'accepted' | 'rejected') => {
		const { data } = await $api.patch(`/invitations/${id}/respond`, { status });
		return data;
	}
};

export default $api; 