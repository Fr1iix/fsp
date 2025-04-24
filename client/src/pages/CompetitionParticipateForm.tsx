import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, User, Plus, X, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Competition, Team, CompetitionFormat, CompetitionDiscipline } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { teamsAPI, competitionAPI, invitationAPI } from '../utils/api';
import Badge from '../components/ui/Badge';

// Адаптер для преобразования данных сервера в формат фронтенда
const adaptCompetition = (serverCompetition: any): Competition => {
  console.log('Обрабатываем соревнование с сервера:', serverCompetition);

  // Проверка наличия необходимых полей
  if (!serverCompetition || !serverCompetition.id) {
    console.error('Получено некорректное соревнование:', serverCompetition);
    throw new Error('Некорректные данные соревнования');
  }

  const result = {
    id: serverCompetition.id.toString(),
    title: serverCompetition.name || 'Без названия',
    description: serverCompetition.discription || 'Без описания',
    format: serverCompetition.format as CompetitionFormat || 'regional',
    discipline: serverCompetition.type as CompetitionDiscipline || 'product',
    registrationStart: serverCompetition.startdate || new Date().toISOString(),
    registrationEnd: serverCompetition.enddate || new Date().toISOString(),
    startDate: serverCompetition.startdate_cometition || serverCompetition.startdate || new Date().toISOString(),
    endDate: serverCompetition.enddate_cometition || serverCompetition.enddate || new Date().toISOString(),
    status: mapServerStatus(serverCompetition.status),
    createdBy: serverCompetition.createdBy || '',
    region: serverCompetition.regionId ? [serverCompetition.regionId.toString()] : [],
    maxParticipants: serverCompetition.maxParticipants || 0,
    createdAt: serverCompetition.createdAt || new Date().toISOString(),
    updatedAt: serverCompetition.updatedAt || new Date().toISOString()
  };

  console.log('Преобразованное соревнование:', result);
  return result;
};

// Преобразование статуса с сервера в формат фронтенда
const mapServerStatus = (serverStatus: string): "draft" | "registration" | "in_progress" | "completed" | "cancelled" => {
  const statusMap: Record<string, any> = {
    'Регистрация открыта': 'registration',
    'В процессе': 'in_progress',
    'Завершено': 'completed',
    'Отменено': 'cancelled',
    'Черновик': 'draft'
  };

  return statusMap[serverStatus] || 'registration';
};

