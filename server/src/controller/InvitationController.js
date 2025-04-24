const ApiError = require("../errorr/ApiError");
const { Invitation, User, Team, Competition, Teammembers, UserInfo, Application, sequelize } = require("../models/models");
const Sequelize = require('sequelize');

// Вспомогательный метод для загрузки дополнительных данных
async function loadAdditionalData(invitations) {
    console.log('Запуск загрузки дополнительных данных...');
    
    for (let i = 0; i < invitations.length; i++) {
        const invitation = invitations[i];
        
        // Загружаем информацию о команде, если она отсутствует
        if (!invitation.Team && invitation.TeamId) {
            try {
                console.log(`Загрузка данных о команде ID: ${invitation.TeamId}`);
                const team = await Team.findByPk(invitation.TeamId);
                
                if (team) {
                    console.log(`Найдена команда: ${team.name}`);
                    invitation.Team = {
                        id: team.id,
                        name: team.name,
                        discription: team.discription
                    };
                } else {
                    console.log(`Команда ID: ${invitation.TeamId} не найдена`);
                }
            } catch (error) {
                console.error(`Ошибка при загрузке команды ID: ${invitation.TeamId}`, error);
            }
        }
        
        // Загружаем информацию о соревновании, если она отсутствует
        if (!invitation.Competition && invitation.CompetitionId) {
            try {
                console.log(`Загрузка данных о соревновании ID: ${invitation.CompetitionId}`);
                const competition = await Competition.findByPk(invitation.CompetitionId);
                
                if (competition) {
                    console.log(`Найдено соревнование: ${competition.name}`);
                    invitation.Competition = {
                        id: competition.id,
                        name: competition.name,
                        discription: competition.discription,
                        format: competition.format,
                        startdate: competition.startdate,
                        enddate: competition.enddate
                    };
                } else {
                    console.log(`Соревнование ID: ${invitation.CompetitionId} не найдено`);
                }
            } catch (error) {
                console.error(`Ошибка при загрузке соревнования ID: ${invitation.CompetitionId}`, error);
            }
        }
        
        // Загружаем информацию о приглашающем пользователе, если она отсутствует
        if ((!invitation.Inviter || !invitation.Inviter.user_info) && invitation.InvitedBy) {
            try {
                console.log(`Загрузка данных о приглашающем пользователе ID: ${invitation.InvitedBy}`);
                const inviter = await User.findOne({
                    where: { id: invitation.InvitedBy },
                    include: [{
                        model: UserInfo,
                        as: 'user_info',
                        attributes: ['firstName', 'lastName', 'middleName', 'phone']
                    }]
                });
                
                if (inviter) {
                    console.log(`Найден приглашающий пользователь: ${inviter.email}`);
                    invitation.Inviter = {
                        id: inviter.id,
                        email: inviter.email,
                        user_info: inviter.user_info ? {
                            firstName: inviter.user_info.firstName,
                            lastName: inviter.user_info.lastName,
                            middleName: inviter.user_info.middleName,
                            phone: inviter.user_info.phone
                        } : null
                    };
                } else {
                    console.log(`Приглашающий пользователь ID: ${invitation.InvitedBy} не найден`);
                }
            } catch (error) {
                console.error(`Ошибка при загрузке приглашающего пользователя ID: ${invitation.InvitedBy}`, error);
            }
        }
        
        // Загружаем информацию о приглашаемом пользователе, если она отсутствует
        if ((!invitation.User || !invitation.User.user_info) && invitation.UserId) {
            try {
                console.log(`Загрузка данных о приглашаемом пользователе ID: ${invitation.UserId}`);
                const user = await User.findOne({
                    where: { id: invitation.UserId },
                    include: [{
                        model: UserInfo,
                        as: 'user_info',
                        attributes: ['firstName', 'lastName', 'middleName', 'phone']
                    }]
                });
                
                if (user) {
                    console.log(`Найден приглашаемый пользователь: ${user.email}`);
                    invitation.User = {
                        id: user.id,
                        email: user.email,
                        user_info: user.user_info ? {
                            firstName: user.user_info.firstName,
                            lastName: user.user_info.lastName,
                            middleName: user.user_info.middleName,
                            phone: user.user_info.phone
                        } : null
                    };
                    
                    if (user.user_info) {
                        console.log(`Информация о пользователе: ${user.user_info.lastName || ''} ${user.user_info.firstName || ''}`);
                    } else {
                        console.log(`У пользователя ID: ${invitation.UserId} отсутствует дополнительная информация`);
                    }
                } else {
                    console.log(`Приглашаемый пользователь ID: ${invitation.UserId} не найден`);
                }
            } catch (error) {
                console.error(`Ошибка при загрузке приглашаемого пользователя ID: ${invitation.UserId}`, error);
            }
        }
    }
    
    return invitations;
}

