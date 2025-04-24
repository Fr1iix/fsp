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
	},

	// Обновление региона пользователя
	updateRegion: async (userId: string, regionId: number) => {
		console.log(`API: Обновление региона пользователя ID=${userId} на регион ID=${regionId}`);
		try {
			const { data } = await $api.put(`/user/updateRegion/${userId}`, { idRegions: regionId });
			console.log('Ответ сервера:', data);

			// Если сервер вернул новый токен, сохраняем его
			if (data.token) {
				console.log('Сохраняем новый токен с обновленным регионом');
				localStorage.setItem('token', data.token);
			}

			return data;
		} catch (error: any) {
			console.error('Ошибка при обновлении региона:', error);
			if (error.response) {
				console.error('Статус ошибки:', error.response.status);
				console.error('Данные ошибки:', error.response.data);
			}
			throw error;
		}
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
			const response = await $api.get(`/competitions/Competition/${id}`);
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

	// Получение статистики соревнования
	getStats: async (id: string) => {
		try {
			console.log(`Выполняем запрос к API для получения статистики соревнования с ID: ${id}`);
			const response = await $api.get(`/competitions/${id}/stats`);
			console.log('Получена статистика соревнования:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('Ошибка при получении статистики соревнования:', error);
			if (error.response) {
				console.error('Статус ошибки:', error.response.status);
				console.error('Данные ошибки:', error.response.data);
			}
			throw error;
		}
	},

	// Получение команд соревнования
	getTeams: async (id: string) => {
		try {
			console.log(`Выполняем запрос к API для получения команд соревнования с ID: ${id}`);
			const response = await $api.get(`/competitions/${id}/teams`);
			console.log('Получен список команд соревнования:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('Ошибка при получении команд соревнования:', error);
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
		const { data } = await $api.get('/teams/getTeam');
		return data;
	},

	// Получение конкретной команды
	getOne: async (id: string) => {
		const { data } = await $api.get(`/teams/getTeam/${id}`);
		return data;
	},

	// Создание команды
	create: async (teamData: {
		name: string;
		discription?: string;
		CompetitionId: string;
		lookingForMembers?: boolean;
		availableSlots?: number;
		requiredRoles?: string;
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

	// Обновление команды
	update: async (id: string, teamData: {
		name?: string;
		discription?: string;
		CompetitionId?: string;
		lookingForMembers?: boolean;
		availableSlots?: number;
		requiredRoles?: string;
	}) => {
		console.log(`Отправка запроса на обновление команды ID ${id}:`, teamData);
		try {
			const { data } = await $api.put(`/teams/updateTeam/${id}`, teamData);
			return data;
		} catch (error: any) {
			console.error('Ошибка при обновлении команды:', error);
			if (error.response) {
				console.error('Ответ сервера:', error.response.data);
				console.error('Статус:', error.response.status);
			}
			throw error;
		}
	},

	// Поиск команд, которые ищут участников
	getTeamsLookingForMembers: async (competitionId?: string) => {
		console.log('Поиск команд, которые ищут участников', competitionId ? `для соревнования ${competitionId}` : '');
		try {
			const params = competitionId ? { competitionId } : {};
			const { data } = await $api.get('/teams/lookingForMembers', { params });
			return data;
		} catch (error: any) {
			console.error('Ошибка при поиске команд, которые ищут участников:', error);
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
		console.log('Запрос на экспорт данных:', params);
		try {
			const response = await $api.get('/analytics/export', {
				params,
				responseType: 'blob'
			});

			console.log('Получен ответ с типом:', response.headers['content-type']);
			console.log('Размер данных:', response.data.size);

			// Проверяем правильность типа данных ответа
			if (response.data instanceof Blob) {
				return response.data;
			} else {
				console.error('Получен неверный формат данных:', typeof response.data);
				throw new Error('Получен неверный формат данных от сервера');
			}
		} catch (error: any) {
			console.error('Ошибка при экспорте данных:', error);
			if (error.response) {
				console.error('Статус ошибки:', error.response.status);
				if (error.response.data instanceof Blob) {
					// Если сервер вернул ошибку как Blob, нужно его прочитать как текст
					const text = await new Response(error.response.data).text();
					console.error('Данные ошибки:', text);
				} else {
					console.error('Данные ошибки:', error.response.data);
				}
			}
			throw error;
		}
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

	// Получение приглашений для указанной команды
	getTeamInvitations: async (teamId: string) => {
		const { data } = await $api.get(`/invitations/team/${teamId}`);
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
	},

	// Создание запроса на присоединение к команде
	createJoinRequest: async (requestData: {
		TeamId: string;
		CompetitionId: string;
	}) => {
		console.log('Отправка запроса на присоединение к команде:', requestData);
		try {
			const { data } = await $api.post('/invitations/join-request', requestData);
			return data;
		} catch (error: any) {
			console.error('Ошибка при отправке запроса на присоединение:', error);
			if (error.response) {
				console.error('Ответ сервера:', error.response.data);
				console.error('Статус:', error.response.status);
			}
			throw error;
		}
	},

	// Получение запросов на присоединение к командам, где пользователь является капитаном
	getMyTeamsJoinRequests: async () => {
		console.log('Получение всех запросов на присоединение к командам пользователя');
		try {
			const { data } = await $api.get('/invitations/my-teams-join-requests');
			console.log('Ответ от сервера по запросам на присоединение к командам пользователя:', data);
			return data;
		} catch (error: any) {
			console.error('Ошибка при получении запросов на присоединение:', error);
			if (error.response) {
				console.error('Статус ошибки:', error.response.status);
				console.error('Данные ошибки:', error.response.data);
			}
			throw error;
		}
	},

	// Получение запросов на присоединение к команде
	getTeamJoinRequests: async (teamId: string) => {
		console.log(`Получение запросов на присоединение к команде ID ${teamId}`);
		try {
			const { data } = await $api.get(`/invitations/join-requests/${teamId}`);
			console.log(`Ответ от сервера по запросам на присоединение:`, data);
			return data;
		} catch (error: any) {
			console.error(`Ошибка при получении запросов на присоединение к команде ${teamId}:`, error);
			if (error.response) {
				console.error('Статус ошибки:', error.response.status);
				console.error('Данные ошибки:', error.response.data);
			}
			throw error;
		}
	},

	// Проверка наличия запроса на присоединение к команде от текущего пользователя
	checkJoinRequest: async (teamId: string) => {
		console.log(`Проверка наличия запроса на присоединение к команде ID ${teamId}`);
		try {
			const { data } = await $api.get(`/invitations/check-join-request/${teamId}`);
			console.log(`Результат проверки запроса на присоединение:`, data);
			return data;
		} catch (error: any) {
			console.error(`Ошибка при проверке запроса на присоединение:`, error);
			if (error.response) {
				console.error('Статус ошибки:', error.response.status);
				console.error('Данные ошибки:', error.response.data);
			}
			return { exists: false };
		}
	},

	// Ответ на запрос на присоединение к команде (принять/отклонить)
	respondToJoinRequest: async (id: string, status: 'accepted' | 'rejected') => {
		console.log(`Ответ на запрос присоединения ID ${id}, статус: ${status}`);
		const { data } = await $api.patch(`/invitations/join-request/${id}/respond`, { status });
		return data;
	}
};

// API для работы с результатами соревнований
export const competitionResultsAPI = {
	// Получение результатов соревнования
	getByCompetition: async (competitionId: string) => {
		try {
			console.log(`Запрос результатов соревнования ID: ${competitionId}`);
			const { data } = await $api.get(`/competition-results/competition/${competitionId}`);
			return data;
		} catch (error: any) {
			console.error('Ошибка при получении результатов соревнования:', error);
			throw error;
		}
	},

	// Получение результатов пользователя
	getByUser: async (userId: string) => {
		try {
			const { data } = await $api.get(`/competition-results/user/${userId}`);
			return data;
		} catch (error: any) {
			console.error('Ошибка при получении результатов пользователя:', error);
			throw error;
		}
	},

	// Добавление результата
	addResult: async (resultData: any) => {
		try {
			const { data } = await $api.post('/competition-results/add', resultData);
			return data;
		} catch (error: any) {
			console.error('Ошибка при добавлении результата:', error);
			throw error;
		}
	},

	// Добавление результатов команд
	addTeamResults: async (competitionId: string, results: any[]) => {
		try {
			console.log(`Добавление результатов команд в соревнование ID: ${competitionId}`, results);
			const { data } = await $api.post(`/competition-results/team-results/${competitionId}`, { results });
			return data;
		} catch (error: any) {
			console.error('Ошибка при добавлении результатов команд:', error);
			throw error;
		}
	},

	// Обновление результата
	updateResult: async (id: string, updates: any) => {
		try {
			const { data } = await $api.put(`/competition-results/update/${id}`, updates);
			return data;
		} catch (error: any) {
			console.error('Ошибка при обновлении результата:', error);
			throw error;
		}
	},

	// Подтверждение результатов соревнования
	confirmResults: async (competitionId: string) => {
		try {
			const { data } = await $api.post(`/competition-results/confirm/${competitionId}`);
			return data;
		} catch (error: any) {
			console.error('Ошибка при подтверждении результатов:', error);
			throw error;
		}
	},

	// Удаление результата
	deleteResult: async (id: string) => {
		try {
			const { data } = await $api.delete(`/competition-results/delete/${id}`);
			return data;
		} catch (error: any) {
			console.error('Ошибка при удалении результата:', error);
			throw error;
		}
	}
};

// объединяем все API в один объект
const api = {
	auth: authAPI,
	user: userAPI,
	competitions: competitionAPI,
	applications: applicationAPI,
	teams: teamsAPI,
	results: competitionResultsAPI,
	// другие API-объекты...
};

export default api; 