const CompetitionParticipateForm: React.FC = () => {
  const { id: competitionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние для формы создания команды
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [participants, setParticipants] = useState<string[]>(['']); // Начинаем с одного пустого поля
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [teamCreationSuccess, setTeamCreationSuccess] = useState(false);
  const [teamCreationError, setTeamCreationError] = useState<string | null>(null);
  
  // Новые состояния для поиска участников
  const [lookingForMembers, setLookingForMembers] = useState(false);
  const [availableSlots, setAvailableSlots] = useState(0);
  const [requiredRoles, setRequiredRoles] = useState('');

  // Загрузка данных о соревновании
  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Получаем список всех соревнований, а затем находим нужное по ID
        console.log(`Получаем соревнование с ID: ${competitionId}`);
        const allCompetitions = await competitionAPI.getAll();
        console.log('Получены соревнования:', allCompetitions);
        
        // Ищем нужное соревнование и адаптируем его
        const foundCompetition = allCompetitions.find(comp => 
          comp.id.toString() === competitionId?.toString()
        );
        
        if (foundCompetition) {
          console.log('Найдено соревнование:', foundCompetition);
          const adaptedCompetition = adaptCompetition(foundCompetition);
          setCompetition(adaptedCompetition);
        } else {
          console.error('Соревнование не найдено в списке');
          setError('Соревнование не найдено');
        }
      } catch (error) {
        console.error('Error fetching competition:', error);
        setError('Не удалось загрузить информацию о соревновании');
      } finally {
        setLoading(false);
      }
    };

    if (competitionId) {
      fetchCompetition();
    }
  }, [competitionId]);

  // Функция для добавления нового поля участника
  const addParticipantField = () => {
    setParticipants([...participants, '']);
  };

  // Функция для удаления поля участника
  const removeParticipantField = (index: number) => {
    const newParticipants = [...participants];
    newParticipants.splice(index, 1);
    setParticipants(newParticipants);
  };

  // Функция для обновления значения поля участника
  const updateParticipant = (index: number, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = value;
    setParticipants(newParticipants);
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      setTeamCreationError('Необходимо указать название команды');
      return;
    }

    // Фильтруем пустые идентификаторы участников
    const validParticipants = participants.filter(p => p.trim() !== '');
    
    try {
      setCreatingTeam(true);
      setTeamCreationError(null);
      
      // 1. Создаем команду
      const teamData = {
        name: teamName,
        discription: teamDescription,
        CompetitionId: competitionId ?? '',
        points: 0,
        result: 0,
        teammembersId: null,
        lookingForMembers: lookingForMembers,
        availableSlots: lookingForMembers ? availableSlots : 0,
        requiredRoles: lookingForMembers ? requiredRoles : ''
      };
      
      console.log('Отправка запроса на создание команды:', teamData);
      const createdTeam = await teamsAPI.create(teamData);
      console.log('Команда успешно создана:', createdTeam);
      
      // 2. Добавляем текущего пользователя как капитана
      if (user && createdTeam.id) {
        console.log('Добавление капитана:', {
          UserId: user.id,
          TeamId: createdTeam.id,
          is_capitan: true
        });
        
        try {
          await teamsAPI.addMember({
            UserId: user.id,
            TeamId: createdTeam.id,
            is_capitan: true
          });
          console.log('Капитан команды добавлен');
        } catch (memberError: any) {
          console.error('Ошибка при добавлении капитана:', memberError);
          throw new Error('Не удалось добавить капитана команды: ' + (memberError.message || 'Неизвестная ошибка'));
        }
      }
      
      // 3. Отправляем приглашения остальным участникам если есть
      if (validParticipants.length > 0) {
        for (const participantId of validParticipants) {
          console.log(`Отправка приглашения участнику ${participantId} для команды ${createdTeam.id}`);
          try {
            await invitationAPI.create({
              UserId: participantId,
              TeamId: createdTeam.id,
              CompetitionId: competitionId ?? ''
            });
            console.log('Приглашение успешно отправлено');
          } catch (inviteError: any) {
            console.error('Ошибка при отправке приглашения:', inviteError);
            // Здесь можно добавить логику обработки ошибки, например, показать уведомление
          }
        }
      }
      
      // 4. Создаем заявку на участие в соревновании
      if (user && createdTeam.id) {
        const applicationData = {
          UserId: user.id,
          TeamId: createdTeam.id,
          CompetitionId: competitionId ?? '',
          status: 'pending'
        };
        
        console.log('Отправка заявки на участие в соревновании:', applicationData);
        await teamsAPI.submitApplication(applicationData);
        console.log('Заявка успешно отправлена');
      }
      
      setTeamCreationSuccess(true);
    } catch (err: any) {
      console.error('Ошибка при создании команды:', err);
      setTeamCreationError(err.message || 'Ошибка при создании команды');
    } finally {
      setCreatingTeam(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 pt-24">
        <div className="flex justify-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-primary-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 pt-24">
        <div className="text-center py-12">
          <p className="text-xl text-neutral-600 mb-4">{error || 'Соревнование не найдено'}</p>
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate('/competitions')}
          >
            Вернуться к списку соревнований
          </Button>
        </div>
      </div>
    );
  }

  // Проверяем, открыта ли регистрация
  const isRegistrationOpen = competition.status === 'registration';

  if (!isRegistrationOpen) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 pt-24">
        <div className="mb-6">
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(`/competitions/${competitionId}`)}
          >
            Вернуться к соревнованию
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Регистрация на соревнование</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="py-6 text-center">
              <Badge variant="error" className="mb-4">Регистрация закрыта</Badge>
              <p className="text-neutral-600">
                К сожалению, регистрация на данное соревнование уже закрыта или еще не открыта.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 pt-24">
      <div className="mb-6">
        <Button
          variant="outline"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate(`/competitions/${competitionId}`)}
        >
          Вернуться к соревнованию
        </Button>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Участие в соревновании</h1>
        <p className="text-neutral-500">{competition.title}</p>
      </div>
      
      {teamCreationSuccess ? (
        <Card className="mb-8">
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 flex items-center justify-center rounded-full mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-800 mb-2">Заявка отправлена!</h2>
              <p className="text-neutral-600 mb-6">
                Ваша заявка на участие в соревновании успешно отправлена и ожидает подтверждения участниками команды.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate(`/competitions/${competitionId}`)}
              >
                Вернуться к соревнованию
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Создание команды
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Название команды*
                </label>
                <Input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Введите название команды"
                  className="w-full"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Описание команды
                </label>
                <textarea
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Кратко опишите вашу команду"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>
              
              {/* Новая секция: Поиск участников */}
              <div className="mb-6 border rounded-lg p-4 bg-blue-50 border-blue-100">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="lookingForMembers"
                    checked={lookingForMembers}
                    onChange={(e) => setLookingForMembers(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                  />
                  <label htmlFor="lookingForMembers" className="ml-2 block text-sm font-medium text-neutral-700">
                    Требуются спортсмены
                  </label>
                </div>
                
                {lookingForMembers && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Количество свободных мест
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={availableSlots}
                        onChange={(e) => setAvailableSlots(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Требуемые роли / специализации
                      </label>
                      <textarea
                        value={requiredRoles}
                        onChange={(e) => setRequiredRoles(e.target.value)}
                        placeholder="Например: разработчик бэкенда, дизайнер интерфейса, тестировщик и т.д."
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        rows={2}
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Укажите, какие специалисты вам нужны. Эта информация будет отображаться в списке команд, ищущих участников.
                      </p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    Участники команды*
                  </label>
                  <span className="text-xs text-neutral-500">
                    Вы автоматически будете добавлены как капитан команды
                  </span>
                </div>
                
                <div className="mb-2 p-3 bg-neutral-50 rounded-lg">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-primary-500" />
                    <div>
                      <div className="text-sm font-medium">{user?.firstName} {user?.lastName} (вы)</div>
                      <div className="text-xs text-neutral-500">Капитан команды</div>
                    </div>
                  </div>
                </div>
                
                {participants.map((participant, index) => (
                  <div key={index} className="mb-3 flex items-center gap-2">
                    <Input
                      value={participant}
                      onChange={(e) => updateParticipant(index, e.target.value)}
                      placeholder="ID участника"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeParticipantField(index)}
                      className="shrink-0 w-10 h-10 p-0 flex items-center justify-center"
                      disabled={participants.length === 1 && index === 0}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addParticipantField}
                  className="mt-2"
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Добавить еще участника
                </Button>
              </div>
              
              {teamCreationError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-md text-red-700 text-sm">
                  {teamCreationError}
                </div>
              )}
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={creatingTeam}
                  className="w-full md:w-auto"
                >
                  {creatingTeam ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Создание команды...
                    </>
                  ) : (
                    'Создать команду'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompetitionParticipateForm; 