const ApiError = require("../errorr/ApiError")
const { Op } = require('sequelize');
const { Application, User, Team, Competition } = require("../models/models")

class ApplicationController {
    async getAll(req, res, next) {
        try {
            let limit = parseInt(req.query.limit, 10) || 10;
            let offset = parseInt(req.query.offset, 10) || 0;
            const search = req.query.search || '';
            const status = req.query.status || null;

            const whereClause = {};

            if (search) {
                whereClause.UUID = {
                    [Op.iLike]: `%${search}%`
                };
            }

            if (status) {
                whereClause.status = status;
            }

            const applications = await Application.findAll({
                where: whereClause,
                limit,
                offset,
                include: [
                    { model: User },
                    { model: Team },
                    { model: Competition }
                ]
            });

            return res.status(200).json(applications);
        } catch (error) {
            next(ApiError.badRequest(error.message));
        }
    }

    async getByUser(req, res, next) {
        try {
            const UserId = req.params.userId;

            const applications = await Application.findAll({
                where: { UserId },
                include: [
                    { model: User },
                    { model: Team },
                    { model: Competition }
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
            const application = await Application.findByPk(id, {
                include: [
                    { model: User },
                    { model: Team },
                    { model: Competition }
                ]
            });

            if (!application) {
                return res.status(404).json({ message: 'Заявка не найдена' });
            }

            return res.status(200).json(application);
        } catch (error) {
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
            const { id } = req.params;
            const { status } = req.body;

            if (!['pending', 'approved', 'rejected'].includes(status)) {
                return res.status(400).json({ message: 'Неверный статус заявки' });
            }

            const application = await Application.findByPk(id);
            if (!application) {
                return res.status(404).json({ message: 'Заявка не найдена' });
            }

            application.status = status;
            await application.save();

            return res.status(200).json(application);
        } catch (error) {
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
}

module.exports = new ApplicationController();