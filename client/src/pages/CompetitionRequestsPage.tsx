import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, MapPin, Clock, CheckCircle, XCircle, Info, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Badge from '../components/ui/Badge.tsx';
import Input from '../components/ui/Input.tsx';
import { useAuthStore } from '../store/authStore.ts';
import { applicationAPI, competitionAPI } from '../utils/api';
import { Application, CompetitionRequest, ApplicationStatus } from '../types';

const CompetitionRequestsPage: React.FC = () => {
	const navigate = useNavigate();
	const { user } = useAuthStore();
	const [applications, setApplications] = useState<Application[]>([]);
	const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState<string>('all');

	useEffect(() => {
		// Проверяем, является ли пользователь представителем ФСП
		if (!user || user.role !== 'fsp') {
			navigate('/');
			return;
		}

		const fetchApplications = async () => {
			setIsLoading(true);
			try {
				const fetchedApplications = await applicationAPI.getAll();

				// Преобразуем данные заявок для отображения
				const processedApplications = fetchedApplications.map((app: Application) => {
					// Если у заявки есть UUID с данными о соревновании, распарсим их
					let competitionData = {};
					if (app.UUID) {
						try {
							// Пробуем парсить всё целиком
							if (app.UUID.includes('competitionData')) {
								const jsonData = JSON.parse(app.UUID);
								competitionData = jsonData.competitionData ? JSON.parse(jsonData.competitionData) : {};
							} else {
								// Если нет поля competitionData, пробуем парсить UUID как JSON
								competitionData = JSON.parse(app.UUID);
							}
						} catch (err) {
							console.error('Ошибка при парсинге данных соревнования:', err, app.UUID);
						}
					}

					return {
						...app,
						competitionData
					};
				});

				console.log('Загруженные заявки:', processedApplications);
				setApplications(processedApplications);
				setFilteredApplications(processedApplications);
			} catch (err: any) {
				console.error('Ошибка при загрузке заявок:', err);
				setError(err.response?.data?.message || 'Не удалось загрузить заявки на соревнования');
			} finally {
				setIsLoading(false);
			}
		};

		fetchApplications();
	}, [user, navigate]);

	// Обработка изменения статуса заявки
	const handleStatusChange = async (applicationId: string, newStatus: ApplicationStatus) => {
		try {
			// Отправляем запрос на изменение статуса
			await applicationAPI.updateStatus(applicationId, newStatus);

			// Если статус изменен на "approved", нужно создать соревнование
			if (newStatus === 'approved') {
				const application = applications.find(app => app.id === applicationId);
				if (application && application.competitionData) {
					// Создаем соревнование на основе данных заявки
					await competitionAPI.create({
						...application.competitionData,
						createdBy: application.UserId,
						status: 'registration'
					});
				}
			}

			// Обновляем состояние на фронтенде
			setApplications(prev =>
				prev.map(app =>
					app.id === applicationId ? { ...app, status: newStatus } : app
				)
			);

			// Применяем текущие фильтры к обновленным данным
			filterApplications(searchTerm, statusFilter, applications.map(app =>
				app.id === applicationId ? { ...app, status: newStatus } : app
			));

		} catch (err: any) {
			console.error('Ошибка при обновлении статуса заявки:', err);
			alert('Не удалось обновить статус заявки');
		}
	};

	// Фильтрация заявок
	const filterApplications = (search: string, status: string, data: Application[] = applications) => {
		let filtered = [...data];

		// Фильтрация по поисковому запросу
		if (search) {
			const searchLower = search.toLowerCase();
			filtered = filtered.filter(app => {
				// Ищем в разных полях заявки и связанных данных
				const competitionTitle = app.competitionData?.title || '';
				const userName = app.User?.firstName + ' ' + app.User?.lastName || '';
				const region = app.competitionData?.region || '';

				return competitionTitle.toLowerCase().includes(searchLower) ||
					userName.toLowerCase().includes(searchLower) ||
					region.toLowerCase().includes(searchLower);
			});
		}

		// Фильтрация по статусу
		if (status !== 'all') {
			filtered = filtered.filter(app => app.status === status);
		}

		setFilteredApplications(filtered);
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		filterApplications(searchTerm, statusFilter);
	};

	const handleStatusFilterChange = (status: string) => {
		setStatusFilter(status);
		filterApplications(searchTerm, status);
	};

	// Получение бейджа для статуса заявки
	const getStatusBadge = (status: ApplicationStatus) => {
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
		<div className="min-h-screen bg-slate-50 pt-20 pb-12">
			<div className="container mx-auto max-w-5xl px-4 py-8">
				<div className="mb-10">
					<button
						onClick={() => navigate(-1)}
						className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors mb-4"
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Назад
					</button>

					<div className="flex items-center justify-between">
						<h1 className="text-3xl font-bold text-neutral-800">Заявки на соревнования</h1>
						<Badge variant="primary" className="text-sm px-3 py-1">
							{filteredApplications.length} заявок
						</Badge>
					</div>
					<p className="text-neutral-500 mt-2">
						Просмотр и управление заявками от региональных представителей на создание соревнований
					</p>
				</div>

				<div className="mb-8">
					<Card className="overflow-hidden border-none shadow-md">
						<CardContent className="p-6">
							<div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
								<form onSubmit={handleSearch} className="flex-1 w-full md:w-auto">
									<div className="relative">
										<Input
											type="text"
											placeholder="Поиск по названию, автору или региону..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="pl-10 pr-4 py-2.5 w-full rounded-lg shadow-sm border-neutral-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
										/>
										<Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
										{searchTerm && (
											<button
												type="button"
												className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-600"
												onClick={() => {
													setSearchTerm('');
													filterApplications('', statusFilter);
												}}
											>
												<XCircle className="h-4 w-4" />
											</button>
										)}
									</div>
								</form>

								<div className="flex flex-wrap gap-2 w-full md:w-auto">
									<Button
										variant={statusFilter === 'all' ? 'primary' : 'outline'}
										onClick={() => handleStatusFilterChange('all')}
										className="flex-1 md:flex-none"
									>
										Все
									</Button>
									<Button
										variant={statusFilter === 'pending' ? 'primary' : 'outline'}
										onClick={() => handleStatusFilterChange('pending')}
										className="flex-1 md:flex-none"
									>
										<Clock className="h-4 w-4 mr-2" />
										На рассмотрении
									</Button>
									<Button
										variant={statusFilter === 'approved' ? 'primary' : 'outline'}
										onClick={() => handleStatusFilterChange('approved')}
										className="flex-1 md:flex-none"
									>
										<CheckCircle className="h-4 w-4 mr-2" />
										Одобренные
									</Button>
									<Button
										variant={statusFilter === 'rejected' ? 'primary' : 'outline'}
										onClick={() => handleStatusFilterChange('rejected')}
										className="flex-1 md:flex-none"
									>
										<XCircle className="h-4 w-4 mr-2" />
										Отклоненные
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{error && (
					<div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700">
						<p className="font-medium">Ошибка:</p>
						<p>{error}</p>
					</div>
				)}

				{filteredApplications.length === 0 ? (
					<div className="text-center py-16">
						<div className="text-neutral-400 mb-4">
							<Info className="h-12 w-12 mx-auto" />
						</div>
						<h2 className="text-xl font-medium text-neutral-600 mb-2">Заявки не найдены</h2>
						<p className="text-neutral-500">
							{statusFilter !== 'all'
								? 'Попробуйте изменить фильтр по статусу или поисковый запрос'
								: 'В данный момент нет заявок на рассмотрение'}
						</p>
					</div>
				) : (
					<div className="space-y-6">
						{filteredApplications.map((application) => {
							const competitionData = application.competitionData || {};
							return (
								<Card key={application.id} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
									<CardHeader className={`
										py-4 px-6 border-b 
										${application.status === 'pending' ? 'bg-amber-50 border-amber-100' :
											application.status === 'approved' ? 'bg-emerald-50 border-emerald-100' :
												'bg-rose-50 border-rose-100'}
									`}>
										<div className="flex justify-between items-center">
											<h2 className="text-lg font-semibold text-neutral-800">
												{competitionData.title || 'Название отсутствует'}
											</h2>
											{getStatusBadge(application.status as ApplicationStatus)}
										</div>
									</CardHeader>

									<CardContent className="p-6">
										<div className="mb-6">
											<div className="flex flex-wrap gap-4 mb-4">
												<span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-primary-50 text-primary-700">
													<Calendar className="h-3.5 w-3.5 mr-1.5" />
													{competitionData.format ? getFormatName(competitionData.format) : 'Формат не указан'}
												</span>
												<span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-primary-50 text-primary-700">
													<User className="h-3.5 w-3.5 mr-1.5" />
													До {competitionData.maxParticipants || '∞'} участников
												</span>
												<span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-primary-50 text-primary-700">
													{competitionData.discipline
														? getDisciplineName(competitionData.discipline)
														: 'Дисциплина не указана'}
												</span>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 bg-gray-50 p-4 rounded-lg">
												<div>
													<p className="text-sm font-medium text-neutral-500 mb-1 flex items-center">
														<User className="h-4 w-4 mr-1.5 text-primary-600" />
														Заявитель
													</p>
													<p className="text-neutral-700 font-medium">
														{application.User?.firstName} {application.User?.lastName || 'Имя не указано'}
													</p>
												</div>

												<div>
													<p className="text-sm font-medium text-neutral-500 mb-1 flex items-center">
														<MapPin className="h-4 w-4 mr-1.5 text-primary-600" />
														Регион
													</p>
													<p className="text-neutral-700 font-medium">{competitionData.region || 'Не указан'}</p>
												</div>

												<div>
													<p className="text-sm font-medium text-neutral-500 mb-1 flex items-center">
														<Calendar className="h-4 w-4 mr-1.5 text-primary-600" />
														Даты проведения
													</p>
													<p className="text-neutral-700 font-medium">
														{competitionData.startDate && competitionData.endDate
															? `${new Date(competitionData.startDate).toLocaleDateString('ru-RU', {
																day: 'numeric',
																month: 'short',
															})} - ${new Date(competitionData.endDate).toLocaleDateString('ru-RU', {
																day: 'numeric',
																month: 'short',
																year: 'numeric',
															})}`
															: 'Не указаны'}
													</p>
												</div>
											</div>

											<div className="mb-6">
												<p className="text-sm font-medium text-neutral-500 mb-2 flex items-center">
													<Info className="h-4 w-4 mr-1.5 text-primary-600" />
													Описание
												</p>
												<div className="bg-white p-4 rounded-lg border border-gray-100 text-neutral-700">
													{competitionData.description ? (
														<p>{competitionData.description}</p>
													) : (
														<p className="text-neutral-400 italic">Описание отсутствует</p>
													)}
												</div>
											</div>
										</div>

										<div className="flex justify-between items-center pt-4 border-t border-neutral-100">
											<div className="text-sm text-neutral-500 flex items-center">
												<Clock className="h-4 w-4 mr-1.5" />
												Заявка создана: {formatDate(application.createdAt)}
											</div>

											{application.status === 'pending' && (
												<div className="flex gap-3">
													<Button
														onClick={() => handleStatusChange(application.id, 'rejected')}
														variant="outline"
														className="border-error-300 text-error-600 hover:bg-error-50"
													>
														<XCircle className="h-4 w-4 mr-2" />
														Отклонить
													</Button>
													<Button
														onClick={() => handleStatusChange(application.id, 'approved')}
														variant="primary"
														className="shadow-sm hover:shadow-md transition-shadow"
													>
														<CheckCircle className="h-4 w-4 mr-2" />
														Одобрить
													</Button>
												</div>
											)}

											{application.status === 'approved' && (
												<div className="text-success-600 font-medium flex items-center">
													<CheckCircle className="h-4 w-4 mr-2" />
													Заявка одобрена
												</div>
											)}

											{application.status === 'rejected' && (
												<div className="text-error-600 font-medium flex items-center">
													<XCircle className="h-4 w-4 mr-2" />
													Заявка отклонена
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default CompetitionRequestsPage;