class InvitationController {
    // Получение всех приглашений для текущего пользователя
    async getMyInvitations(req, res, next) {
        try {
            const UserId = req.user.id;
            console.log(`Запрос приглашений для пользователя с ID: ${UserId}`);
            
            const invitations = await Invitation.findAll({
                where: { UserId, status: 'pending' },
                include: [
                    {
                        model: Team,
                        attributes: ['id', 'name', 'discription']
                    },
                    {
                        model: Competition,
                        attributes: ['id', 'name', 'discription', 'format', 'startdate', 'enddate']
                    },
                    {
                        model: User,
                        as: 'Inviter',
                        attributes: ['id', 'email'],
                        include: [
                            {
                                model: UserInfo,
                                as: 'user_info',
                                required: false,
                                attributes: ['firstName', 'lastName', 'middleName', 'phone']
                            }
                        ]
                    }
                ]
            });
            
            console.log(`Найдено ${invitations.length} активных приглашений`);
            
            // Преобразуем в простые объекты для работы с ними
            let processedInvitations = invitations.map(inv => inv.get({ plain: true }));
            
            // Проверяем и дополняем данные, если необходимо
            let needsAdditionalData = false;
            
            for (const invitation of processedInvitations) {
                console.log(`Обработка приглашения ID: ${invitation.id}`);
                
                if (!invitation.Team && invitation.TeamId) {
                    needsAdditionalData = true;
                    console.log(`Отсутствует информация о команде ID: ${invitation.TeamId}`);
                } else if (invitation.Team) {
                    console.log(`Найдена команда: ${invitation.Team.name}`);
                }
                
                if (!invitation.Competition && invitation.CompetitionId) {
                    needsAdditionalData = true;
                    console.log(`Отсутствует информация о соревновании ID: ${invitation.CompetitionId}`);
                } else if (invitation.Competition) {
                    console.log(`Найдено соревнование: ${invitation.Competition.name}`);
                }
                
                // Проверяем наличие информации о приглашающем пользователе
                if (invitation.Inviter) {
                    if (invitation.Inviter.user_info) {
                        console.log(`Информация о приглашающем: ${invitation.Inviter.user_info.lastName || ''} ${invitation.Inviter.user_info.firstName || ''}`);
                    } else {
                        console.log(`Отсутствует дополнительная информация о приглашающем ID: ${invitation.InvitedBy}`);
                        needsAdditionalData = true;
                    }
                } else {
                    console.log(`Отсутствует информация о приглашающем ID: ${invitation.InvitedBy}`);
                    needsAdditionalData = true;
                }
            }
            
            // Если у некоторых приглашений отсутствуют данные, попробуем загрузить их отдельно
            if (needsAdditionalData) {
                console.log('Требуется дополнительная загрузка данных...');
                processedInvitations = await loadAdditionalData(processedInvitations);
            }
            
            return res.json(processedInvitations);
        } catch (e) {
            console.error('Ошибка при получении приглашений:', e);
            next(ApiError.badRequest(e.message));
        }
    }
    
    // Создание приглашения
    async create(req, res, next) {
        try {
            const { UserId, TeamId, CompetitionId } = req.body;
            const InvitedBy = req.user.id;
            
            console.log(`Создание приглашения: UserID=${UserId}, TeamID=${TeamId}, CompetitionID=${CompetitionId}, InvitedBy=${InvitedBy}`);
            
            // Получаем информацию о приглашающем пользователе
            const inviter = await User.findOne({
                where: { id: InvitedBy },
                include: [{
                    model: UserInfo,
                    as: 'user_info',
                    attributes: ['firstName', 'lastName', 'middleName']
                }]
            });
            
            if (inviter && inviter.user_info) {
                console.log(`Приглашающий пользователь: ${inviter.email}, ${inviter.user_info.lastName || ''} ${inviter.user_info.firstName || ''}`);
            } else if (inviter) {
                console.log(`Приглашающий пользователь: ${inviter.email} (без дополнительной информации)`);
            } else {
                console.log(`Не удалось найти информацию о приглашающем пользователе ID: ${InvitedBy}`);
            }
            
            // Проверяем, существует ли пользователь
            const user = await User.findOne({ where: { id: UserId } });
            if (!user) {
                console.log(`Пользователь с ID ${UserId} не найден`);
                return res.status(404).json({ message: 'Пользователь не найден' });
            }
            
            // Проверяем, существует ли команда
            const team = await Team.findOne({ where: { id: TeamId } });
            if (!team) {
                console.log(`Команда с ID ${TeamId} не найдена`);
                return res.status(404).json({ message: 'Команда не найдена' });
            } else {
                console.log(`Найдена команда: ID=${team.id}, Название=${team.name}`);
            }
            
            // Проверяем, является ли приглашающий капитаном команды
            const isCaptain = await Teammembers.findOne({
                where: { TeamId, UserId: InvitedBy, is_capitan: true }
            });
            
            if (!isCaptain) {
                console.log(`Пользователь ${InvitedBy} не является капитаном команды ${TeamId}`);
                return res.status(403).json({ message: 'Только капитан команды может отправлять приглашения' });
            }
            
            // Проверяем, не состоит ли пользователь уже в этой команде
            const isAlreadyMember = await Teammembers.findOne({
                where: { TeamId, UserId }
            });
            
            if (isAlreadyMember) {
                console.log(`Пользователь ${UserId} уже является участником команды ${TeamId}`);
                return res.status(400).json({ message: 'Пользователь уже является участником этой команды' });
            }
            
            // Проверяем, не было ли уже отправлено приглашение этому пользователю в эту команду
            const existingInvitation = await Invitation.findOne({
                where: { UserId, TeamId, status: 'pending' }
            });
            
            if (existingInvitation) {
                console.log(`Приглашение пользователю ${UserId} в команду ${TeamId} уже существует`);
                return res.status(400).json({ message: 'Приглашение уже было отправлено этому пользователю' });
            }
            
            // Создаем приглашение
            console.log('Создаем новое приглашение...');
            const invitation = await Invitation.create({
                UserId,
                TeamId,
                InvitedBy,
                CompetitionId,
                status: 'pending'
            });
            
            console.log(`Приглашение успешно создано: ID=${invitation.id}`);
            
            // Проверяем созданное приглашение
            const createdInvitation = await Invitation.findOne({
                where: { id: invitation.id },
                include: [
                    {
                        model: Team,
                        attributes: ['id', 'name']
                    },
                    {
                        model: Competition,
                        attributes: ['id', 'name']
                    },
                    {
                        model: User, 
                        as: 'Inviter',
                        attributes: ['id', 'email'],
                        include: [{
                            model: UserInfo,
                            as: 'user_info',
                            attributes: ['firstName', 'lastName', 'middleName']
                        }]
                    }
                ]
            });
            
            if (createdInvitation) {
                const hasTeam = createdInvitation.Team !== null;
                const hasCompetition = createdInvitation.Competition !== null;
                
                console.log(`Проверка созданного приглашения: Команда ${hasTeam ? 'присутствует' : 'отсутствует'}, Соревнование ${hasCompetition ? 'присутствует' : 'отсутствует'}`);
                
                // Возвращаем приглашение с данными о команде и соревновании
                return res.status(201).json(createdInvitation.get({ plain: true }));
            } else {
                return res.status(201).json(invitation);
            }
        } catch (e) {
            console.error('Ошибка при создании приглашения:', e);
            next(ApiError.badRequest(e.message));
        }
    }
    
