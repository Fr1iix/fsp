const ApiError = require('../errorr/ApiError')
const { Op } = require('sequelize');
const { Team, User, Teammembers, Competition } = require('../models/models')

class TeamController {
    getAll = async (req, res, next) => {
        try {
            let limit = parseInt(req.query.limit, 10) || 10;
            let offset = parseInt(req.query.offset, 10) || 0;
            const search = req.query.search || '';

            const whereClause = search
                ? {
                name: {
                    [Op.iLike]: `%${search}%`, // для Postgres; используйте [Op.substring] для других СУБД
                },
            }
            : {};

            // Загружаем команды с полной информацией
            const teams = await Team.findAll({
                where: whereClause,
                limit, offset,
                include: [
                    {
                        model: Competition,
                        attributes: ['id', 'name', 'discription', 'status']
                    },
                    {
                        model: Teammembers,
                        include: [
                            {
                                model: User,
                                attributes: ['id', 'email'],
                                include: [{
                                    model: require('../models/models').UserInfo,
                                    as: 'user_info',
                                    attributes: ['firstName', 'lastName', 'middleName', 'phone']
                                }]
                            }
                        ]
                    }
                ]
            });

            console.log(`Найдено ${teams.length} команд`);
            return res.status(200).json(teams);
        } catch (error) {
            console.error('Ошибка при получении списка команд:', error);
            next(ApiError.badRequest(error.message));
        }        
    }

    async getTeam(req, res, next) {
        try {
            const id = req.params.id;
            
            // Загружаем команду с полной информацией
            const oneTeam = await Team.findByPk(id, {
                include: [
                    {
                        model: Competition,
                        attributes: ['id', 'name', 'discription', 'status']
                    },
                    {
                        model: Teammembers,
                        include: [
                            {
                                model: User,
                                attributes: ['id', 'email'],
                                include: [{
                                    model: require('../models/models').UserInfo,
                                    as: 'user_info',
                                    attributes: ['firstName', 'lastName', 'middleName', 'phone']
                                }]
                            }
                        ]
                    }
                ]
            });
            
            if (!oneTeam) {
                return res.status(404).json({ message: 'Команда не найдена' });
            }
            
            return res.status(200).json(oneTeam);
        } catch (error) {
            console.error('Ошибка при получении информации о команде:', error);
            next(ApiError.badRequest(error.message));
        }
    }

    async create(req, res, next) {
        try {
            let { CompetitionId, name, discription, points, result, teammembersId} = req.body
            
            console.log('Создание команды с параметрами:', {
                CompetitionId, 
                name, 
                discription, 
                points, 
                result
            });
            
            // Проверяем наличие обязательных полей
            if (!name) {
                return res.status(400).json({ message: 'Название команды обязательно' });
            }
            
            const team = await Team.create({
                CompetitionId, 
                name, 
                discription: discription || '', 
                points: points || 0, 
                result: result || 0, 
                teammembersId
            });
            
            console.log('Создана команда:', {
                id: team.id,
                name: team.name,
                CompetitionId: team.CompetitionId
            });
            
            return res.status(200).json(team)
        } catch (e) {
            console.error('Ошибка при создании команды:', e);
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteTeam(req,res){
        const id = req.params.id
        await Team.destroy({where: {id}})
    }

    async updateOne(req, res) {
        const {id} = req.params;
        const {
            CompetitionId, name, discription, points, result, teammembersId
        } = req.body;


        try {
            const team = await Team.findOne({where: {id}});

            if (!team) {
                return res.status(404).json({error: 'Team was not found'});
            }
            
            team.CompetitionId = CompetitionId;
            team.name = name;
            team.discription = discription;
            team.points = points;
            team.result = result;
            team.teammembersId = teammembersId;

            await team.save();

            return res.status(200).json(team);
        } catch (error) {
            console.error(error);
            return res.status(500).json({error: 'Internal server error'});
        }
    }
}

module.exports = new TeamController();