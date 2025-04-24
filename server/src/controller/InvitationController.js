const ApiError = require("../errorr/ApiError");
const { Invitation, User, Team, Competition, Teammembers, UserInfo, Application } = require("../models/models");

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
        if (!invitation.Inviter && invitation.InvitedBy) {
            try {
                console.log(`Загрузка данных о приглашающем пользователе ID: ${invitation.InvitedBy}`);
                const inviter = await User.findOne({
                    where: { id: invitation.InvitedBy },
                    include: [{
                        model: UserInfo,
                        as: 'user_info',
                        attributes: ['firstName', 'lastName', 'middleName']
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
                            middleName: inviter.user_info.middleName
                        } : null
                    };
                } else {
                    console.log(`Приглашающий пользователь ID: ${invitation.InvitedBy} не найден`);
                }
            } catch (error) {
                console.error(`Ошибка при загрузке приглашающего пользователя ID: ${invitation.InvitedBy}`, error);
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
                                attributes: ['firstName', 'lastName', 'middleName']
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
            }
            
            // Если у некоторых приглашений отсутствуют данные о команде или соревновании,
            // попробуем загрузить их отдельно
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
}

module.exports = new InvitationController(); 