    // Ответ на приглашение (принять/отклонить)
    async respondToInvitation(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const UserId = req.user.id;
            
            if (!['accepted', 'rejected'].includes(status)) {
                return res.status(400).json({ message: 'Неверный статус. Допустимые значения: accepted, rejected' });
            }
            
            // Находим приглашение
            const invitation = await Invitation.findOne({
                where: { id, UserId }
            });
            
            if (!invitation) {
                return res.status(404).json({ message: 'Приглашение не найдено' });
            }
            
            if (invitation.status !== 'pending') {
                return res.status(400).json({ message: 'На это приглашение уже был дан ответ' });
            }
            
            // Обновляем статус приглашения
            invitation.status = status;
            await invitation.save();
            
            // Если пользователь принял приглашение, добавляем его в команду
            if (status === 'accepted') {
                await Teammembers.create({
                    UserId,
                    TeamId: invitation.TeamId,
                    is_capitan: false
                });
                
                // Получаем данные пользователя для заполнения заявки
                const userInfo = await UserInfo.findOne({ where: { UserId } });
                
                // Обновляем заявку на соревнование, добавляя информацию об участнике
                const application = await Application.findOne({
                    where: { TeamId: invitation.TeamId, CompetitionId: invitation.CompetitionId }
                });
                
                if (application) {
                    console.log(`Пользователь ${UserId} принял приглашение в команду ${invitation.TeamId} для соревнования ${invitation.CompetitionId}`);
                    console.log('Данные пользователя автоматически добавлены в заявку');
                    // Здесь в реальном проекте нужно реализовать логику обновления заявки
                }
            }
            
            return res.json({ message: status === 'accepted' ? 'Приглашение принято' : 'Приглашение отклонено' });
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }
    
