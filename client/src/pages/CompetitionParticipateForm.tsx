import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, User, Plus, X, ArrowLeft, CheckCircle2, AlertCircle, Trophy, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Competition, Team, CompetitionFormat, CompetitionDiscipline } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { teamsAPI, competitionAPI, invitationAPI } from '../utils/api';
import Badge from '../components/ui/Badge';
import { motion } from 'framer-motion';

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
      <div className="min-h-screen pt-24">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="flex justify-center py-16">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-t-4 border-primary-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-2 border-primary-200"></div>
              <div className="absolute inset-0 flex items-center justify-center text-primary-600 font-semibold">
                <Users className="h-8 w-8 opacity-75" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="min-h-screen pt-24">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-500" />
            </div>
            <p className="text-xl text-neutral-600 mb-4">{error || 'Соревнование не найдено'}</p>
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate('/competitions')}
              className="shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              Вернуться к списку соревнований
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Проверяем, открыта ли регистрация
  const isRegistrationOpen = competition.status === 'registration';

  if (!isRegistrationOpen) {
    return (
      <div className="min-h-screen pt-24">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="mb-6">
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(`/competitions/${competitionId}`)}
              className="shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              Вернуться к соревнованию
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-0 shadow-xl rounded-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-red-400 to-red-600"></div>
              <CardHeader className="bg-white">
                <CardTitle>Регистрация на соревнование</CardTitle>
              </CardHeader>
              <CardContent className="bg-white">
                <div className="py-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <Badge variant="error" className="mb-4 px-4 py-1 text-sm">Регистрация закрыта</Badge>
                  <p className="text-neutral-600 max-w-md mx-auto">
                    К сожалению, регистрация на данное соревнование уже закрыта или еще не открыта.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Button
            variant="outline"
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => navigate(`/competitions/${competitionId}`)}
            className="shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            Вернуться к соревнованию
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2 text-neutral-800 flex items-center">
            <Trophy className="h-8 w-8 text-amber-500 mr-3" />
            Участие в соревновании
          </h1>
          <p className="text-neutral-500 text-lg pl-11">{competition.title}</p>
        </motion.div>

        {teamCreationSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>
              <CardContent className="py-16 bg-white">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.3,
                      type: "spring",
                      stiffness: 200
                    }}
                    className="w-28 h-28 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center rounded-full mx-auto mb-8 shadow-lg"
                  >
                    <CheckCircle2 className="h-14 w-14 text-emerald-600" />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-neutral-800 mb-4">Заявка отправлена!</h2>
                  <p className="text-neutral-600 mb-10 max-w-lg mx-auto text-lg">
                    Ваша заявка на участие в соревновании успешно отправлена и ожидает подтверждения участниками команды.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => navigate(`/competitions/${competitionId}`)}
                    className="px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300 rounded-full"
                  >
                    Вернуться к соревнованию
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden backdrop-blur-sm relative">
              <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-blue-500 blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-indigo-500 blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
              </div>

              <CardHeader className="bg-white border-b border-slate-100 relative z-10">
                <CardTitle className="flex items-center text-xl">
                  <Shield className="h-6 w-6 mr-3 text-indigo-600" />
                  Создание команды
                </CardTitle>
              </CardHeader>

              <CardContent className="bg-white pt-8 relative z-10">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-base font-medium text-neutral-700 mb-2">
                        Название команды*
                      </label>
                      <Input
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        placeholder="Введите название команды"
                        className="w-full shadow-sm focus:ring-2 focus:ring-indigo-500 transition-shadow duration-300 text-base py-3"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-neutral-700 mb-2">
                        Описание команды
                      </label>
                      <textarea
                        value={teamDescription}
                        onChange={(e) => setTeamDescription(e.target.value)}
                        placeholder="Кратко опишите вашу команду"
                        className="w-full px-4 py-3 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 text-base"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Секция: Поиск участников */}
                  <div
                    className={`p-6 rounded-2xl border shadow-md transition-all duration-300 ${lookingForMembers
                      ? "bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-50 border-indigo-200"
                      : "bg-slate-50 border-slate-200 hover:border-indigo-200"
                      }`}
                  >
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="lookingForMembers"
                        checked={lookingForMembers}
                        onChange={(e) => setLookingForMembers(e.target.checked)}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-neutral-300 rounded-md cursor-pointer"
                      />
                      <label htmlFor="lookingForMembers" className="ml-3 block text-base font-medium text-neutral-800 cursor-pointer">
                        Требуются спортсмены
                      </label>
                    </div>

                    {lookingForMembers && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4 pl-8 pt-2"
                      >
                        <div>
                          <label className="block text-base font-medium text-neutral-700 mb-2">
                            Количество свободных мест
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={availableSlots}
                            onChange={(e) => setAvailableSlots(parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 text-base"
                          />
                        </div>

                        <div>
                          <label className="block text-base font-medium text-neutral-700 mb-2">
                            Требуемые роли / специализации
                          </label>
                          <textarea
                            value={requiredRoles}
                            onChange={(e) => setRequiredRoles(e.target.value)}
                            placeholder="Например: разработчик бэкенда, дизайнер интерфейса, тестировщик и т.д."
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 text-base"
                            rows={2}
                          />
                          <p className="text-sm text-neutral-500 mt-2 italic">
                            Укажите, какие специалисты вам нужны. Эта информация будет отображаться в списке команд, ищущих участников.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-800 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-indigo-600" />
                        Участники команды
                      </h3>
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 shadow-sm">
                        Вы — капитан команды
                      </Badge>
                    </div>

                    <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-inner mb-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mr-4 shadow-md">
                          <User className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <div className="text-base font-medium text-neutral-800">{user?.firstName} {user?.lastName} (вы)</div>
                          <div className="text-sm text-neutral-500">Капитан команды</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">Другие участники:</h4>

                      {participants.map((participant, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Input
                            value={participant}
                            onChange={(e) => updateParticipant(index, e.target.value)}
                            placeholder="ID участника"
                            className="flex-1 shadow-sm focus:ring-2 focus:ring-indigo-500 transition-shadow duration-300 py-3 text-base"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeParticipantField(index)}
                            className="shrink-0 w-12 h-12 p-0 flex items-center justify-center shadow-sm hover:shadow transition-shadow duration-300 rounded-xl border-neutral-300"
                            disabled={participants.length === 1 && index === 0}
                          >
                            <X className="h-5 w-5 text-neutral-500" />
                          </Button>
                        </motion.div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addParticipantField}
                        className="w-full py-3 mt-2 bg-gradient-to-r from-slate-50 to-indigo-50 shadow-sm hover:shadow-md transition-all duration-300 border-dashed border-indigo-200 text-indigo-700 hover:text-indigo-800 hover:border-indigo-300 rounded-xl"
                        leftIcon={<Plus className="h-5 w-5" />}
                      >
                        Добавить еще участника
                      </Button>
                    </div>
                  </div>

                  {teamCreationError && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border border-red-100 rounded-xl shadow-sm text-red-700 text-base"
                    >
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
                        <span>{teamCreationError}</span>
                      </div>
                    </motion.div>
                  )}

                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={creatingTeam}
                      className="w-full py-4 px-8 text-lg bg-gradient-to-r from-indigo-600 to-blue-600 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl font-medium"
                    >
                      {creatingTeam ? (
                        <>
                          <div className="h-6 w-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                          Создание команды...
                        </>
                      ) : (
                        <>Создать команду</>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CompetitionParticipateForm; 