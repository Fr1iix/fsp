const ApiError = require("../errorr/ApiError");
const { CompetitionResult, User, UserInfo, Team, Competition, Results, Teammembers } = require("../models/models");
const { Op } = require('sequelize');

class CompetitionResultController {
    // Получение всех результатов соревнования
    async getCompetitionResults(req, res, next) {
        try {
            const { competitionId } = req.params;

            const results = await CompetitionResult.findAll({
                where: { CompetitionId: competitionId },
                include: [
                    {
                        model: User,
                        include: [{ model: UserInfo }]
                    },
                    {
                        model: Team
                    }
                ],
                order: [['place', 'ASC']]
            });

            return res.json(results);
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }

    // Получение результатов конкретного спортсмена
    async getUserResults(req, res, next) {
        try {
            const { userId } = req.params;

            const results = await CompetitionResult.findAll({
                where: { UserId: userId },
                include: [
                    {
                        model: Competition
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            return res.json(results);
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }

    // Добавление результата соревнования
    async addResult(req, res, next) {
        try {
            const { competitionId, userId, teamId, place, points } = req.body;

            // Проверяем, существует ли уже результат для этого спортсмена в этом соревновании
            const existingResult = await CompetitionResult.findOne({
                where: {
                    CompetitionId: competitionId,
                    UserId: userId
                }
            });

            if (existingResult) {
                return res.status(400).json({ message: "Результат для этого спортсмена уже существует" });
            }

            const result = await CompetitionResult.create({
                CompetitionId: competitionId,
                UserId: userId,
                TeamId: teamId,
                place,
                points,
                isConfirmed: false
            });

            return res.json(result);
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }

    // Добавление результатов для команд в соревновании (для организаторов и региональных представителей)
    async addTeamResults(req, res, next) {
        try {
            const { competitionId } = req.params;
            const { results } = req.body; // [{teamId, place, points}]

            // Проверка доступа - только организаторы или региональные представители могут добавлять результаты
            const competition = await Competition.findByPk(competitionId);
            if (!competition) {
                return res.status(404).json({ message: "Соревнование не найдено" });
            }

            // Проверка, что все команды действительно существуют и участвуют в этом соревновании
            const teamIds = results.map(r => r.teamId);
            const teams = await Team.findAll({
                where: {
                    id: { [Op.in]: teamIds },
                    CompetitionId: competitionId
                }
            });

            if (teams.length !== teamIds.length) {
                return res.status(400).json({ message: "Некоторые команды не найдены или не участвуют в этом соревновании" });
            }

            // Обновление результатов команд
            const updatedTeams = [];
            for (const result of results) {
                const team = teams.find(t => t.id === result.teamId);

                team.points = result.points;
                team.result = result.place;
                await team.save();

                // Теперь создаем или обновляем записи CompetitionResult для каждого участника команды
                const teamMembers = await Teammembers.findAll({
                    where: { TeamId: team.id }
                });

                for (const member of teamMembers) {
                    await CompetitionResult.upsert({
                        CompetitionId: competitionId,
                        UserId: member.UserId,
                        TeamId: team.id,
                        place: result.place,
                        points: result.points,
                        isConfirmed: false
                    });
                }

                updatedTeams.push({
                    ...team.get(),
                    newPlace: result.place,
                    newPoints: result.points
                });
            }

            // Обновляем статус соревнования на "Завершено"
            await Competition.update(
                { status: 'Завершено' },
                { where: { id: competitionId } }
            );

            return res.json({
                message: "Результаты команд обновлены",
                teams: updatedTeams
            });
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }

    // Обновление результата соревнования
    async updateResult(req, res, next) {
        try {
            const { id } = req.params;
            const { place, points, isConfirmed } = req.body;

            const result = await CompetitionResult.findByPk(id);

            if (!result) {
                return res.status(404).json({ message: "Результат не найден" });
            }

            result.place = place;
            result.points = points;
            result.isConfirmed = isConfirmed;

            await result.save();

            return res.json(result);
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }

    // Подтверждение результатов соревнования (для организатора)
    async confirmResults(req, res, next) {
        try {
            const { competitionId } = req.params;

            // Обновляем статус подтверждения для всех результатов соревнования
            await CompetitionResult.update(
                { isConfirmed: true },
                { where: { CompetitionId: competitionId } }
            );

            // Обновляем статус соревнования на "Завершено"
            await Competition.update(
                { status: 'Завершено' },
                { where: { id: competitionId } }
            );

            // Обновляем статистику спортсменов
            const results = await CompetitionResult.findAll({
                where: { CompetitionId: competitionId }
            });

            for (const result of results) {
                // Обновляем количество соревнований и средний рейтинг спортсмена
                const userResults = await CompetitionResult.findAll({
                    where: { UserId: result.UserId }
                });

                const totalCompetitions = userResults.length;
                const totalPoints = userResults.reduce((sum, r) => sum + r.points, 0);
                const averageRating = Math.round(totalPoints / totalCompetitions);

                // Обновляем или создаем запись в таблице Results
                await Results.upsert({
                    UserId: result.UserId,
                    AmountOfCompetitions: totalCompetitions,
                    middlerating: averageRating
                });
            }

            return res.json({ message: "Результаты подтверждены и статистика обновлена" });
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }

    // Удаление результата соревнования
    async deleteResult(req, res, next) {
        try {
            const { id } = req.params;

            await CompetitionResult.destroy({
                where: { id }
            });

            return res.json({ message: "Результат удален" });
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }
}

module.exports = new CompetitionResultController(); 