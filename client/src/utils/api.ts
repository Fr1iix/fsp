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
		const { data } = await $api.get('/competitions');
		return data;
	},

	// Получение конкретного соревнования
	getOne: async (id: string) => {
		const { data } = await $api.get(`/competitions/${id}`);
		return data;
	},

	// Создание соревнования
	create: async (competition: any) => {
		const { data } = await $api.post('/competitions', competition);
		return data;
	},

	// Обновление соревнования
	update: async (id: string, updates: any) => {
		const { data } = await $api.put(`/competitions/${id}`, updates);
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

export default $api; 