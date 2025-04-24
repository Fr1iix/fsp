const ApiError = require("../errorr/ApiError")
const { Op } = require('sequelize');
const { Teammembers, User } = require("../models/models")

class TeamMembersController{
    getAll = async (req, res, next) => {
        try {
            let limit = parseInt(req.query.limit, 10) || 10;
            let offset = parseInt(req.query.offset, 10) || 0;
            const search = req.query.search || '';

            const whereClause = search
                ? {
                    name: {
                        [Op.iLike]: `%${search}%`,
                    },
                }
                : {};

            const TeamMem = await Teammembers.findAll({
                where: whereClause,
                limit,
                offset,
                include: [{
                    model: User,
                    attributes: ['id', 'email'],
                    include: [{
                        model: require('../models/models').UserInfo,
                        as: 'user_info',
                        attributes: ['firstName', 'lastName', 'middleName', 'phone']
                    }]
                }]
            });

            // Форматируем данные для ответа
            const formattedTeamMembers = TeamMem.map(member => {
                const plainMember = member.get({ plain: true });
                return {
                    ...plainMember,
                    User: plainMember.User ? {
                        ...plainMember.User,
                        fullName: plainMember.User.user_info ? 
                            [
                                plainMember.User.user_info.lastName || '',
                                plainMember.User.user_info.firstName || '',
                                plainMember.User.user_info.middleName || ''
                            ].filter(Boolean).join(' ') : 'Имя не указано'
                    } : null
                };
            });

            return res.status(200).json(formattedTeamMembers);
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }

    async getOne(req, res, next) {
        try {
            const id = req.params.id;
            const OneTeamMem = await Teammembers.findOne({
                where: { id },
                include: [{
                    model: User,
                    attributes: ['id', 'email'],
                    include: [{
                        model: require('../models/models').UserInfo,
                        as: 'user_info',
                        attributes: ['firstName', 'lastName', 'middleName', 'phone']
                    }]
                }]
            });

            if (!OneTeamMem) {
                return res.status(404).json({ message: 'Участник команды не найден' });
            }

            // Форматируем данные для ответа
            const plainMember = OneTeamMem.get({ plain: true });
            const formattedMember = {
                ...plainMember,
                User: plainMember.User ? {
                    ...plainMember.User,
                    fullName: plainMember.User.user_info ? 
                        [
                            plainMember.User.user_info.lastName || '',
                            plainMember.User.user_info.firstName || '',
                            plainMember.User.user_info.middleName || ''
                        ].filter(Boolean).join(' ') : 'Имя не указано'
                } : null
            };

            return res.status(200).json(formattedMember);
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }

    async create(req, res, next) {
        try {
            let {is_capitan, UserId, TeamId} = req.body
            const TeamMem = await Teammembers.create({is_capitan, UserId, TeamId});
            return res.status(200).json(TeamMem)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteResults(req,res){
        const id = req.params.id
        await Teammembers.destroy({where: {id}})
    }

    async updateOne(req, res) {
        const {id} = req.params;
        const {
            is_capitan, UserId, TeamId
        } = req.body;


        try {
            const TeamMem = await Teammembers.findOne({where: {id}});

            if (!TeamMem) {
                return res.status(404).json({error: 'User was not found'});
            }
            TeamMem.is_capitan = is_capitan;
            TeamMem.UserId = UserId;
            TeamMem.TeamId = TeamId;
            
            await TeamMem.save();

            return res.status(200).json(TeamMem);
        } catch (error) {
            console.error(error);
            return res.status(500).json({error: 'Internal server error'});
        }
    }
}

module.exports = new TeamMembersController();