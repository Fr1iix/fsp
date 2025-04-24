import React, { useEffect, useState } from 'react';
import { teamsAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { Users, Search, UserPlus, Filter, Award, UserSearch, Code, Sparkles, Target, ChevronDown, Info } from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { invitationAPI } from '../utils/api';

// Расширенный интерфейс для команды с поддержкой новых полей
interface Team {
	id: string;
	name: string;
	discription: string;
	CompetitionId: string;
	Competition?: {
		id: string;
		name: string;
		discription: string;
		status: string;
	};
	teammembers?: {
		id: string;
		UserId: string;
		TeamId: string;
		is_capitan: boolean;
		User?: {
			id: string;
			email: string;
			user_info?: {
				firstName: string;
				lastName: string;
				middleName: string;
				phone: string;
			};
		};
	}[];
	lookingForMembers: boolean;
	availableSlots: number;
	requiredRoles: string;
	createdAt: string;
}

// Добавляем функцию форматирования имени пользователя
const formatUserName = (user: any) => {
	if (!user) {
		return 'Участник';
	}

	// Проверяем наличие user_info напрямую
	if (!user.user_info) {
		return user.email || `Участник (ID: ${user.id || 'Неизвестен'})`;
	}

	const { firstName, lastName, middleName } = user.user_info;
	const parts = [
		lastName || '',
		firstName || '',
		middleName || ''
	].filter(Boolean);

	return parts.length > 0 ? parts.join(' ') : (user.email || `Участник (ID: ${user.id || 'Неизвестен'})`);
};

interface TeamMember {
	id: string;
	UserId: string;
	TeamId: string;
	is_capitan: boolean;
	user?: {
		id: string;
		email: string;
		user_info?: {
			firstName: string;
			lastName: string;
			middleName: string;
			phone: string;
		};
	};
}

const TeamsPage: React.FC = () => {
	const [teams, setTeams] = useState<Team[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const { user } = useAuthStore();
	const [teamRequests, setTeamRequests] = useState<Record<string, {
		exists: boolean,
		status?: string,
		isMember?: boolean,
		requestId?: string
	}>>({});
	const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
	const [showFilters, setShowFilters] = useState<boolean>(false);

	useEffect(() => {
		const fetchTeams = async () => {
			try {
				setLoading(true);
				const data = await teamsAPI.getTeamsLookingForMembers();
				console.log('Полученные данные о командах:', data);

				// Преобразуем данные, чтобы убедиться, что структура соответствует ожиданиям
				const teamsWithUserInfo = data.map((team: Team) => ({
					...team,
					teammembers: team.teammembers?.map((member: any) => {
						console.log('Обработка участника:', member);
						// Получаем данные пользователя из свойства user
						const userInfo = member.user?.user_info;
						console.log('User info:', userInfo);
						
						return {
							...member,
							user_info: userInfo
						};
					})
				}));

				console.log('Обработанные данные команд:', teamsWithUserInfo);
				setTeams(teamsWithUserInfo);
				setError(null);

				// Если пользователь авторизован, проверяем заявки для каждой команды
				if (user && teamsWithUserInfo.length > 0) {
					const requests: Record<string, {
						exists: boolean,
						status?: string,
						isMember?: boolean,
						requestId?: string
					}> = {};

					for (const team of teamsWithUserInfo) {
						try {
							const response = await invitationAPI.checkJoinRequest(team.id);
							requests[team.id] = response;
						} catch (err) {
							console.error(`Ошибка при проверке заявки для команды ${team.id}:`, err);
							requests[team.id] = { exists: false };
						}
					}
					setTeamRequests(requests);
				}
			} catch (err) {
				setError('Ошибка при загрузке команд');
				console.error('Ошибка при загрузке команд:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchTeams();
	}, [user]);

	// Функция для отправки заявки на присоединение к команде
	const handleJoinRequest = async (teamId: string, competitionId: string) => {
		try {
			setLoading(true);
			console.log('Отправляем запрос на присоединение к команде:', {
				TeamId: teamId,
				CompetitionId: competitionId,
				CurrentUser: user
			});

			// Проверяем, нет ли уже отправленного запроса
			const checkResult = await invitationAPI.checkJoinRequest(teamId);
			if (checkResult.exists) {
				alert('Вы уже отправили запрос на присоединение к этой команде!');
				setTeamRequests({
					...teamRequests,
					[teamId]: checkResult
				});
				setLoading(false);
				return;
			}

			// Если уже член команды
			if (checkResult.isMember) {
				alert('Вы уже являетесь членом этой команды!');
				setLoading(false);
				return;
			}

			// Используем метод API для отправки запроса на присоединение
			const response = await invitationAPI.createJoinRequest({
				TeamId: teamId,
				CompetitionId: competitionId
			});

			console.log('Успешный ответ от сервера:', response);
			alert('Заявка на присоединение успешно отправлена!');

			// Обновляем состояние запросов
			setTeamRequests({
				...teamRequests,
				[teamId]: { exists: true, status: 'pending', requestId: response.id }
			});
		} catch (error: any) {
			console.error('Ошибка при отправке заявки:', error);
			if (error.response) {
				console.error('Статус ошибки:', error.response.status);
				console.error('Данные ошибки:', error.response.data);
			}
			alert(error.response?.data?.message || 'Ошибка при отправке заявки');
		} finally {
			setLoading(false);
		}
	};

	// Получение статуса кнопки и текста для команды
	const getJoinButtonState = (teamId: string) => {
		if (!user) {
			return { text: 'Для подачи заявки войдите в систему', disabled: true, variant: 'primary' as const };
		}

		const request = teamRequests[teamId];
		if (!request) {
			return { text: 'Подать заявку', disabled: false, variant: 'primary' as const };
		}

		if (request.isMember) {
			return { text: 'Вы участник команды', disabled: true, variant: 'primary' as const };
		}

		if (request.exists) {
			switch (request.status) {
				case 'pending':
					return { text: 'Заявка отправлена', disabled: true, variant: 'outline' as const };
				case 'accepted':
					return { text: 'Заявка принята', disabled: true, variant: 'primary' as const };
				case 'rejected':
					return { text: 'Заявка отклонена', disabled: true, variant: 'primary' as const };
				default:
					return { text: 'Подать заявку', disabled: false, variant: 'primary' as const };
			}
		}

		return { text: 'Подать заявку', disabled: false, variant: 'primary' as const };
	};

	return (
		<div className="container mx-auto px-4 py-8 pt-20 max-w-7xl">
			{/* Hero section */}
			<div className="relative overflow-hidden bg-white rounded-3xl mb-12">
				<div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-violet-50 opacity-70"></div>
				<div className="absolute -right-16 -top-16 w-64 h-64 bg-primary-300 rounded-full opacity-20 blur-3xl"></div>
				<div className="absolute -left-20 -bottom-20 w-80 h-80 bg-violet-300 rounded-full opacity-20 blur-3xl"></div>

				<div className="relative z-10 px-8 py-16 sm:px-12 md:px-16">
					<div className="max-w-4xl">
						<h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-primary-600 to-violet-600 text-transparent bg-clip-text">
							Найдите свою команду мечты
						</h1>
						<p className="text-xl text-neutral-700 max-w-3xl mb-8 leading-relaxed">
							Исследуйте команды, которые активно ищут талантливых участников для захватывающих проектов и соревнований. Отправляйте заявки и становитесь частью чего-то великого!
						</p>

						<div className="flex flex-wrap gap-4 mt-2">
							<Button
								size="lg"
								className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 border-none shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
								leftIcon={<Users className="h-5 w-5" />}
								onClick={() => window.scrollTo({ top: 500, behavior: 'smooth' })}
							>
								Исследовать команды
							</Button>
							<Button
								variant="outline"
								size="lg"
								className="border-2 border-primary-200 text-primary-700 hover:bg-primary-50"
								leftIcon={<Info className="h-5 w-5" />}
								onClick={() => window.location.href = '/competitions'}
							>
								Узнать о соревнованиях
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div className="mb-16">
				<div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
					<div>
						<h2 className="text-2xl font-bold mb-2 text-neutral-800">
							Команды, ищущие участников
						</h2>
						<p className="text-neutral-600">
							{teams.length > 0
								? `Найдено ${teams.length} ${teams.length === 1 ? 'команда' : teams.length < 5 ? 'команды' : 'команд'}`
								: 'Загрузка списка команд...'}
						</p>
					</div>

					<div className="flex gap-3">
						<Button
							variant="outline"
							size="md"
							className={`border-neutral-200 bg-white/100 ${showFilters ? 'bg-neutral-100 text-neutral-800' : 'text-neutral-600'}`}
							leftIcon={<Filter className="h-4 w-4" />}
							onClick={() => setShowFilters(!showFilters)}
						>
							Фильтры
						</Button>
						<select
							className="px-4 py-2 rounded-lg text-sm border border-neutral-200 bg-white/100 text-neutral-700 focus:border-primary-400 focus:ring-2 focus:ring-primary-400/10 focus:outline-none cursor-pointer"
							defaultValue="newest"
						>
							<option value="newest">Сначала новые</option>
							<option value="oldest">Сначала старые</option>
							<option value="most_slots">Больше свободных мест</option>
						</select>
					</div>
				</div>

				{showFilters && (
					<div className="bg-white rounded-xl p-4 mb-8 border border-neutral-200 shadow-sm transition-all duration-300 grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium mb-2 text-neutral-700">Соревнование</label>
							<select className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400">
								<option value="">Любое соревнование</option>
								{/* Здесь можно динамически добавить список соревнований */}
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2 text-neutral-700">Количество мест</label>
							<select className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400">
								<option value="">Любое количество</option>
								<option value="1">1 место</option>
								<option value="2">2 места</option>
								<option value="3+">3 и более</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2 text-neutral-700">Специализация</label>
							<select className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400">
								<option value="">Любая специализация</option>
								<option value="developer">Разработчик</option>
								<option value="designer">Дизайнер</option>
								<option value="analyst">Аналитик</option>
							</select>
						</div>
					</div>
				)}

				{loading && teams.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-32">
						<div className="relative">
							<div className="absolute inset-0 z-0 bg-primary-100 rounded-full animate-ping opacity-30 w-16 h-16"></div>
							<div className="relative z-10 animate-spin h-16 w-16 border-4 border-primary-500 rounded-full border-t-transparent"></div>
						</div>
						<p className="mt-6 text-neutral-600 font-medium">Загрузка команд...</p>
					</div>
				) : error ? (
					<div className="bg-white border-l-4 border-red-500 rounded-lg shadow-lg overflow-hidden">
						<div className="p-5">
							<div className="flex items-center mb-3">
								<div className="bg-red-100 text-red-500 rounded-full p-2 mr-3">
									<svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<h3 className="text-lg font-semibold text-neutral-800">Не удалось загрузить данные</h3>
							</div>
							<p className="text-neutral-700 ml-11">{error}</p>
							<Button
								variant="outline"
								size="sm"
								className="mt-3 ml-11 border-red-200 text-red-600 hover:bg-red-50"
								onClick={() => window.location.reload()}
							>
								Попробовать снова
							</Button>
						</div>
					</div>
				) : teams.length === 0 ? (
					<div className="bg-white rounded-2xl border border-neutral-100 shadow overflow-hidden">
						<div className="bg-neutral-50 p-12 flex flex-col items-center">
							<div className="relative mb-6">
								<div className="absolute inset-0 bg-primary-100 rounded-full animate-pulse opacity-30 w-24 h-24"></div>
								<Search className="relative z-10 h-24 w-24 text-primary-400 opacity-80" />
							</div>
							<h2 className="text-2xl font-bold mb-3 text-neutral-800">Команды пока не найдены</h2>
							<p className="text-neutral-600 max-w-lg mx-auto mb-8 text-center">
								В данный момент нет команд, которые ищут участников. Вы можете создать свою команду при регистрации на соревнование.
							</p>
							<Button
								size="lg"
								leftIcon={<Sparkles className="h-5 w-5" />}
								className="shadow-lg shadow-primary-500/20 bg-gradient-to-r from-primary-600 to-violet-600 hover:from-primary-500 hover:to-violet-500 border-none"
								onClick={() => window.location.href = '/competitions'}
							>
								Перейти к соревнованиям
							</Button>
						</div>
						<div className="p-8 bg-gradient-to-r from-violet-50 to-primary-50 border-t border-neutral-100">
							<h3 className="font-semibold text-lg mb-3 text-neutral-800">Что можно сделать?</h3>
							<ul className="space-y-2">
								<li className="flex items-start">
									<div className="bg-violet-100 p-1 rounded-full mr-3 mt-0.5">
										<Award className="h-4 w-4 text-violet-600" />
									</div>
									<p className="text-neutral-700">Зарегистрироваться на соревнование и создать свою команду</p>
								</li>
								<li className="flex items-start">
									<div className="bg-primary-100 p-1 rounded-full mr-3 mt-0.5">
										<Users className="h-4 w-4 text-primary-600" />
									</div>
									<p className="text-neutral-700">Указать, что вам требуются дополнительные участники</p>
								</li>
								<li className="flex items-start">
									<div className="bg-emerald-100 p-1 rounded-full mr-3 mt-0.5">
										<Code className="h-4 w-4 text-emerald-600" />
									</div>
									<p className="text-neutral-700">Описать требуемые навыки и специализации для вашего проекта</p>
								</li>
							</ul>
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
						{teams.map((team) => {
							const buttonState = getJoinButtonState(team.id);
							const isCapitan = team.teammembers?.some(member => member.is_capitan && member.UserId === user?.id);
							const isExpanded = expandedTeam === team.id;

							return (
								<Card
									key={team.id}
									className="group relative overflow-hidden rounded-xl border border-neutral-200 hover:border-primary-300 transition-all duration-300 hover:shadow-xl bg-white/100"
								>
									{/* Glassmorphism decoration elements */}
									<div className="absolute -right-8 -top-8 w-16 h-16 bg-primary-400 rounded-full opacity-10"></div>
									<div className="absolute -left-8 -bottom-8 w-20 h-20 bg-violet-400 rounded-full opacity-10"></div>

									<CardHeader className="pb-3 border-b border-neutral-100">
										<div className="flex flex-wrap gap-2 mb-3">
											<Badge
												variant="success"
												className="font-medium shadow-sm shadow-emerald-200/50"
											>
												Набор открыт
											</Badge>
											<Badge
												variant="primary"
												className="font-medium shadow-sm bg-blue-100 border-none"
											>
												{team.availableSlots} {
													team.availableSlots === 1 ? 'место' :
														team.availableSlots < 5 ? 'места' : 'мест'
												}
											</Badge>
										</div>
										<CardTitle className="text-xl font-bold group-hover:text-primary-600 transition-colors duration-300">
											{team.name}
										</CardTitle>
										{team.Competition && (
											<div className="flex items-center text-sm text-neutral-600 mt-2">
												<Award className="h-4 w-4 mr-1.5 text-primary-400" />
												{team.Competition.name}
											</div>
										)}
									</CardHeader>

									<CardContent className="pt-4 relative z-10">
										{team.discription && (
											<div className="mb-5">
												<p className={`text-neutral-700 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
													{team.discription}
												</p>
												{team.discription.length > 150 && (
													<button
														className="text-sm text-primary-600 hover:text-primary-700 mt-2 flex items-center transition-colors duration-200 font-medium"
														onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
													>
														{isExpanded ? 'Свернуть' : 'Читать полностью'}
														<ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
													</button>
												)}
											</div>
										)}

										{team.teammembers && team.teammembers.length > 0 && (
											<div className="mb-5 bg-gradient-to-br from-neutral-50 to-white backdrop-blur-sm backdrop-filter p-4 rounded-lg border border-neutral-100 shadow-sm">
												<h4 className="text-sm font-semibold mb-3 flex items-center">
													<Users className="h-4 w-4 mr-1.5 text-neutral-500" />
													Текущий состав команды:
												</h4>
												<ul className="space-y-2">
													{team.teammembers.map((member: any) => (
														<li key={member.id} className="flex items-center text-sm bg-white px-3 py-2 rounded-md shadow-sm border border-neutral-100">
															{member.is_capitan ? (
																<span className="flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 rounded-full w-6 h-6 mr-2.5" title="Капитан команды">
																	★
																</span>
															) : (
																<span className="flex items-center justify-center bg-neutral-100 text-neutral-500 rounded-full w-6 h-6 mr-2.5">
																	<Users className="h-3 w-3" />
																</span>
															)}
															<span className={`${member.is_capitan ? 'font-medium' : ''}`}>
																{member.user?.user_info ? (
																	`${member.user.user_info.lastName || ''} ${member.user.user_info.firstName || ''} ${member.user.user_info.middleName || ''}`.trim() + 
																	(member.user.email ? ` (${member.user.email})` : '') || 
																	`Участник (ID: ${member.UserId})`
																) : (
																	`Участник (ID: ${member.UserId})`
																)}
															</span>
														</li>
													))}
												</ul>
											</div>
										)}

										{team.requiredRoles && (
											<div>
												<h4 className="text-sm font-semibold mb-2 flex items-center">
													<Target className="h-4 w-4 mr-1.5 text-neutral-500" />
													Требуемые специализации:
												</h4>
												<div className="bg-gradient-to-br from-neutral-50 to-white backdrop-blur-sm backdrop-filter p-4 rounded-lg border border-neutral-100 shadow-sm">
													<p className="text-sm text-neutral-700">{team.requiredRoles}</p>
												</div>
											</div>
										)}
									</CardContent>

									<CardFooter className="pt-4 pb-5 border-t border-neutral-100 relative z-10">
										<div className="w-full">
											{user ? (
												isCapitan ? (
													<div className="text-center py-2.5 px-3 bg-gradient-to-r from-neutral-100 to-neutral-50 rounded-lg text-neutral-700 text-sm font-medium border border-neutral-200 shadow-sm">
														Вы капитан этой команды
													</div>
												) : (
													<Button
														variant={buttonState.variant}
														size="md"
														fullWidth
														leftIcon={<UserPlus className="h-4 w-4" />}
														onClick={() => handleJoinRequest(team.id, team.CompetitionId)}
														disabled={buttonState.disabled || loading}
														className={`rounded-xl ${buttonState.variant === 'outline'
															? 'border-primary-400 text-primary-700'
															: 'shadow-lg shadow-primary-500/20 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 border-none'
															} transition-all duration-200 hover:shadow-xl hover:scale-[1.02]`}
													>
														{buttonState.text}
													</Button>
												)
											) : (
												<div className="flex items-center justify-center backdrop-blur-sm backdrop-filter bg-white/80 border border-neutral-200 rounded-lg p-3.5 text-neutral-600 text-sm shadow-sm">
													<UserSearch className="h-4 w-4 mr-2 text-neutral-400" />
													Для подачи заявки войдите в систему
												</div>
											)}
										</div>
									</CardFooter>
								</Card>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default TeamsPage; 