    // Получение всех приглашений для указанной команды
    async getTeamInvitations(req, res, next) {
        try {
            const teamId = req.params.teamId;
            
            console.log(`Запрос на получение приглашений для команды ID: ${teamId}`);
            
            // Проверяем, имеет ли пользователь доступ к этой команде (капитан или админ/фсп/регионал)
            const isTeamCaptain = await Teammembers.findOne({
                where: { 
                    TeamId: teamId, 
                    UserId: req.user.id,
                    is_capitan: true 
                }
            });
            
            const isAdmin = req.user.role === 'admin' || req.user.role === 'fsp' || req.user.role === 'regional';
            
            if (!isTeamCaptain && !isAdmin) {
                console.log(`Доступ запрещен: пользователь ID ${req.user.id} не является капитаном команды ID ${teamId} или администратором`);
                return res.status(403).json({ message: 'Нет доступа к приглашениям этой команды' });
            }
            
            // 1. Сначала получаем все приглашения для этой команды
            const invitations = await Invitation.findAll({
                where: { TeamId: teamId },
                order: [['createdAt', 'DESC']]
            });
            
            console.log(`Найдено ${invitations.length} приглашений для команды ID: ${teamId}`);
            
            if (invitations.length === 0) {
                return res.json([]);
            }
            
            // 2. Получаем список ID всех пользователей из приглашений
            const userIds = [...new Set(invitations.map(inv => inv.UserId))];
            const inviterIds = [...new Set(invitations.map(inv => inv.InvitedBy))];
            
            // Объединяем ID для одного запроса
            const allUserIds = [...new Set([...userIds, ...inviterIds])];
            
            console.log(`Загружаем данные для пользователей: ${allUserIds.join(', ')}`);
            
            // 3. Загружаем всех пользователей одним запросом с полной информацией
            const users = await User.findAll({
                where: { id: allUserIds },
                include: [{
                    model: UserInfo,
                    as: 'user_info',
                    required: false
                }]
            });
            
            console.log(`Загружено ${users.length} пользователей`);
            
            // 4. Создаем словарь для быстрого доступа к пользователям по ID
            const userMap = {};
            users.forEach(user => {
                const plainUser = user.get({ plain: true });
                userMap[plainUser.id] = plainUser;
                
                if (plainUser.user_info) {
                    console.log(`Пользователь ID ${plainUser.id}: ${plainUser.email}, ${plainUser.user_info.lastName || ''} ${plainUser.user_info.firstName || ''}`);
                } else {
                    console.log(`Пользователь ID ${plainUser.id}: ${plainUser.email}, без дополнительной информации`);
                }
            });
            
            // 5. Получаем данные о команде
            const team = await Team.findByPk(teamId);
            if (!team) {
                console.log(`Команда ID ${teamId} не найдена`);
            } else {
                console.log(`Загружена команда: ${team.name} (ID: ${team.id})`);
            }
            
            // 6. Получаем данные о соревновании, если есть
            let competitions = {};
            const competitionIds = [...new Set(invitations.map(inv => inv.CompetitionId).filter(id => id))];
            
            if (competitionIds.length > 0) {
                const competitionRecords = await Competition.findAll({
                    where: { id: competitionIds }
                });
                
                competitionRecords.forEach(comp => {
                    competitions[comp.id] = comp.get({ plain: true });
                });
                
                console.log(`Загружено ${competitionRecords.length} соревнований`);
            }
            
            // 7. Формируем полные данные для каждого приглашения
            const result = invitations.map(invitation => {
                const plainInvitation = invitation.get({ plain: true });
                
                // Добавляем данные пользователя
                if (userMap[plainInvitation.UserId]) {
                    plainInvitation.User = {
                        id: userMap[plainInvitation.UserId].id,
                        email: userMap[plainInvitation.UserId].email,
                        user_info: userMap[plainInvitation.UserId].user_info
                    };
                }
                
                // Добавляем данные приглашающего
                if (userMap[plainInvitation.InvitedBy]) {
                    plainInvitation.Inviter = {
                        id: userMap[plainInvitation.InvitedBy].id,
                        email: userMap[plainInvitation.InvitedBy].email,
                        user_info: userMap[plainInvitation.InvitedBy].user_info
                    };
                }
                
                // Добавляем данные о команде
                if (team) {
                    plainInvitation.Team = {
                        id: team.id,
                        name: team.name,
                        discription: team.discription
                    };
                }
                
                // Добавляем данные о соревновании
                if (plainInvitation.CompetitionId && competitions[plainInvitation.CompetitionId]) {
                    plainInvitation.Competition = competitions[plainInvitation.CompetitionId];
                }
                
                return plainInvitation;
            });
            
            // Логируем финальный результат (первое приглашение) для отладки
            if (result.length > 0) {
                const sample = result[0];
                console.log(`Пример данных приглашения (ID: ${sample.id}):`);
                
                if (sample.User) {
                    console.log(`- Пользователь: ${sample.User.email}, Инфо: ${sample.User.user_info ? 'Присутствует' : 'Отсутствует'}`);
                    if (sample.User.user_info) {
                        console.log(`- ФИО: ${sample.User.user_info.lastName || ''} ${sample.User.user_info.firstName || ''}`);
                    }
                } else {
                    console.log('- Данные пользователя отсутствуют');
                }
            }
            
            return res.json(result);
        } catch (e) {
            console.error('Ошибка при получении приглашений команды:', e);
            next(ApiError.badRequest(e.message));
        }
    }
    
