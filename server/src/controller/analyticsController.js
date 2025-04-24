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
            console.log("Запрос аналитики спортсменов с параметрами:", { regionId, disciplineId });
            
            let whereClause = {};
            
            if (regionId) {
                whereClause.idRegions = regionId;
            }

            console.log("Применяемый фильтр:", whereClause);

            const athletes = await User.findAll({
                where: { ...whereClause, role: 'athlete' },
                include: [
                    {
                        model: UserInfo,
                        as: 'user_info',
                        attributes: ['firstName', 'lastName', 'middleName']
                    },
                    {
                        model: Regions,
                        attributes: ['name'],
                        required: false
                    },
                    {
                        model: Application,
                        include: [
                            {
                                model: Competition,
                                where: disciplineId ? { disciplineId } : {},
                                required: false
                            }
                        ],
                        required: false
                    },
                    {
                        model: require('../models/models').Results,
                        required: false
                    }
                ]
            });

            console.log(`Найдено спортсменов: ${athletes.length}`);
            if (athletes.length > 0) {
                const sampleAthlete = athletes[0];
                // Проверяем обе возможности названия поля
                const regionName = sampleAthlete.region?.name || sampleAthlete.Region?.name;
                
                // Считаем только принятые заявки
                const approvedApplications = sampleAthlete.applications?.filter(app => app.status === 'approved') || [];
                
                console.log("Пример данных спортсмена:", {
                    id: sampleAthlete.id,
                    userInfo: sampleAthlete.user_info ? 'Присутствует' : 'Отсутствует',
                    regionName: regionName || 'Отсутствует',
                    idRegions: sampleAthlete.idRegions,
                    totalApplications: sampleAthlete.applications?.length || 0,
                    approvedApplications: approvedApplications.length,
                    applicationStatuses: sampleAthlete.applications?.map(app => app.status) || [],
                    hasResults: !!sampleAthlete.result,
                    resultsData: sampleAthlete.result ? {
                        amountOfCompetitions: sampleAthlete.result.AmountOfCompetitions,
                    } : null
                });
                
                // Проверяем все доступные свойства объекта
                console.log("Все свойства спортсмена:", Object.keys(sampleAthlete.dataValues));
                
                // Если есть заявки, выводим детали первой для анализа структуры
                if (sampleAthlete.applications?.length > 0) {
                    console.log("Структура заявки:", Object.keys(sampleAthlete.applications[0].dataValues));
                    console.log("Статус первой заявки:", sampleAthlete.applications[0].status);
                }
            }

            // Преобразуем данные в формат, ожидаемый клиентом
            const formattedAthletes = athletes.map(athlete => {
                // Пытаемся определить заявки из разных возможных имен связей
                const applications = athlete.applications || athlete.Applications || [];
                
                // Считаем только принятые заявки
                const approvedApplications = applications.filter(app => app.status === 'approved');
                
                // Определяем регион из разных возможных имен связей
                const regionName = athlete.region?.name || athlete.Region?.name;
                
                // Используем количество принятых заявок как количество соревнований
                const competitionsCount = approvedApplications.length || 0;
                
                // Отладочная информация
                console.log(`Спортсмен ID=${athlete.id}, регион: ${regionName || 'null'}, ` +
                            `всего заявок: ${applications.length}, ` +
                            `принятых заявок: ${approvedApplications.length}, ` +
                            `статусы заявок: ${applications.map(app => app.status).join(', ')}`);
                
                return {
                    id: athlete.id,
                    fullName: `${athlete.user_info?.lastName || ''} ${athlete.user_info?.firstName || ''} ${athlete.user_info?.middleName || ''}`.trim(),
                    region: regionName || 'Нет данных',
                    competitionsCount: competitionsCount
                };
            });

            console.log("Отправка ответа с данными спортсменов");
            return res.json(formattedAthletes);
        } catch (e) {
            console.error("Ошибка при получении аналитики спортсменов:", e);
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
            where: { ...this.buildAthleteFilters(filters), role: 'athlete' },
            include: [
                { model: UserInfo, as: 'user_info' },
                { model: Regions, attributes: ['name'], required: false },
                { 
                    model: Application, 
                    include: [{ 
                        model: Competition,
                        where: filters.disciplineId ? { disciplineId: filters.disciplineId } : {},
                        required: false 
                    }],
                    required: false 
                },
                {
                    model: require('../models/models').Results,
                    required: false
                }
            ]
        });

        return athletes.map(athlete => {
            // Пытаемся определить заявки из разных возможных имен связей
            const applications = athlete.applications || athlete.Applications || [];
            
            // Считаем только принятые заявки
            const approvedApplications = applications.filter(app => app.status === 'approved');
            
            // Определяем регион из разных возможных имен связей
            const regionName = athlete.region?.name || athlete.Region?.name;
            
            // Используем количество принятых заявок как количество соревнований
            const competitionsCount = approvedApplications.length || 0;
            
            return {
                fullName: `${athlete.user_info?.lastName || ''} ${athlete.user_info?.firstName || ''} ${athlete.user_info?.middleName || ''}`.trim(),
                region: regionName || 'Нет данных',
                competitionsCount: competitionsCount
            };
        });
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
        
        // Фильтрация по disciplineId происходит в секции include при запросе к модели User,
        // поскольку дисциплины связаны через таблицу Applications > Competition
        
        return whereClause;
    }
}

module.exports = new AnalyticsController(); 