import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, MapPin, Clock, CheckCircle, XCircle, Info, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Badge from '../components/ui/Badge.tsx';
import Input from '../components/ui/Input.tsx';
import { useAuthStore } from '../store/authStore.ts';
import api from '../utils/api';

// Тип для заявок на соревнования
interface CompetitionRequest {
	id: string;
	title: string;
	description: string;
	format: 'open' | 'regional' | 'federal';
	discipline: 'product' | 'security' | 'algorithm' | 'robotics' | 'drones';
	region: string;
	startDate: string;
	endDate: string;
	maxParticipants: number;
	requesterId: string;
	requesterName: string;
	requesterRegion: string;
	status: 'pending' | 'approved' | 'rejected';
	createdAt: string;
}

const CompetitionRequestsPage: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useAuthStore();
	const [requests, setRequests] = useState<CompetitionRequest[]>([]);
	const [filteredRequests, setFilteredRequests] = useState<CompetitionRequest[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');

	// Временные моковые данные (в реальном приложении будут загружены с сервера)
	const mockRequests: CompetitionRequest[] = [
		{
			id: '1',
			title: 'Региональные соревнования по программированию',
			description: 'Соревнования для школьников и студентов по алгоритмическому программированию.',
			format: 'regional',
			discipline: 'algorithm',
			region: 'Москва',
			startDate: '2023-12-10',
			endDate: '2023-12-12',
			maxParticipants: 100,
			requesterId: 'user1',
			requesterName: 'Иванов Иван',
			requesterRegion: 'Москва',
			status: 'pending',
			createdAt: '2023-11-15T10:30:00Z',
		},
		{
			id: '2',
			title: 'Открытый чемпионат по кибербезопасности',
			description: 'Соревнования для специалистов по информационной безопасности.',
			format: 'open',
			discipline: 'security',
			region: 'Санкт-Петербург',
			startDate: '2023-11-25',
			endDate: '2023-11-27',
			maxParticipants: 50,
			requesterId: 'user2',
			requesterName: 'Петров Петр',
			requesterRegion: 'Санкт-Петербург',
			status: 'approved',
			createdAt: '2023-10-20T14:15:00Z',
		},
		{
			id: '3',
			title: 'Федеральный хакатон по разработке продуктов',
			description: 'Командные соревнования по разработке программных продуктов.',
			format: 'federal',
			discipline: 'product',
			region: 'Казань',
			startDate: '2024-01-15',
			endDate: '2024-01-17',
			maxParticipants: 200,
			requesterId: 'user3',
			requesterName: 'Сидоров Сидор',
			requesterRegion: 'Казань',
			status: 'rejected',
			createdAt: '2023-11-05T09:45:00Z',
		},
	];

	useEffect(() => {
		// Проверяем, является ли пользователь представителем ФСП
		if (!user || user.role !== 'fsp') {
			navigate('/');
			return;
		}

		const fetchRequests = async () => {
			setIsLoading(true);
			try {
				// В реальном приложении данные будут загружены с сервера
				// const response = await api.get('/competitions/requests');
				// setRequests(response.data);

				// Используем моковые данные для демонстрации
				await new Promise(resolve => setTimeout(resolve, 800)); // Имитация задержки загрузки
				setRequests(mockRequests);
				setFilteredRequests(mockRequests);
			} catch (err: any) {
				console.error('Ошибка при загрузке заявок:', err);
				setError(err.response?.data?.message || 'Не удалось загрузить заявки на соревнования');
			} finally {
				setIsLoading(false);
			}
		};

		fetchRequests();
	}, [user, navigate]);

	// Обработка изменения статуса заявки
	const handleStatusChange = async (requestId: string, newStatus: 'approved' | 'rejected') => {
		try {
			// В реальном приложении будет отправлен запрос на сервер
			// await api.patch(`/competitions/requests/${requestId}`, { status: newStatus });

			// Обновляем состояние на фронтенде
			setRequests(prev =>
				prev.map(req =>
					req.id === requestId ? { ...req, status: newStatus } : req
				)
			);

			// Применяем текущие фильтры к обновленным данным
			filterRequests(searchTerm, statusFilter, requests.map(req =>
				req.id === requestId ? { ...req, status: newStatus } : req
			));

		} catch (err: any) {
			console.error('Ошибка при обновлении статуса заявки:', err);
			alert('Не удалось обновить статус заявки');
		}
	};

	// Фильтрация заявок
	const filterRequests = (search: string, status: string, data: CompetitionRequest[] = requests) => {
		let filtered = [...data];

		// Фильтрация по поисковому запросу
		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(req =>
				req.title.toLowerCase().includes(searchLower) ||
				req.requesterName.toLowerCase().includes(searchLower) ||
				req.region.toLowerCase().includes(searchLower)
			);
		}

		// Фильтрация по статусу
		if (status !== 'all') {
			filtered = filtered.filter(req => req.status === status);
		}

		setFilteredRequests(filtered);
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		filterRequests(searchTerm, statusFilter);
	};

	const handleStatusFilterChange = (status: string) => {
		setStatusFilter(status);
		filterRequests(searchTerm, status);
	};

	// Получение бейджа для статуса заявки
	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'pending':
				return <Badge variant="warning">На рассмотрении</Badge>;
			case 'approved':
				return <Badge variant="success">Одобрено</Badge>;
			case 'rejected':
				return <Badge variant="error">Отклонено</Badge>;
			default:
				return <Badge variant="neutral">Неизвестно</Badge>;
		}
	};

	// Форматирование даты
	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	// Получение названия дисциплины на русском
	const getDisciplineName = (discipline: string) => {
		const disciplines: Record<string, string> = {
			product: 'Продуктовая разработка',
			security: 'Информационная безопасность',
			algorithm: 'Алгоритмы',
			robotics: 'Робототехника',
			drones: 'Дроны',
		};

		return disciplines[discipline] || discipline;
	};

	// Получение названия формата на русском
	const getFormatName = (format: string) => {
		const formats: Record<string, string> = {
			open: 'Открытый',
			regional: 'Региональный',
			federal: 'Федеральный',
		};

		return formats[format] || format;
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-slate-50 pt-20">
				<div className="container mx-auto max-w-5xl px-4 py-8">
					<div className="flex justify-center py-16">
						<div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-50 pt-20">
			<div className="container mx-auto max-w-5xl px-4 py-8">
				<div className="mb-6">
					<button
						onClick={() => navigate(-1)}
						className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Назад
					</button>
				</div>

				<h1 className="text-2xl font-bold text-neutral-800 mb-6">Заявки на соревнования</h1>

				<div className="mb-8">
					<div className="bg-primary-50 border border-primary-100 rounded-xl p-6">
						<h3 className="text-primary-800 font-semibold mb-3 flex items-center">
							<Info className="h-5 w-5 mr-2 text-primary-600" />
							Важная информация
						</h3>
						<p className="text-sm text-primary-700 mb-4">
							На этой странице вы можете просматривать и управлять заявками на соревнования от региональных представителей.
							После одобрения заявки соревнование будет автоматически создано и доступно на платформе.
						</p>
					</div>
				</div>

				<div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
					<form onSubmit={handleSearch} className="flex-1">
						<Input
							leftIcon={<Search className="h-4 w-4" />}
							placeholder="Поиск по названию, представителю или региону..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full"
							fullWidth
						/>
					</form>

					<div className="flex flex-wrap gap-2">
						<Button
							variant={statusFilter === 'all' ? 'primary' : 'outline'}
							size="sm"
							onClick={() => handleStatusFilterChange('all')}
						>
							Все заявки
						</Button>
						<Button
							variant={statusFilter === 'pending' ? 'primary' : 'outline'}
							size="sm"
							onClick={() => handleStatusFilterChange('pending')}
						>
							На рассмотрении
						</Button>
						<Button
							variant={statusFilter === 'approved' ? 'primary' : 'outline'}
							size="sm"
							onClick={() => handleStatusFilterChange('approved')}
						>
							Одобрено
						</Button>
						<Button
							variant={statusFilter === 'rejected' ? 'primary' : 'outline'}
							size="sm"
							onClick={() => handleStatusFilterChange('rejected')}
						>
							Отклонено
						</Button>
					</div>
				</div>

				{error && (
					<div className="bg-error-50 text-error-700 p-4 rounded-md mb-6">
						<p>{error}</p>
					</div>
				)}

				{filteredRequests.length > 0 ? (
					<div className="space-y-6">
						{filteredRequests.map((request) => (
							<Card key={request.id} className="overflow-hidden !bg-white shadow-md rounded-xl border-none">
								<CardContent className="p-0">
									<div className="p-5 border-b border-neutral-100">
										<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
											<h3 className="text-lg font-semibold text-neutral-800">{request.title}</h3>
											{getStatusBadge(request.status)}
										</div>

										<div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 text-sm text-neutral-600">
											<div className="flex items-center">
												<User className="h-4 w-4 mr-2 text-primary-500" />
												{request.requesterName}
											</div>
											<div className="flex items-center">
												<MapPin className="h-4 w-4 mr-2 text-primary-500" />
												{request.region}
											</div>
											<div className="flex items-center">
												<Calendar className="h-4 w-4 mr-2 text-primary-500" />
												{formatDate(request.startDate)} - {formatDate(request.endDate)}
											</div>
											<div className="flex items-center">
												<Clock className="h-4 w-4 mr-2 text-primary-500" />
												Заявка создана: {formatDate(request.createdAt)}
											</div>
										</div>

										<div className="flex flex-wrap gap-2 mb-4">
											<span className="inline-block px-3 py-1 text-xs rounded-full bg-primary-50 text-primary-700">
												{getFormatName(request.format)}
											</span>
											<span className="inline-block px-3 py-1 text-xs rounded-full bg-primary-50 text-primary-700">
												{getDisciplineName(request.discipline)}
											</span>
											<span className="inline-block px-3 py-1 text-xs rounded-full bg-primary-50 text-primary-700">
												До {request.maxParticipants} участников
											</span>
										</div>

										<p className="text-neutral-700 mb-4">
											{request.description}
										</p>

										{request.status === 'pending' && (
											<div className="flex gap-3 mt-4">
												<Button
													variant="primary"
													leftIcon={<CheckCircle className="h-4 w-4" />}
													onClick={() => handleStatusChange(request.id, 'approved')}
												>
													Одобрить
												</Button>
												<Button
													variant="outline"
													leftIcon={<XCircle className="h-4 w-4" />}
													onClick={() => handleStatusChange(request.id, 'rejected')}
												>
													Отклонить
												</Button>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<div className="text-center py-16 bg-white rounded-lg shadow-sm">
						<div className="bg-neutral-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
							<Calendar className="h-12 w-12 text-neutral-300" />
						</div>
						<p className="text-xl text-neutral-600 mb-4">
							Заявки не найдены
						</p>
						<p className="text-neutral-500 mb-6">
							{searchTerm || statusFilter !== 'all' ?
								'Попробуйте изменить параметры поиска или фильтрации' :
								'В данный момент нет заявок на создание соревнований'}
						</p>
						{(searchTerm || statusFilter !== 'all') && (
							<Button
								variant="outline"
								onClick={() => {
									setSearchTerm('');
									setStatusFilter('all');
									setFilteredRequests(requests);
								}}
							>
								Сбросить все фильтры
							</Button>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default CompetitionRequestsPage; 