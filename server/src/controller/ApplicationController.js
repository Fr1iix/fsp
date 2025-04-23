const ApiError = require("../errorr/ApiError")
const { Op } = require('sequelize');
const { Application, User, Team, Competition, Teammembers } = require("../models/models")

class ApplicationController {
    async getAll(req, res, next) {
        try {
            let limit = parseInt(req.query.limit, 10) || 10;
            let offset = parseInt(req.query.offset, 10) || 0;
            const search = req.query.search || '';
            const status = req.query.status || null;

            console.log('Получен запрос на получение заявок от пользователя:', req.user.id, 'с ролью:', req.user.role);
            console.log('Параметры запроса:', { limit, offset, search, status });

            const whereClause = {};

            if (search) {
                whereClause.UUID = {
                    [Op.iLike]: `%${search}%`
                };
            }

            if (status) {
                whereClause.status = status;
            }

            // Сначала получим список ID всех команд из заявок
            const applications = await Application.findAll({
                attributes: ['TeamId'],
                where: whereClause,
                raw: true
            });
            
            const teamIds = applications.map(app => app.TeamId).filter(id => id);
            console.log('ID команд из заявок:', teamIds);
            
            // Получим данные о командах отдельным запросом
            const teams = await Team.findAll({
                where: {
                    id: {
                        [Op.in]: teamIds
                    }
                },
                raw: true
            });
            
            console.log('Данные о командах:', teams);
            
            // Сопоставление ID команд с их данными для быстрого поиска
            const teamMap = {};
            teams.forEach(team => {
                teamMap[team.id] = team;
            });

            // Сначала получим список ID всех соревнований из заявок
            const competitionIds = applications.map(app => app.CompetitionId).filter(id => id);
            console.log('ID соревнований из заявок:', competitionIds);

            // Получим данные о соревнованиях отдельным запросом
            const competitions = await Competition.findAll({
                where: {
                    id: {
                        [Op.in]: competitionIds
                    }
                },
                raw: true
            });

            console.log('Данные о соревнованиях:', competitions);

            // Сопоставление ID соревнований с их данными для быстрого поиска
            const competitionMap = {};
            competitions.forEach(competition => {
                competitionMap[competition.id] = competition;
            });

            // Получим данные о пользователях (капитанах команд)
            const userIds = applications.map(app => app.UserId).filter(id => id);
            console.log('ID пользователей из заявок:', userIds);

            // Получаем базовую информацию о пользователях
            const basicUsers = await User.findAll({
                where: {
                    id: {
                        [Op.in]: userIds
                    }
                },
                attributes: ['id', 'email', 'role'],
                raw: true
            });

            console.log(`Получено ${basicUsers.length} пользователей`);

            // Получаем информацию user_info
            const userInfos = await require('../models/models').UserInfo.findAll({
                where: {
                    UserId: {
                        [Op.in]: userIds
                    }
                },
                raw: true
            });

            console.log(`Получено ${userInfos.length} записей user_info`);

            // Создаем словарь user_info по UserId для быстрого поиска
            const userInfoMap = {};
            userInfos.forEach(info => {
                userInfoMap[info.UserId] = info;
                console.log(`User info для ${info.UserId}: ${info.firstName} ${info.lastName}`);
            });

            // Объединяем данные пользователей с их user_info
            const userMap = {};
            basicUsers.forEach(user => {
                const userInfo = userInfoMap[user.id];
                userMap[user.id] = {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    user_info: userInfo ? {
                        firstName: userInfo.firstName || '',
                        lastName: userInfo.lastName || '',
                        middleName: userInfo.middleName || '',
                        phone: userInfo.phone || ''
                    } : null
                };
                
                console.log(`Данные пользователя ID ${user.id}:`, 
                    user.email,
                    userInfo ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}` : 'Нет user_info'
                );
            });

            // Определяем расширенные опции включения моделей
            const includeOptions = [
                { 
                    model: User,
                    attributes: ['id', 'email', 'role'],
                    include: [{
                        model: require('../models/models').UserInfo,
                        as: 'user_info',
                        required: false,
                        attributes: ['firstName', 'lastName', 'middleName', 'phone']
                    }]
                },
                { 
                    model: Team,
                    required: false, // Устанавливаем required: false для LEFT JOIN
                    attributes: { exclude: ['createdAt', 'updatedAt'] },
                    include: [{
                        model: require('../models/models').Teammembers,
                        required: false, // Устанавливаем required: false для LEFT JOIN
                        include: [{
                            model: User,
                            required: false, // Устанавливаем required: false для LEFT JOIN
                            attributes: ['id', 'email'],
                            include: [{
                                model: require('../models/models').UserInfo,
                                as: 'user_info',
                                required: false, // Устанавливаем required: false для LEFT JOIN
                                attributes: ['firstName', 'lastName', 'middleName', 'phone']
                            }]
                        }]
                    }]
                },
                { 
                    model: Competition,
                    required: false, // Устанавливаем required: false для LEFT JOIN
                    attributes: { exclude: ['createdAt', 'updatedAt'] }
                }
            ];

            // Выполняем запрос с включением всех связанных моделей
            console.log('Получение всех заявок с детальной информацией');
            const fullApplications = await Application.findAll({
                where: whereClause,
                limit,
                offset,
                include: includeOptions,
                order: [['createdAt', 'DESC']]
            });

            console.log('Найдено заявок:', fullApplications.length);
            
            // Проверка связанной информации и дополнение, если что-то отсутствует
            const resultApplications = fullApplications.map(app => {
                const plainApp = app.get({ plain: true });
                
                // Если данные о команде не загрузились через ORM, но мы знаем TeamId и получили данные о команде
                if (!plainApp.Team && plainApp.TeamId && teamMap[plainApp.TeamId]) {
                    plainApp.Team = teamMap[plainApp.TeamId];
                    console.log(`Добавлены данные о команде ${teamMap[plainApp.TeamId].name} для заявки ${plainApp.id}`);
                }
                
                // Если данные о соревновании не загрузились через ORM, но мы знаем CompetitionId и получили данные о соревновании
                if (!plainApp.Competition && plainApp.CompetitionId && competitionMap[plainApp.CompetitionId]) {
                    plainApp.Competition = competitionMap[plainApp.CompetitionId];
                    console.log(`Добавлены данные о соревновании для заявки ${plainApp.id}: ${plainApp.Competition.name}`);
                }
                
                // Если данные о пользователе не загрузились через ORM, но мы знаем UserId и получили данные о пользователе
                if (!plainApp.User && plainApp.UserId && userMap[plainApp.UserId]) {
                    plainApp.User = userMap[plainApp.UserId];
                    console.log(`Добавлены данные о пользователе ${plainApp.User.email} для заявки ${plainApp.id}`);
                }
                
                // Логирование для отладки
                console.log(`Заявка ID: ${plainApp.id}, TeamId: ${plainApp.TeamId}`);
                if (plainApp.Team) {
                    console.log(`  Команда: ID=${plainApp.Team.id}, Название=${plainApp.Team.name || 'Не указано'}`);
                } else {
                    console.log(`  Команда: ID=${plainApp.TeamId}, Данные не загружены`);
                }
                
                // Информация о соревновании
                if (plainApp.Competition) {
                    console.log(`  Соревнование: ID=${plainApp.Competition.id}, Название=${plainApp.Competition.name || 'Не указано'}`);
                } else {
                    console.log(`  Соревнование: ID=${plainApp.CompetitionId}, Данные не загружены`);
                }
                
                // Информация о пользователе
                if (plainApp.User) {
                    console.log(`  Пользователь: ID=${plainApp.User.id}, Email=${plainApp.User.email || 'Не указано'}`);
                    if (plainApp.User.user_info) {
                        console.log(`    Имя: ${plainApp.User.user_info.firstName || 'Не указано'}, Фамилия: ${plainApp.User.user_info.lastName || 'Не указано'}`);
                    }
                } else {
                    console.log(`  Пользователь: ID=${plainApp.UserId}, Данные не загружены`);
                }
                
                return plainApp;
            });
            
            return res.status(200).json(resultApplications);
        } catch (error) {
            console.error('Ошибка при получении заявок:', error);
            next(ApiError.badRequest(error.message));
        }
    }

    async getByUser(req, res, next) {
        try {
            const UserId = req.params.userId;

            const applications = await Application.findAll({
                where: { UserId },
                include: [
                    { 
                        model: User,
                        attributes: ['id', 'email', 'role'],
                        include: [{
                            model: require('../models/models').UserInfo,
                            as: 'user_info',
                            required: false,
                            attributes: ['firstName', 'lastName', 'middleName', 'phone']
                        }]
                    },
                    { 
                        model: Team,
                        required: false,
                        attributes: { exclude: ['createdAt', 'updatedAt'] },
                        include: [{
                            model: require('../models/models').Teammembers,
                            required: false,
                            include: [{
                                model: User,
                                required: false,
                                attributes: ['id', 'email'],
                                include: [{
                                    model: require('../models/models').UserInfo,
                                    as: 'user_info',
                                    required: false,
                                    attributes: ['firstName', 'lastName', 'middleName', 'phone']
                                }]
                            }]
                        }]
                    },
                    { 
                        model: Competition,
                        required: false,
                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                    }
                ]
            });

            return res.status(200).json(applications);
        } catch (error) {
            next(ApiError.badRequest(error.message));
        }
    }

    async getOne(req, res, next) {
        try {
            const id = req.params.id;
            
            console.log(`Получение детальной информации о заявке ID: ${id}`);
            
            // Получаем базовую информацию о заявке
            const application = await Application.findByPk(id);
            
            if (!application) {
                console.log(`Заявка с ID ${id} не найдена`);
                return res.status(404).json({ message: 'Заявка не найдена' });
            }
            
            const teamId = application.TeamId;
            const competitionId = application.CompetitionId;
            const userId = application.UserId;
            
            console.log(`Найдена заявка ID: ${id}, TeamId: ${teamId}, CompetitionId: ${competitionId}, UserId: ${userId}`);
            
            // Если есть ID соревнования, получаем данные о нем отдельным запросом
            let competition = null;
            if (competitionId) {
                competition = await Competition.findByPk(competitionId);
                console.log(`Соревнование для заявки:`, competition ? {
                    id: competition.id,
                    name: competition.name,
                    description: competition.description,
                    status: competition.status,
                    startDate: competition.startDate,
                    endDate: competition.endDate
                } : 'Не найдено');
            }
            
            // Если есть ID пользователя, получаем данные о нем отдельным запросом
            let userWithInfo = null;
            if (userId) {
                try {
                    // Получаем сначала пользователя с его basic info
                    const basicUser = await User.findByPk(userId);
                    if (!basicUser) {
                        console.log(`Пользователь с ID ${userId} не найден`);
                    } else {
                        console.log(`Найден пользователь: ID=${basicUser.id}, Email=${basicUser.email}`);
                        
                        // Затем получаем user_info отдельным запросом
                        const userInfo = await require('../models/models').UserInfo.findOne({ 
                            where: { UserId: userId } 
                        });
                        
                        if (!userInfo) {
                            console.log(`UserInfo для пользователя ${userId} не найден`);
                        } else {
                            console.log(`Найден UserInfo: Имя=${userInfo.firstName}, Фамилия=${userInfo.lastName}`);
                        }
                        
                        // Объединяем данные пользователя с его user_info
                        userWithInfo = {
                            id: basicUser.id,
                            email: basicUser.email,
                            role: basicUser.role,
                            user_info: userInfo ? {
                                firstName: userInfo.firstName || '',
                                lastName: userInfo.lastName || '',
                                middleName: userInfo.middleName || '',
                                phone: userInfo.phone || ''
                            } : null
                        };
                        
                        // Добавляем полное имя для удобства
                        if (userWithInfo.user_info) {
                            userWithInfo.fullName = [
                                userWithInfo.user_info.lastName || '',
                                userWithInfo.user_info.firstName || '',
                                userWithInfo.user_info.middleName || ''
                            ].filter(Boolean).join(' ');
                            console.log(`Полное имя пользователя: "${userWithInfo.fullName}"`);
                        }
                        
                        console.log('Собранная информация о пользователе:', userWithInfo);
                    }
                } catch (err) {
                    console.error('Ошибка при получении данных пользователя:', err);
                }
            }

            // Если есть ID команды, получаем данные о ней отдельным запросом
            let team = null;
            if (teamId) {
                team = await Team.findByPk(teamId);
                console.log(`Команда для заявки:`, team ? {
                    id: team.id,
                    name: team.name,
                    description: team.description
                } : 'Не найдена');
                
                // Получаем информацию об участниках команды
                if (team) {
                    const teamMembers = await Teammembers.findAll({
                        where: { TeamId: teamId },
                        include: [{
                            model: User,
                            attributes: ['id', 'email'],
                            include: [{
                                model: require('../models/models').UserInfo,
                                as: 'user_info',
                                required: false
                            }]
                        }]
                    });
                    
                    console.log(`Найдено ${teamMembers.length} участников команды`);
                    
                    team.dataValues.members = teamMembers.map(member => {
                        const plainMember = member.get({ plain: true });
                        const fullName = plainMember.User?.user_info ? 
                            [
                                plainMember.User.user_info.lastName || '',
                                plainMember.User.user_info.firstName || '',
                                plainMember.User.user_info.middleName || ''
                            ].filter(Boolean).join(' ') : 'Имя не указано';
                        
                        return {
                            id: plainMember.id,
                            is_capitan: plainMember.is_capitan,
                            userId: plainMember.User?.id,
                            email: plainMember.User?.email,
                            fullName
                        };
                    });
                    
                    console.log(`Обработаны участники команды:`, team.dataValues.members);
                }
            }
            
            // Собираем результат в единый объект
            const result = {
                id: application.id,
                UUID: application.UUID,
                status: application.status,
                createdAt: application.createdAt,
                updatedAt: application.updatedAt,
                UserId: application.UserId,
                TeamId: application.TeamId,
                CompetitionId: application.CompetitionId,
                Team: team ? team.get({ plain: true }) : null,
                Competition: competition ? competition.get({ plain: true }) : null,
                User: userWithInfo
            };
            
            console.log('ИТОГОВЫЙ РЕЗУЛЬТАТ ДЛЯ ОТПРАВКИ:');
            console.log('Данные о соревновании:', result.Competition ? {
                id: result.Competition.id,
                name: result.Competition.name,
                description: result.Competition.description
            } : 'Отсутствуют');
            
            console.log('Данные о пользователе:', result.User ? {
                id: result.User.id,
                email: result.User.email,
                fullName: result.User.fullName
            } : 'Отсутствуют');
            
            console.log('Данные о команде:', result.Team ? {
                id: result.Team.id,
                name: result.Team.name,
                membersCount: result.Team.members ? result.Team.members.length : 0
            } : 'Отсутствуют');

            return res.status(200).json(result);
        } catch (error) {
            console.error('Ошибка при получении заявки:', error);
            next(ApiError.badRequest(error.message));
        }
    }

    async create(req, res, next) {
        try {
            const { UserId, TeamId, CompetitionId, status = 'pending', UUID } = req.body;

            console.log('Получены данные для создания заявки:', req.body);

            if (!UserId) {
                return res.status(400).json({ message: 'Отсутствует обязательное поле UserId' });
            }

            const application = await Application.create({
                UserId,
                TeamId,
                CompetitionId,
                status,
                UUID
            });

            console.log('Заявка успешно создана:', application.id);

            return res.status(201).json(application);
        } catch (error) {
            console.error('Ошибка при создании заявки:', error);
            next(ApiError.badRequest(error.message));
        }
    }

    async delete(req, res, next) {
        try {
            const id = req.params.id;
            const result = await Application.destroy({ where: { id } });

            if (result === 0) {
                return res.status(404).json({ message: 'Заявка не найдена' });
            }

            return res.status(200).json({ message: 'Заявка успешно удалена' });
        } catch (error) {
            next(ApiError.badRequest(error.message));
        }
    }

    async updateStatus(req, res, next) {
        try {
            // Получаем и проверяем id
            let { id } = req.params;
            const { status } = req.body;
            
            console.log('Запрос на обновление статуса заявки от пользователя:', req.user.id, 'с ролью:', req.user.role);
            console.log('Данные запроса:', { id, status });

            // Проверка валидности статуса
            if (!['pending', 'approved', 'rejected'].includes(status)) {
                console.log('Неверное значение статуса:', status);
                return res.status(400).json({ message: 'Неверный статус заявки' });
            }

            // Пробуем преобразовать id в число, если он приходит как строка
            if (isNaN(id)) {
                console.log('Неверный формат ID:', id);
                return res.status(400).json({ message: 'Неверный формат ID заявки' });
            }

            id = parseInt(id, 10);
            
            // Поиск заявки с полной информацией о связанных моделях
            console.log('Поиск заявки по ID:', id);
            const application = await Application.findByPk(id, {
                include: [
                    { 
                        model: User,
                        attributes: ['id', 'email', 'role', 'idRegions'],
                        include: [{
                            model: require('../models/models').UserInfo,
                            as: 'user_info',
                            required: false,
                            attributes: ['firstName', 'lastName', 'middleName', 'phone']
                        }]
                    },
                    { 
                        model: Team,
                        required: false,
                        attributes: { exclude: ['createdAt', 'updatedAt'] },
                        include: [{
                            model: require('../models/models').Teammembers,
                            required: false,
                            include: [{
                                model: User,
                                required: false,
                                attributes: ['id', 'email'],
                                include: [{
                                    model: require('../models/models').UserInfo,
                                    as: 'user_info',
                                    required: false,
                                    attributes: ['firstName', 'lastName', 'middleName', 'phone']
                                }]
                            }]
                        }]
                    },
                    { 
                        model: Competition,
                        required: false,
                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                    }
                ]
            });
            
            if (!application) {
                console.log('Заявка не найдена');
                return res.status(404).json({ message: 'Заявка не найдена' });
            }
            
            console.log('Найдена заявка:', {
                id: application.id,
                status: application.status,
                competitionId: application.CompetitionId,
                teamId: application.TeamId,
                userId: application.UserId
            });

            // Для региональных представителей проверяем доступ к заявке
            if (req.user.role === 'regional') {
                console.log('Проверка прав регионального представителя');
                
                // Получаем информацию о пользователе
                const user = await User.findByPk(req.user.id);
                if (!user || !user.idRegions) {
                    console.log('У регионального представителя не указан регион');
                    return res.status(403).json({ message: 'У пользователя не задан регион' });
                }
                
                // Проверяем, что соревнование относится к региону пользователя
                if (!application.Competition || application.Competition.regionId !== user.idRegions) {
                    console.log('Заявка не относится к региону пользователя');
                    return res.status(403).json({ message: 'Нет доступа к заявке' });
                }
            }

            // Обновляем статус
            console.log('Обновление статуса заявки с', application.status, 'на', status);
            application.status = status;
            await application.save();
            
            console.log('Заявка успешно обновлена');
            
            // Получаем обновленную заявку со всеми связями
            const updatedApplication = await Application.findByPk(id, {
                include: [
                    { 
                        model: User,
                        attributes: ['id', 'email', 'role'],
                        include: [{
                            model: require('../models/models').UserInfo,
                            as: 'user_info',
                            required: false,
                            attributes: ['firstName', 'lastName', 'middleName', 'phone']
                        }]
                    },
                    { 
                        model: Team,
                        required: false,
                        attributes: { exclude: ['createdAt', 'updatedAt'] },
                        include: [{
                            model: require('../models/models').Teammembers,
                            required: false,
                            include: [{
                                model: User,
                                required: false,
                                attributes: ['id', 'email'],
                                include: [{
                                    model: require('../models/models').UserInfo,
                                    as: 'user_info',
                                    required: false,
                                    attributes: ['firstName', 'lastName', 'middleName', 'phone']
                                }]
                            }]
                        }]
                    },
                    { 
                        model: Competition,
                        required: false,
                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                    }
                ]
            });
            
            return res.status(200).json(updatedApplication);
        } catch (error) {
            console.error('Ошибка при обновлении статуса заявки:', error);
            next(ApiError.badRequest(error.message));
        }
    }

    async updateOne(req, res, next) {
        try {
            const { id } = req.params;
            const { UserId, TeamId, CompetitionId, status, UUID } = req.body;

            const application = await Application.findByPk(id);
            if (!application) {
                return res.status(404).json({ message: 'Заявка не найдена' });
            }

            if (UserId) application.UserId = UserId;
            if (TeamId) application.TeamId = TeamId;
            if (CompetitionId) application.CompetitionId = CompetitionId;
            if (status) application.status = status;
            if (UUID) application.UUID = UUID;

            await application.save();

            return res.status(200).json(application);
        } catch (error) {
            next(ApiError.badRequest(error.message));
        }
    }

    // Метод для создания заявки на участие в соревновании
    async createParticipationRequest(req, res, next) {
        try {
            const { CompetitionId, TeamId } = req.body;
            const UserId = req.user.id; // Получаем ID пользователя из токена

            // Проверяем, что соревнование существует
            const competition = await Competition.findByPk(CompetitionId);
            if (!competition) {
                return res.status(404).json({ message: 'Соревнование не найдено' });
            }

            // Проверяем, открыта ли регистрация на соревнование
            if (competition.status !== 'Регистрация открыта') {
                return res.status(400).json({ message: 'Регистрация на это соревнование закрыта' });
            }

            // Проверяем, не подавал ли пользователь уже заявку на это соревнование
            const existingApplication = await Application.findOne({
                where: {
                    UserId,
                    CompetitionId,
                    status: {
                        [Op.in]: ['pending', 'approved']
                    }
                }
            });

            if (existingApplication) {
                return res.status(400).json({ 
                    message: existingApplication.status === 'approved' 
                        ? 'Вы уже зарегистрированы на это соревнование' 
                        : 'Заявка уже находится на рассмотрении'
                });
            }

            // Если указан ID команды, проверяем, существует ли команда
            let team = null;
            if (TeamId) {
                team = await Team.findByPk(TeamId);
                if (!team) {
                    return res.status(404).json({ message: 'Команда не найдена' });
                }

                // Проверяем, является ли пользователь участником команды
                const isTeamMember = await Teammembers.findOne({
                    where: {
                        TeamId,
                        UserId
                    }
                });

                if (!isTeamMember) {
                    return res.status(403).json({ message: 'Вы не являетесь участником указанной команды' });
                }
            }

            // Генерируем UUID для заявки
            const UUID = `APP-${CompetitionId}-${UserId}-${Date.now().toString(36)}`;

            // Создаем заявку со статусом "pending" (на рассмотрении)
            const application = await Application.create({
                UserId,
                TeamId,
                CompetitionId,
                status: 'pending',
                UUID
            });

            // Получаем полные данные о созданной заявке
            const fullApplication = await Application.findByPk(application.id, {
                include: [
                    { 
                        model: User,
                        attributes: ['id', 'email', 'role'],
                        include: [{
                            model: require('../models/models').UserInfo,
                            as: 'user_info',
                            required: false,
                            attributes: ['firstName', 'lastName', 'middleName', 'phone']
                        }]
                    },
                    { 
                        model: Team,
                        required: false,
                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                    },
                    { 
                        model: Competition,
                        required: false,
                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                    }
                ]
            });

            console.log(`Создана заявка на участие в соревновании ID: ${CompetitionId}, пользователь ID: ${UserId}`);
            
            return res.status(201).json(fullApplication);
        } catch (error) {
            console.error('Ошибка при создании заявки на участие:', error);
            next(ApiError.badRequest(error.message));
        }
    }

    // Метод для получения заявок текущего пользователя
    async getMyApplications(req, res, next) {
        try {
            const UserId = req.user.id;
            
            console.log(`Получение заявок пользователя ID: ${UserId}`);
            
            const applications = await Application.findAll({
                where: { UserId },
                include: [
                    { 
                        model: User,
                        attributes: ['id', 'email', 'role'],
                        include: [{
                            model: require('../models/models').UserInfo,
                            as: 'user_info',
                            required: false,
                            attributes: ['firstName', 'lastName', 'middleName', 'phone']
                        }]
                    },
                    { 
                        model: Team,
                        required: false,
                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                    },
                    { 
                        model: Competition,
                        required: false,
                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            
            console.log(`Найдено ${applications.length} заявок пользователя ID: ${UserId}`);
            
            return res.status(200).json(applications);
        } catch (error) {
            console.error('Ошибка при получении заявок пользователя:', error);
            next(ApiError.badRequest(error.message));
        }
    }

    // Метод для получения заявок на соревнования в регионе пользователя (для региональных представителей)
    async getRegionalApplications(req, res, next) {
        try {
            const userId = req.user.id;
            
            // Проверяем, что пользователь - региональный представитель
            if (req.user.role !== 'regional') {
                return res.status(403).json({ message: 'Доступ запрещен. Недостаточно прав.' });
            }
            
            // Получаем регион пользователя
            const user = await User.findByPk(userId);
            if (!user || !user.idRegions) {
                return res.status(400).json({ message: 'У пользователя не задан регион' });
            }
            
            const regionId = user.idRegions;
            console.log(`Получение заявок для региона ID: ${regionId}`);
            
            // Получаем список соревнований в регионе
            const competitions = await Competition.findAll({
                where: { regionId },
                attributes: ['id', 'name', 'description', 'startDate', 'endDate', 'status'],
                raw: true
            });
            
            const competitionIds = competitions.map(comp => comp.id);
            console.log(`Найдено ${competitionIds.length} соревнований в регионе ID: ${regionId}`);
            
            if (competitionIds.length === 0) {
                return res.status(200).json([]);
            }
            
            // Создаем словарь соревнований по ID для быстрого доступа
            const competitionMap = {};
            competitions.forEach(comp => {
                competitionMap[comp.id] = comp;
            });
            
            // Получаем заявки на эти соревнования с включением всех связей
            const applications = await Application.findAll({
                where: {
                    CompetitionId: {
                        [Op.in]: competitionIds
                    }
                },
                include: [
                    { 
                        model: User,
                        attributes: ['id', 'email', 'role'],
                        include: [{
                            model: require('../models/models').UserInfo,
                            as: 'user_info',
                            required: false,
                            attributes: ['firstName', 'lastName', 'middleName', 'phone']
                        }]
                    },
                    { 
                        model: Team,
                        required: false,
                        attributes: { exclude: ['createdAt', 'updatedAt'] },
                        include: [{
                            model: Teammembers,
                            required: false,
                            include: [{
                                model: User,
                                required: false,
                                attributes: ['id', 'email'],
                                include: [{
                                    model: require('../models/models').UserInfo,
                                    as: 'user_info',
                                    required: false,
                                    attributes: ['firstName', 'lastName', 'middleName', 'phone']
                                }]
                            }]
                        }]
                    },
                    { 
                        model: Competition,
                        required: false,
                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            
            console.log(`Найдено ${applications.length} заявок на соревнования в регионе ID: ${regionId}`);
            
            // Получаем список ID пользователей из заявок для дополнительной загрузки данных
            const userIds = applications.map(app => app.UserId).filter(id => id);
            console.log(`Получение данных для ${userIds.length} пользователей`);
            
            // Загружаем информацию о пользователях отдельным запросом
            const users = await User.findAll({
                where: {
                    id: {
                        [Op.in]: userIds
                    }
                },
                include: [{
                    model: require('../models/models').UserInfo,
                    as: 'user_info',
                    required: false,
                    attributes: ['firstName', 'lastName', 'middleName', 'phone']
                }],
                raw: false
            });
            
            // Создаем словарь пользователей по ID для быстрого доступа
            const userMap = {};
            users.forEach(userObj => {
                const plainUser = userObj.get({ plain: true });
                userMap[plainUser.id] = plainUser;
            });
            
            // Получаем обработанные результаты
            const resultApplications = applications.map(app => {
                const result = app.get({ plain: true });
                
                // Проверяем, загружена ли информация о соревновании, если нет - добавляем из словаря
                if (!result.Competition && result.CompetitionId && competitionMap[result.CompetitionId]) {
                    result.Competition = competitionMap[result.CompetitionId];
                    console.log(`Добавлены данные о соревновании для заявки ${result.id}: ${result.Competition.name}`);
                }
                
                // Проверяем, загружена ли информация о пользователе, если нет - добавляем из словаря
                if (!result.User && result.UserId && userMap[result.UserId]) {
                    result.User = userMap[result.UserId];
                    console.log(`Добавлены данные о пользователе для заявки ${result.id}: ${result.User.email}`);
                }
                
                // Добавляем полное имя для пользователя
                if (result.User && result.User.user_info) {
                    result.User.fullName = [
                        result.User.user_info.lastName || '',
                        result.User.user_info.firstName || '',
                        result.User.user_info.middleName || ''
                    ].filter(Boolean).join(' ');
                    console.log(`Сформировано полное имя для пользователя ${result.User.id}: ${result.User.fullName}`);
                }
                
                // Проверяем данные о команде и ее участниках
                if (result.Team && result.Team.Teammembers && result.Team.Teammembers.length > 0) {
                    // Структурируем данные о членах команды
                    result.Team.members = result.Team.Teammembers.map(member => {
                        // Проверяем, что есть информация о пользователе
                        if (member.User) {
                            const fullName = member.User.user_info ? 
                                [
                                    member.User.user_info.lastName || '',
                                    member.User.user_info.firstName || '',
                                    member.User.user_info.middleName || ''
                                ].filter(Boolean).join(' ') : 'Имя не указано';
                            
                            return {
                                id: member.id,
                                is_capitan: member.is_capitan,
                                userId: member.User.id,
                                email: member.User.email,
                                fullName
                            };
                        }
                        
                        return {
                            id: member.id,
                            is_capitan: member.is_capitan,
                            userId: member.UserId
                        };
                    });
                    
                    console.log(`Заявка ${result.id}: команда ${result.Team.name} имеет ${result.Team.members.length} участников`);
                }
                
                // Логирование результатов для отладки
                console.log(`Заявка ID: ${result.id}, TeamId: ${result.TeamId}`);
                if (result.Team) {
                    console.log(`  Команда: ID=${result.Team.id}, Название=${result.Team.name || 'Не указано'}`);
                }
                
                if (result.Competition) {
                    console.log(`  Соревнование: ID=${result.Competition.id}, Название=${result.Competition.name || 'Не указано'}`);
                } else {
                    console.log(`  Соревнование: ID=${result.CompetitionId}, Данные не загружены`);
                }
                
                if (result.User) {
                    console.log(`  Пользователь: ID=${result.User.id}, Email=${result.User.email || 'Не указано'}`);
                    if (result.User.user_info) {
                        console.log(`    Имя: ${result.User.user_info.firstName || 'Не указано'}, Фамилия: ${result.User.user_info.lastName || 'Не указано'}`);
                    }
                } else {
                    console.log(`  Пользователь: ID=${result.UserId}, Данные не загружены`);
                }
                
                return result;
            });

            return res.status(200).json(resultApplications);
        } catch (error) {
            console.error('Ошибка при получении заявок для региона:', error);
            next(ApiError.badRequest(error.message));
        }
    }

    // В конце класса ApplicationController добавим новую функцию для получения детальной информации о заявке
    async getApplicationDetails(req, res, next) {
        try {
            const id = req.params.id;
            console.log(`Получение детальной информации о заявке ID: ${id}`);
            
            // Получаем базовую информацию о заявке
            const application = await Application.findByPk(id);
            
            if (!application) {
                console.log(`Заявка с ID ${id} не найдена`);
                return res.status(404).json({ message: 'Заявка не найдена' });
            }
            
            // Получаем ID связанных сущностей
            const teamId = application.TeamId;
            const competitionId = application.CompetitionId;
            const userId = application.UserId;
            
            console.log(`DEBUG: Получены IDs - teamId: ${teamId}, competitionId: ${competitionId}, userId: ${userId}`);
            
            // Собираем результат
            const result = {
                id: application.id,
                UUID: application.UUID,
                status: application.status,
                createdAt: application.createdAt,
                updatedAt: application.updatedAt,
                TeamId: teamId,
                CompetitionId: competitionId,
                UserId: userId,
                Team: null,
                Competition: null,
                User: null
            };
            
            // Загружаем информацию о соревновании, если есть ID
            if (competitionId) {
                const competition = await Competition.findByPk(competitionId);
                if (competition) {
                    result.Competition = {
                        id: competition.id,
                        name: competition.name,
                        description: competition.description || '',
                        status: competition.status || '',
                        startDate: competition.startDate,
                        endDate: competition.endDate,
                        regionId: competition.regionId
                    };
                    console.log(`DEBUG: Соревнование загружено: ${competition.name}`);
                } else {
                    console.log(`DEBUG: Соревнование с ID ${competitionId} не найдено`);
                }
            }
            
            // Загружаем информацию о команде и участниках, если есть ID
            if (teamId) {
                const team = await Team.findByPk(teamId);
                if (team) {
                    const teamData = {
                        id: team.id,
                        name: team.name,
                        description: team.description || '',
                        members: []
                    };
                    
                    // Загружаем участников команды
                    const teamMembers = await Teammembers.findAll({
                        where: { TeamId: teamId },
                        include: [{
                            model: User,
                            attributes: ['id', 'email'],
                            include: [{
                                model: require('../models/models').UserInfo,
                                as: 'user_info',
                                required: false
                            }]
                        }]
                    });
                    
                    if (teamMembers && teamMembers.length > 0) {
                        teamData.members = teamMembers.map(member => {
                            const plainMember = member.get({ plain: true });
                            // Формируем полное имя
                            const fullName = plainMember.User?.user_info ? 
                                [
                                    plainMember.User.user_info.lastName || '',
                                    plainMember.User.user_info.firstName || '',
                                    plainMember.User.user_info.middleName || ''
                                ].filter(Boolean).join(' ') : 'Имя не указано';
                            
                            return {
                                id: plainMember.id,
                                is_capitan: plainMember.is_capitan,
                                userId: plainMember.User?.id,
                                email: plainMember.User?.email,
                                fullName
                            };
                        });
                    }
                    
                    result.Team = teamData;
                    console.log(`DEBUG: Команда загружена: ${team.name}, участников: ${teamData.members.length}`);
                } else {
                    console.log(`DEBUG: Команда с ID ${teamId} не найдена`);
                }
            }
            
            // Загружаем информацию о пользователе, если есть ID
            if (userId) {
                const user = await User.findByPk(userId, {
                    include: [{
                        model: require('../models/models').UserInfo,
                        as: 'user_info',
                        required: false
                    }]
                });
                
                if (user) {
                    const userData = user.get({ plain: true });
                    // Формируем полное имя
                    if (userData.user_info) {
                        userData.fullName = [
                            userData.user_info.lastName || '',
                            userData.user_info.firstName || '',
                            userData.user_info.middleName || ''
                        ].filter(Boolean).join(' ');
                    }
                    
                    result.User = userData;
                    console.log(`DEBUG: Пользователь загружен: ${userData.email}, ФИО: ${userData.fullName || 'Не указано'}`);
                } else {
                    console.log(`DEBUG: Пользователь с ID ${userId} не найден`);
                }
            }
            
            console.log("DEBUG: Отправка результата:");
            console.log(`DEBUG: Соревнование: ${result.Competition?.name || 'Не указано'}`);
            console.log(`DEBUG: Команда: ${result.Team?.name || 'Не указана'}`);
            console.log(`DEBUG: Пользователь: ${result.User?.fullName || result.User?.email || 'Не указан'}`);
            
            return res.status(200).json(result);
        } catch (error) {
            console.error('Ошибка при получении детальной информации о заявке:', error);
            next(ApiError.badRequest(error.message));
        }
    }
}

module.exports = new ApplicationController();