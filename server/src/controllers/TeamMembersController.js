const { Teammembers, User, UserInfo } = require('../models/models')

class TeamMembersController {
    async getAll(req, res) {
        try {
            const { teamId } = req.params
            const { page = 1, limit = 10, search = '' } = req.query

            const offset = (page - 1) * limit

            const whereCondition = {
                TeamId: teamId
            }

            const members = await Teammembers.findAndCountAll({
                where: whereCondition,
                include: [{
                    model: User,
                    include: [{
                        model: UserInfo,
                        as: 'user_info',
                        attributes: ['firstName', 'lastName', 'middleName']
                    }],
                    attributes: ['id', 'email']
                }],
                limit: parseInt(limit),
                offset: parseInt(offset)
            })

            // Форматируем данные для ответа
            const formattedMembers = members.rows.map(member => {
                const userInfo = member.User.user_info || {}
                return {
                    ...member.toJSON(),
                    User: {
                        ...member.User.toJSON(),
                        fullName: [userInfo.lastName, userInfo.firstName, userInfo.middleName]
                            .filter(Boolean)
                            .join(' ') || 'Имя не указано'
                    }
                }
            })

            return res.json({
                count: members.count,
                rows: formattedMembers
            })
        } catch (error) {
            console.error('Error in getAll TeamMembers:', error)
            return res.status(400).json({ message: error.message })
        }
    }

    async getOne(req, res) {
        try {
            const { id } = req.params
            const member = await Teammembers.findOne({
                where: { id },
                include: [{
                    model: User,
                    include: [{
                        model: UserInfo,
                        as: 'user_info',
                        attributes: ['firstName', 'lastName', 'middleName']
                    }],
                    attributes: ['id', 'email']
                }]
            })

            if (!member) {
                return res.status(404).json({ message: 'Участник команды не найден' })
            }

            const userInfo = member.User.user_info || {}
            const formattedMember = {
                ...member.toJSON(),
                User: {
                    ...member.User.toJSON(),
                    fullName: [userInfo.lastName, userInfo.firstName, userInfo.middleName]
                        .filter(Boolean)
                        .join(' ') || 'Имя не указано'
                }
            }

            return res.json(formattedMember)
        } catch (error) {
            console.error('Error in getOne TeamMember:', error)
            return res.status(400).json({ message: error.message })
        }
    }

    // ... остальные методы контроллера ...
}

module.exports = new TeamMembersController() 