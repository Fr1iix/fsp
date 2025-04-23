const { Competition, User, UserInfo, Team, Discipline, Regions, Application } = require('../models/models');
const { Op } = require('sequelize');
const excel = require('exceljs');

class AnalyticsController {
    async getCompetitionsAnalytics(req, res) {
        try {
            const { disciplineId, regionId, startDate, endDate, status } = req.query;
            
            let whereClause = {};
            
            if (disciplineId) {
                whereClause.disciplineId = disciplineId;
            }
            
            if (regionId) {
                whereClause.regionId = regionId;
            }
            
            if (startDate && endDate) {
                whereClause.startdate = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }
            
            if (status) {
                whereClause.status = status;
            }

            const competitions = await Competition.findAll({
                where: whereClause,
                include: [
                    {
                        model: Discipline,
                        attributes: ['name']
                    },
                    {
                        model: Regions,
                        attributes: ['name']
                    }
                ]
            });

            return res.json(competitions);
        } catch (e) {
            return res.status(500).json({ message: "Ошибка при получении аналитики соревнований" });
        }
    }

    async getAthletesAnalytics(req, res) {
        try {
            const { regionId, disciplineId } = req.query;
            
            let whereClause = {};
            
            if (regionId) {
                whereClause.idRegions = regionId;
            }

            const athletes = await User.findAll({
                where: whereClause,
                include: [
                    {
                        model: UserInfo,
                        attributes: ['firstName', 'lastName', 'middleName']
                    },
                    {
                        model: Regions,
                        attributes: ['name']
                    },
                    {
                        model: Application,
                        include: [
                            {
                                model: Competition,
                                where: disciplineId ? { disciplineId } : {},
                                required: false
                            }
                        ]
                    }
                ]
            });

            return res.json(athletes);
        } catch (e) {
            return res.status(500).json({ message: "Ошибка при получении аналитики спортсменов" });
        }
    }

    async exportAnalytics(req, res) {
        try {
            const { type, ...filters } = req.query;
            
            let data;
            if (type === 'competitions') {
                data = await this.getCompetitionsData(filters);
            } else if (type === 'athletes') {
                data = await this.getAthletesData(filters);
            } else {
                return res.status(400).json({ message: "Неверный тип данных для экспорта" });
            }

            const workbook = new excel.Workbook();
            const worksheet = workbook.addWorksheet(type === 'competitions' ? 'Соревнования' : 'Спортсмены');

            // Настройка заголовков и данных в зависимости от типа
            if (type === 'competitions') {
                worksheet.columns = [
                    { header: 'Название', key: 'name' },
                    { header: 'Дисциплина', key: 'discipline' },
                    { header: 'Регион', key: 'region' },
                    { header: 'Дата начала', key: 'startDate' },
                    { header: 'Статус', key: 'status' }
                ];
            } else {
                worksheet.columns = [
                    { header: 'ФИО', key: 'fullName' },
                    { header: 'Регион', key: 'region' },
                    { header: 'Количество соревнований', key: 'competitionsCount' }
                ];
            }

            worksheet.addRows(data);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${type}_analytics.xlsx`);

            await workbook.xlsx.write(res);
            res.end();
        } catch (e) {
            return res.status(500).json({ message: "Ошибка при экспорте данных" });
        }
    }

    async getCompetitionsData(filters) {
        const competitions = await Competition.findAll({
            where: this.buildCompetitionFilters(filters),
            include: [
                { model: Discipline, attributes: ['name'] },
                { model: Regions, attributes: ['name'] }
            ]
        });

        return competitions.map(comp => ({
            name: comp.name,
            discipline: comp.Discipline?.name,
            region: comp.Regions?.name,
            startDate: comp.startdate,
            status: comp.status
        }));
    }

    async getAthletesData(filters) {
        const athletes = await User.findAll({
            where: this.buildAthleteFilters(filters),
            include: [
                { model: UserInfo },
                { model: Regions, attributes: ['name'] },
                { model: Application, include: [{ model: Competition }] }
            ]
        });

        return athletes.map(athlete => ({
            fullName: `${athlete.UserInfo?.lastName || ''} ${athlete.UserInfo?.firstName || ''} ${athlete.UserInfo?.middleName || ''}`,
            region: athlete.Regions?.name,
            competitionsCount: athlete.Applications?.length || 0
        }));
    }

    buildCompetitionFilters(filters) {
        const whereClause = {};
        
        if (filters.disciplineId) whereClause.disciplineId = filters.disciplineId;
        if (filters.regionId) whereClause.regionId = filters.regionId;
        if (filters.status) whereClause.status = filters.status;
        
        if (filters.startDate && filters.endDate) {
            whereClause.startdate = {
                [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)]
            };
        }

        return whereClause;
    }

    buildAthleteFilters(filters) {
        const whereClause = {};
        
        if (filters.regionId) whereClause.idRegions = filters.regionId;
        
        return whereClause;
    }
}

module.exports = new AnalyticsController(); 