    // Создание запроса на присоединение к команде
    async createJoinRequest(req, res, next) {
        try {
            const { TeamId, CompetitionId } = req.body;
            const UserId = req.user.id;
            
            console.log(`Запрос на присоединение к команде ID: ${TeamId} от пользователя ID: ${UserId}, CompetitionId: ${CompetitionId}`);
            
            // Проверка наличия поля type в таблице invitations
            try {
                const [columnCheck] = await sequelize.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'invitations' 
                    AND column_name = 'type'
                `);
                console.log(`Проверка поля type в таблице invitations: ${columnCheck.length > 0 ? 'Поле существует' : 'Поле НЕ существует!'}`);
            } catch (err) {
                console.error('Ошибка при проверке структуры таблицы:', err);
            }
            
            // Проверяем, существует ли уже запрос от этого пользователя к этой команде
            const existingRequest = await Invitation.findOne({
                where: { 
                    TeamId, 
                    UserId, 
                    type: 'join_request'
                }
            });
            
            if (existingRequest) {
                console.log('Запрос на присоединение уже существует');
                return res.status(400).json({ message: 'Вы уже отправили запрос на присоединение к этой команде' });
            }
            
            // Проверяем, не является ли пользователь уже членом команды
            const isMember = await Teammembers.findOne({
                where: { TeamId, UserId }
            });
            
            if (isMember) {
                console.log('Пользователь уже является членом команды');
                return res.status(400).json({ message: 'Вы уже являетесь членом этой команды' });
            }
            
            // Проверяем, ищет ли команда участников
            const team = await Team.findByPk(TeamId);
            
            if (!team) {
                console.log('Команда не найдена');
                return res.status(404).json({ message: 'Команда не найдена' });
            }
            
            if (!team.lookingForMembers || team.availableSlots <= 0) {
                console.log(`Команда (ID: ${TeamId}) не ищет участников или нет свободных мест. lookingForMembers: ${team.lookingForMembers}, availableSlots: ${team.availableSlots}`);
                return res.status(400).json({ message: 'Эта команда в настоящее время не набирает участников' });
            }
            
            // Создаем объект с данными запроса
            const requestData = {
                TeamId,
                UserId,
                InvitedBy: UserId, // В данном случае, пользователь сам отправляет запрос
                CompetitionId,
                status: 'pending',
                type: 'join_request' // Убедимся, что тип явно установлен как join_request
            };
            
            // Создаем запрос в базе данных
            console.log('Данные для создания запроса:', JSON.stringify(requestData));
            
            // Попробуем использовать прямой SQL-запрос для создания записи
            try {
                const [insertResult] = await sequelize.query(`
                    INSERT INTO "invitations" ("TeamId", "UserId", "InvitedBy", "CompetitionId", "status", "type", "createdAt", "updatedAt")
                    VALUES ('${TeamId}', '${UserId}', '${UserId}', '${CompetitionId || null}', 'pending', 'join_request', NOW(), NOW())
                    RETURNING *
                `);
                
                console.log('Результат SQL-запроса на создание:', insertResult);
                
                if (insertResult && insertResult.length > 0) {
                    const joinRequest = insertResult[0];
                    console.log(`Создан запрос на присоединение к команде ID: ${joinRequest.id}`);
                    
                    // Возвращаем информацию о созданном запросе
                    return res.status(200).json({
                        id: joinRequest.id,
                        status: joinRequest.status,
                        message: 'Запрос на присоединение к команде успешно отправлен'
                    });
                }
            } catch (sqlError) {
                console.error('Ошибка при SQL-вставке:', sqlError);
                // Если SQL-запрос не удался, продолжаем с ORM
            }
            
            // Создаем запрос в базе данных через ORM
            const joinRequest = await Invitation.create(requestData);
            
            console.log(`Создан запрос на присоединение к команде ID: ${joinRequest.id}`);
            
            // Проверяем созданный запрос
            const createdRequest = await Invitation.findByPk(joinRequest.id);
            if (createdRequest) {
                const plainRequest = createdRequest.get({ plain: true });
                console.log('Проверка созданного запроса (plain object):', plainRequest);
                console.log('Проверка полей запроса:', {
                    id: createdRequest.id,
                    TeamId: createdRequest.TeamId,
                    UserId: createdRequest.UserId,
                    type: createdRequest.type,
                    status: createdRequest.status
                });
            } else {
                console.log('ВНИМАНИЕ: Не удалось найти созданный запрос!');
            }
            
            // Возвращаем информацию о созданном запросе
            return res.status(200).json({
                id: joinRequest.id,
                status: joinRequest.status,
                message: 'Запрос на присоединение к команде успешно отправлен'
            });
        } catch (error) {
            console.error('Ошибка при создании запроса на присоединение к команде:', error);
            return next(ApiError.badRequest(error.message));
        }
    }
    
    // Получение запросов на присоединение к команде
    async getTeamJoinRequests(req, res, next) {
        try {
            const { teamId } = req.params;
            const UserId = req.user.id;
            
            console.log(`Запрос на получение заявок на присоединение к команде ID: ${teamId}, от пользователя ID: ${UserId}, роль: ${req.user.role}`);
            
            // Проверяем права доступа (только капитан или администратор может видеть заявки)
            const teamMember = await Teammembers.findOne({
                where: { TeamId: teamId, UserId, is_capitan: true }
            });
            
            // Проверка на администраторские права (любая из админ-ролей)
            const isAdmin = ['admin', 'fsp', 'regional'].includes(req.user.role.toLowerCase());
            
            if (!teamMember && !isAdmin) {
                console.log(`Отказано в доступе: пользователь ID ${UserId} не является капитаном команды ID ${teamId} и не имеет админ-прав (роль: ${req.user.role})`);
                return res.status(403).json({ message: 'У вас нет прав для просмотра заявок на эту команду' });
            }
            
            // Проверка наличия поля type в таблице invitations
            try {
                const [columnCheck] = await sequelize.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'invitations' 
                    AND column_name = 'type'
                `);
                console.log(`Проверка поля type в таблице invitations: ${columnCheck.length > 0 ? 'Поле существует' : 'Поле НЕ существует!'}`);
            } catch (err) {
                console.error('Ошибка при проверке структуры таблицы:', err);
            }
            
            // Перед поиском запросов, проверим все запросы join_request без фильтра по статусу
            const allJoinRequestsForTeam = await Invitation.findAll({
                where: { 
                    type: 'join_request',
                    TeamId: teamId
                }
            });
            
            console.log(`Найдено ${allJoinRequestsForTeam.length} запросов join_request для команды ${teamId} (все статусы)`);
            
            if (allJoinRequestsForTeam.length > 0) {
                console.log('Статусы запросов:', allJoinRequestsForTeam.map(req => req.status));
            }
            
            // Получаем все запросы на присоединение к команде
            // Создаем условие WHERE с учетом только корректных имен полей
            console.log(`Выполнение запроса поиска с параметрами: TeamId=${teamId}, type='join_request', status='pending'`);
            
            const whereCondition = {
                type: 'join_request',
                status: 'pending',
                TeamId: teamId
            };
            
            console.log('Условие поиска:', JSON.stringify(whereCondition));
            
            const joinRequests = await Invitation.findAll({
                where: whereCondition,
                include: [
                    {
                        model: User,
                        attributes: ['id', 'email'],
                        include: [
                            {
                                model: UserInfo,
                                as: 'user_info',
                                required: false,
                                attributes: ['firstName', 'lastName', 'middleName', 'phone']
                            }
                        ]
                    },
                    {
                        model: Team,
                        attributes: ['id', 'name', 'discription']
                    },
                    {
                        model: Competition,
                        attributes: ['id', 'name', 'discription', 'format', 'startdate', 'enddate']
                    }
                ]
            });
            
            console.log(`Найдено ${joinRequests.length} заявок на присоединение к команде`);
            
            if (joinRequests.length === 0) {
                // Выполним дополнительный запрос для проверки, есть ли вообще запросы join_request
                console.log('Проверка наличия любых запросов типа join_request в базе данных');
                const allJoinRequests = await Invitation.findAll({
                    where: { type: 'join_request' }
                });
                console.log(`Найдено всего ${allJoinRequests.length} запросов типа join_request в базе данных`);
                
                // Проверим, есть ли какие-либо записи в таблице invitations
                const allInvitations = await Invitation.findAll({
                    limit: 5
                });
                console.log(`Пример записей в таблице invitations (первые ${allInvitations.length}):`);
                allInvitations.forEach(inv => {
                    console.log(`ID: ${inv.id}, TeamId: ${inv.TeamId}, UserId: ${inv.UserId}, type: ${inv.type || 'не указан'}, status: ${inv.status}`);
                });
                
                // Также выполним SQL-запрос напрямую, чтобы увидеть все имена столбцов
                try {
                    const [columns] = await sequelize.query(`
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_name = 'invitations'
                    `);
                    console.log('Все столбцы таблицы invitations:', columns.map(c => c.column_name));
                    
                    // Выполним SQL-запрос напрямую
                    const [rawRequests] = await sequelize.query(`
                        SELECT * FROM "invitations" WHERE "TeamId" = '${teamId}'
                    `);
                    console.log(`Найдено ${rawRequests.length} записей для TeamId=${teamId} напрямую через SQL`);
                    if (rawRequests.length > 0) {
                        console.log('Первая запись:', rawRequests[0]);
                    }
                    
                    // Проверим запрос с учетом условия type
                    const [joinRequests] = await sequelize.query(`
                        SELECT * FROM "invitations" WHERE "TeamId" = '${teamId}' AND "type" = 'join_request'
                    `);
                    console.log(`Найдено ${joinRequests.length} join_request записей для TeamId=${teamId} напрямую через SQL`);
                    if (joinRequests.length > 0) {
                        console.log('Первый join_request:', joinRequests[0]);
                    }
                    
                    // Если SQL-запрос нашел записи, но ORM нет, используем SQL
                    if (joinRequests.length > 0) {
                        console.log('Будем использовать результаты SQL-запроса, так как ORM не нашел записи');
                        
                        // Преобразуем SQL-результаты в формат, аналогичный ORM
                        const processedRequests = await Promise.all(joinRequests.map(async (req) => {
                            const userInfo = await User.findOne({
                                where: { id: req.UserId },
                                include: [{
                                    model: UserInfo,
                                    as: 'user_info',
                                    required: false
                                }]
                            });
                            
                            const team = await Team.findByPk(req.TeamId);
                            const competition = req.CompetitionId ? await Competition.findByPk(req.CompetitionId) : null;
                            
                            return {
                                ...req,
                                User: userInfo ? {
                                    id: userInfo.id,
                                    email: userInfo.email,
                                    user_info: userInfo.user_info
                                } : null,
                                Team: team ? {
                                    id: team.id,
                                    name: team.name,
                                    discription: team.discription
                                } : null,
                                Competition: competition ? {
                                    id: competition.id,
                                    name: competition.name,
                                    format: competition.format,
                                    startdate: competition.startdate,
                                    enddate: competition.enddate
                                } : null
                            };
                        }));
                        
                        return res.status(200).json(processedRequests);
                    }
                } catch (sqlError) {
                    console.error('Ошибка при выполнении SQL-запроса:', sqlError);
                }
                
                return res.status(200).json([]);
            }
            
            // Преобразуем в простые объекты для работы с ними
            let processedRequests = joinRequests.map(req => req.get({ plain: true }));
            console.log(`Преобразовано ${processedRequests.length} объектов`);
            
            // Детальное логирование первого запроса, если он есть
            if (processedRequests.length > 0) {
                const firstRequest = processedRequests[0];
                console.log(`Пример заявки ID ${firstRequest.id}:`);
                console.log(`- Команда: ${firstRequest.Team?.name || 'Не загружена'} (ID: ${firstRequest.TeamId || firstRequest.teamId})`);
                console.log(`- Пользователь: ${firstRequest.User?.email || 'Не загружен'} (ID: ${firstRequest.UserId || firstRequest.userId})`);
                console.log(`- Тип: ${firstRequest.type}, Статус: ${firstRequest.status}`);
            }
            
            // Загружаем дополнительные данные, если необходимо
            processedRequests = await loadAdditionalData(processedRequests);
            
            return res.status(200).json(processedRequests);
        } catch (error) {
            console.error('Ошибка при получении заявок на присоединение к команде:', error);
            return next(ApiError.badRequest(error.message));
        }
    }
    
    // Обработка запроса на присоединение к команде (принятие/отклонение)
    async respondToJoinRequest(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const UserId = req.user.id;
            
            console.log(`Обработка запроса на присоединение ID: ${id}, новый статус: ${status}`);
            
            if (status !== 'accepted' && status !== 'rejected') {
                console.log('Некорректный статус');
                return res.status(400).json({ message: 'Статус должен быть accepted или rejected' });
            }
            
            // Находим запрос
            const joinRequest = await Invitation.findOne({
                where: { 
                    id, 
                    type: 'join_request',
                    status: 'pending'
                },
                include: [{ model: Team }]
            });
            
            if (!joinRequest) {
                console.log('Запрос не найден или уже обработан');
                return res.status(404).json({ message: 'Запрос на присоединение не найден или уже обработан' });
            }
            
            // Проверяем права доступа (только капитан или администратор может обрабатывать заявки)
            const teamMember = await Teammembers.findOne({
                where: { 
                    TeamId: joinRequest.TeamId, 
                    UserId, 
                    is_capitan: true 
                }
            });
            
            // Проверка на администраторские права (любая из админ-ролей)
            const isAdmin = ['admin', 'fsp', 'regional'].includes(req.user.role.toLowerCase());
            
            if (!teamMember && !isAdmin) {
                console.log('Нет прав доступа для обработки заявки');
                return res.status(403).json({ message: 'У вас нет прав для обработки этой заявки' });
            }
            
            // Обрабатываем запрос
            joinRequest.status = status;
            await joinRequest.save();
            
            console.log(`Статус запроса обновлен на: ${status}`);
            
            // Если запрос принят, добавляем пользователя в команду
            if (status === 'accepted') {
                console.log(`Добавление пользователя ID: ${joinRequest.UserId} в команду ID: ${joinRequest.TeamId}`);
                
                // Проверяем наличие свободных мест
                const team = await Team.findByPk(joinRequest.TeamId);
                
                if (team.availableSlots <= 0) {
                    console.log('В команде нет свободных мест');
                    return res.status(400).json({ message: 'В команде больше нет свободных мест' });
                }
                
                // Добавляем пользователя в команду
                await Teammembers.create({
                    TeamId: joinRequest.TeamId,
                    UserId: joinRequest.UserId,
                    is_capitan: false
                });
                
                // Обновляем количество свободных мест в команде
                team.availableSlots = Math.max(0, team.availableSlots - 1);
                
                // Если все места заняты, отключаем поиск участников
                if (team.availableSlots === 0) {
                    team.lookingForMembers = false;
                }
                
                await team.save();
                
                console.log(`Пользователь добавлен в команду, осталось ${team.availableSlots} свободных мест`);
                
                return res.status(200).json({
                    message: 'Запрос на присоединение принят, пользователь добавлен в команду',
                    availableSlots: team.availableSlots
                });
            } else {
                return res.status(200).json({ message: 'Запрос на присоединение отклонен' });
            }
        } catch (error) {
            console.error('Ошибка при обработке запроса на присоединение:', error);
            return next(ApiError.badRequest(error.message));
        }
    }

    // Проверка наличия запроса на присоединение к команде от текущего пользователя
    async checkJoinRequest(req, res, next) {
        try {
            const { teamId } = req.params;
            const UserId = req.user.id;
            
            console.log(`Проверка наличия запроса на присоединение к команде ID: ${teamId} от пользователя ID: ${UserId}`);
            
            // Проверяем, является ли пользователь уже членом команды
            const isMember = await Teammembers.findOne({
                where: { TeamId: teamId, UserId }
            });
            
            if (isMember) {
                console.log(`Пользователь ID: ${UserId} уже является членом команды ID: ${teamId}`);
                return res.status(200).json({ exists: false, isMember: true });
            }
            
            // Проверяем наличие запроса от этого пользователя
            const joinRequest = await Invitation.findOne({
                where: { 
                    TeamId: teamId, 
                    UserId, 
                    type: 'join_request'
                }
            });
            
            if (joinRequest) {
                console.log(`Найден запрос на присоединение ID: ${joinRequest.id}, статус: ${joinRequest.status}`);
                return res.status(200).json({ 
                    exists: true, 
                    status: joinRequest.status,
                    requestId: joinRequest.id,
                    createdAt: joinRequest.createdAt
                });
            } else {
                console.log(`Запрос на присоединение от пользователя ID: ${UserId} к команде ID: ${teamId} не найден`);
                return res.status(200).json({ exists: false });
            }
        } catch (error) {
            console.error('Ошибка при проверке запроса на присоединение:', error);
            return next(ApiError.badRequest(error.message));
        }
    }

    // Получение запросов на присоединение к командам, где пользователь является капитаном
    async getUserTeamsJoinRequests(req, res, next) {
        try {
            const UserId = req.user.id;
            
            console.log(`Запрос на получение заявок на присоединение к командам, где пользователь ID: ${UserId} является капитаном`);
            
            // Сначала находим все команды, где пользователь является капитаном
            const captainTeams = await Teammembers.findAll({
                where: { 
                    UserId, 
                    is_capitan: true 
                },
                include: [{
                    model: Team,
                    attributes: ['id', 'name', 'discription', 'availableSlots', 'lookingForMembers', 'requiredRoles', 'CompetitionId']
                }]
            });
            
            console.log(`Найдено ${captainTeams.length} команд, где пользователь является капитаном`);
            
            if (captainTeams.length === 0) {
                return res.status(200).json([]);
            }
            
            // Получаем ID всех команд
            const teamIds = captainTeams.map(tm => tm.TeamId);
            console.log('ID команд, где пользователь капитан:', teamIds);
            
            // Создаем словарь команд для быстрого доступа
            const teamsMap = {};
            captainTeams.forEach(tm => {
                if (tm.Team) {
                    teamsMap[tm.TeamId] = tm.Team;
                }
            });
            
            // Ищем все запросы на присоединение к этим командам
            const joinRequests = await Invitation.findAll({
                where: {
                    TeamId: { [Sequelize.Op.in]: teamIds },
                    type: 'join_request',
                    status: 'pending'
                },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'email'],
                        include: [
                            {
                                model: UserInfo,
                                as: 'user_info',
                                required: false,
                                attributes: ['firstName', 'lastName', 'middleName', 'phone']
                            }
                        ]
                    },
                    {
                        model: Team,
                        attributes: ['id', 'name', 'discription', 'availableSlots', 'lookingForMembers', 'requiredRoles']
                    },
                    {
                        model: Competition,
                        attributes: ['id', 'name', 'discription', 'format', 'startdate', 'enddate']
                    }
                ]
            });
            
            console.log(`Найдено ${joinRequests.length} запросов на присоединение к командам пользователя`);
            
            if (joinRequests.length === 0) {
                // Проверка через прямой SQL-запрос
                try {
                    const teamIdsStr = teamIds.map(id => `'${id}'`).join(',');
                    const [sqlJoinRequests] = await sequelize.query(`
                        SELECT * FROM "invitations" 
                        WHERE "TeamId" IN (${teamIdsStr}) 
                        AND "type" = 'join_request'
                        AND "status" = 'pending'
                    `);
                    
                    console.log(`SQL-запрос нашел ${sqlJoinRequests.length} join_request для команд пользователя:`);
                    if (sqlJoinRequests.length > 0) {
                        console.log('Пример запроса:', sqlJoinRequests[0]);
                        
                        // Если SQL нашел записи, но ORM нет, преобразуем и вернем их
                        const userIds = sqlJoinRequests.map(req => req.UserId);
                        const competitionIds = sqlJoinRequests.map(req => req.CompetitionId).filter(id => id);
                        
                        // Загружаем всех пользователей одним запросом
                        const users = await User.findAll({
                            where: { id: userIds },
                            include: [{
                                model: UserInfo,
                                as: 'user_info',
                                required: false
                            }]
                        });
                        
                        // Создаем словарь пользователей
                        const usersMap = {};
                        users.forEach(user => {
                            usersMap[user.id] = user.get({ plain: true });
                        });
                        
                        // Загружаем все соревнования одним запросом
                        const competitions = await Competition.findAll({
                            where: { id: competitionIds }
                        });
                        
                        // Создаем словарь соревнований
                        const competitionsMap = {};
                        competitions.forEach(comp => {
                            competitionsMap[comp.id] = comp.get({ plain: true });
                        });
                        
                        const processedRequests = sqlJoinRequests.map(req => {
                            const userInfo = usersMap[req.UserId];
                            const team = teamsMap[req.TeamId];
                            const competition = competitionsMap[req.CompetitionId];
                            
                            return {
                                ...req,
                                User: userInfo ? {
                                    id: userInfo.id,
                                    email: userInfo.email,
                                    user_info: userInfo.user_info
                                } : null,
                                Team: team ? {
                                    id: team.id,
                                    name: team.name,
                                    discription: team.discription,
                                    availableSlots: team.availableSlots,
                                    lookingForMembers: team.lookingForMembers,
                                    requiredRoles: team.requiredRoles
                                } : null,
                                Competition: competition ? {
                                    id: competition.id,
                                    name: competition.name,
                                    format: competition.format,
                                    startdate: competition.startdate,
                                    enddate: competition.enddate
                                } : null
                            };
                        });
                        
                        // Вернем только запросы со статусом pending
                        const pendingRequests = processedRequests.filter(req => req.status === 'pending');
                        console.log(`Из них со статусом pending: ${pendingRequests.length}`);
                        
                        return res.status(200).json(pendingRequests);
                    }
                } catch (sqlError) {
                    console.error('Ошибка при выполнении SQL-запроса:', sqlError);
                }
                
                return res.status(200).json([]);
            }
            
            // Получаем ID всех пользователей из запросов для дополнительной информации
            const userIds = [...new Set(joinRequests.map(req => req.UserId))];
            
            // Загружаем всех пользователей одним запросом
            const allUsers = await User.findAll({
                where: { id: userIds },
                include: [{
                    model: UserInfo,
                    as: 'user_info',
                    required: false
                }]
            });
            
            console.log(`Загружено ${allUsers.length} пользователей для дополнения данных`);
            
            // Создаем словарь пользователей
            const usersMap = {};
            allUsers.forEach(user => {
                usersMap[user.id] = user.get({ plain: true });
            });
            
            // Получаем ID всех соревнований
            const competitionIds = [...new Set(joinRequests.map(req => req.CompetitionId).filter(id => id))];
            
            // Загружаем все соревнования одним запросом
            const allCompetitions = await Competition.findAll({
                where: { id: competitionIds }
            });
            
            console.log(`Загружено ${allCompetitions.length} соревнований для дополнения данных`);
            
            // Создаем словарь соревнований
            const competitionsMap = {};
            allCompetitions.forEach(comp => {
                competitionsMap[comp.id] = comp.get({ plain: true });
            });
            
            // Преобразуем результаты в простые объекты
            const processedRequests = joinRequests.map(req => {
                const plainReq = req.get({ plain: true });
                
                // Проверяем и дополняем информацию о пользователе
                if (!plainReq.User || !plainReq.User.user_info) {
                    const user = usersMap[plainReq.UserId];
                    if (user) {
                        console.log(`Дополняем информацию о пользователе ID: ${user.id}`);
                        plainReq.User = user;
                    }
                }
                
                // Проверяем и дополняем информацию о команде
                if (!plainReq.Team || !plainReq.Team.name) {
                    const team = teamsMap[plainReq.TeamId];
                    if (team) {
                        console.log(`Дополняем информацию о команде ID: ${team.id}`);
                        plainReq.Team = team;
                    }
                }
                
                // Проверяем и дополняем информацию о соревновании
                if (!plainReq.Competition || !plainReq.Competition.name) {
                    const competition = competitionsMap[plainReq.CompetitionId];
                    if (competition) {
                        console.log(`Дополняем информацию о соревновании ID: ${competition.id}`);
                        plainReq.Competition = competition;
                    }
                }
                
                return plainReq;
            });
            
            return res.status(200).json(processedRequests);
        } catch (error) {
            console.error('Ошибка при получении запросов на присоединение:', error);
            return next(ApiError.badRequest(error.message));
        }
    }
}

module.exports = new InvitationController(); 