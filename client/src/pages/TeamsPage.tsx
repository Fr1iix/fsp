import React, { useEffect, useState } from 'react';
import { teamsAPI } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { Users, Search, UserPlus } from 'lucide-react';
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
	// Обновляем интерфейс, добавляя isMember и requestId
	const [teamRequests, setTeamRequests] = useState<Record<string, {
		exists: boolean, 
		status?: string, 
		isMember?: boolean,
		requestId?: string
	}>>({});

	useEffect(() => {
		const fetchTeams = async () => {
			try {
				setLoading(true);
				const data = await teamsAPI.getTeamsLookingForMembers();
				console.log('Полученные данные о командах:', data);
				
				// Преобразуем данные, чтобы убедиться, что структура соответствует ожиданиям
				const teamsWithUserInfo = data.map((team: Team) => ({
					...team,
					teammembers: team.teammembers?.map((member: any) => ({
						...member,
						user: member.user || member.User // Поддерживаем оба варианта
					}))
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

	if (loading && teams.length === 0) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto px-4 py-8 pt-24">
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
					<strong className="font-bold">Ошибка!</strong>
					<span className="block sm:inline"> {error}</span>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8 pt-24">
			<div className="flex flex-wrap items-center justify-between mb-6">
				<div>
					<h1 className="text-3xl font-bold">Команды, которые ищут участников</h1>
					<p className="text-neutral-500 mt-1">
						Здесь вы можете найти команды, которым требуются дополнительные участники
					</p>
				</div>
			</div>

			{teams.length === 0 ? (
				<div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
					<Search className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
					<h2 className="text-xl font-medium mb-2">Пока нет команд, которые ищут участников</h2>
					<p className="text-neutral-500 max-w-md mx-auto">
						Вы можете создать свою команду при регистрации на соревнование и указать, что ищете дополнительных участников.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{teams.map((team) => {
						const buttonState = getJoinButtonState(team.id);
						
						return (
							<Card key={team.id} className="overflow-hidden hover:shadow-md transition-shadow">
								<CardHeader>
									<div className="flex flex-wrap gap-2 mb-2">
										<Badge variant="success">Набор открыт</Badge>
										<Badge variant="primary">{team.availableSlots} {
											team.availableSlots === 1 ? 'место' : 
											team.availableSlots < 5 ? 'места' : 'мест'
										}</Badge>
									</div>
									<CardTitle className="line-clamp-2">{team.name}</CardTitle>
									{team.Competition && (
										<div className="text-sm text-neutral-500 mt-1">
											Соревнование: {team.Competition.name}
										</div>
									)}
								</CardHeader>
								
								<CardContent>
									{team.discription && (
										<p className="text-neutral-700 mb-4 line-clamp-3">{team.discription}</p>
									)}
									
									{team.teammembers && team.teammembers.length > 0 && (
										<div className="mb-4">
											<h4 className="text-sm font-medium mb-2">Текущий состав команды:</h4>
											<ul className="space-y-1">
												{team.teammembers.map((member: TeamMember) => (
													<li key={member.id} className="flex items-center text-sm">
														{member.is_capitan && <span className="text-primary-600 font-medium mr-1">★</span>}
														<span>
															{member.user?.user_info ? (
																`${member.user.user_info.lastName || ''} ${member.user.user_info.firstName || ''} ${member.user.user_info.middleName || ''}`.trim() +
																(member.user.email ? ` (${member.user.email})` : '')
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
											<h4 className="text-sm font-medium mb-2">Требуемые специализации:</h4>
											<p className="text-sm text-neutral-600">{team.requiredRoles}</p>
										</div>
									)}
								</CardContent>
								
								<CardFooter>
									<div className="w-full">
										{user ? (
											<Button 
												variant={buttonState.variant}
												size="sm" 
												fullWidth 
												leftIcon={<UserPlus className="h-4 w-4" />}
												onClick={() => handleJoinRequest(team.id, team.CompetitionId)}
												disabled={buttonState.disabled || loading}
											>
												{buttonState.text}
											</Button>
										) : (
											<div className="text-neutral-500 text-sm italic text-center">
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
	);
};

export default TeamsPage; 