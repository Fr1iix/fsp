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

            console.log('Запрос соревнований с фильтрами:', whereClause);

            const competitions = await Competition.findAll({
                where: whereClause,
                include: [
                    {
                        model: Discipline,
                        attributes: ['name']
                    }
                ]
            });

            console.log(`Найдено соревнований: ${competitions.length}`);
            
            // Проверяем данные первого соревнования для отладки
            if (competitions.length > 0) {
                const firstComp = competitions[0];
                console.log('Первое соревнование:', {
                    id: firstComp.id,
                    name: firstComp.name,
                    disciplineId: firstComp.disciplineId,
                    disciplineName: firstComp.Discipline?.name,
                    regionId: firstComp.regionId,
                    status: firstComp.status
                });
                console.log('Свойства соревнования:', Object.keys(firstComp.dataValues));
                
                // Проверяем, правильно ли загружается дисциплина
                if (firstComp.Discipline) {
                    console.log('Свойства дисциплины:', Object.keys(firstComp.Discipline.dataValues));
                } else {
                    console.log('Дисциплина не загружена для соревнования');
                }
            }

            // Получаем регионы отдельно, чтобы связать с соревнованиями
            const regions = await Regions.findAll({
                attributes: ['id', 'name']
            });

            console.log(`Найдено регионов: ${regions.length}`);
            
            // Создаем карту регионов для быстрого доступа
            const regionsMap = {};
            regions.forEach(region => {
                regionsMap[region.id] = region.name;
            });

            // Проверим несколько регионов для отладки
            console.log('Карта регионов (первые 3):', 
                Object.entries(regionsMap).slice(0, 3).map(([id, name]) => `${id}: ${name}`));

            // Получаем все дисциплины
            const disciplines = await Discipline.findAll({
                attributes: ['id', 'name']
            });

            console.log(`Найдено дисциплин: ${disciplines.length}`);
            
            // Создаем карту дисциплин для быстрого доступа
            const disciplinesMap = {};
            disciplines.forEach(discipline => {
                disciplinesMap[discipline.id] = discipline.name;
            });

            // Проверим несколько дисциплин для отладки
            console.log('Карта дисциплин (первые 3):', 
                Object.entries(disciplinesMap).slice(0, 3).map(([id, name]) => `${id}: ${name}`));

            // Форматируем данные для отображения на фронтенде
            const formattedCompetitions = competitions.map(comp => {
                // Приоритетно используем данные из включенной модели Discipline
                let disciplineName = comp.Discipline?.name;
                
                // Если не удалось получить из связи, используем карту дисциплин
                if (!disciplineName && comp.disciplineId && disciplinesMap[comp.disciplineId]) {
                    disciplineName = disciplinesMap[comp.disciplineId];
                }
                
                // Если дисциплина все еще не найдена, используем поле 'type' как запасной вариант
                if (!disciplineName && comp.type) {
                    // Карта соответствия типов и названий дисциплин
                    const typeToName = {
                        'product': 'Продуктовое программирование',
                        'security': 'Программирование систем информационной безопасности',
                        'algorithm': 'Алгоритмическое программирование',
                        'robotics': 'Программирование робототехники',
                        'drones': 'Программирование беспилотных авиационных систем'
                    };
                    
                    disciplineName = typeToName[comp.type] || comp.type;
                }
                
                return {
                    id: comp.id,
                    name: comp.name,
                    discipline: disciplineName || 'Нет данных',
                    region: comp.regionId && regionsMap[comp.regionId] ? regionsMap[comp.regionId] : 'Нет данных',
                    startdate: comp.startdate,
                    status: comp.status || 'Нет данных'
                };
            });

            console.log(`Отформатировано соревнований: ${formattedCompetitions.length}`);
            
            // Если есть соревнования, проверим первое соревнование после форматирования
            if (formattedCompetitions.length > 0) {
                console.log('Первое отформатированное соревнование:', formattedCompetitions[0]);
            }
            
            return res.json(formattedCompetitions);
        } catch (e) {
            console.error("Ошибка при получении аналитики соревнований:", e);
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
            
            console.log(`Запрос на экспорт данных типа: ${type}, с фильтрами:`, filters);
            
            let data;
            if (type === 'competitions') {
                // Создаем whereClause прямо здесь, вместо вызова buildCompetitionFilters
                const whereClause = {};
                
                if (filters.disciplineId) whereClause.disciplineId = filters.disciplineId;
                if (filters.regionId) whereClause.regionId = filters.regionId;
                if (filters.status) whereClause.status = filters.status;
                
                if (filters.startDate && filters.endDate) {
                    whereClause.startdate = {
                        [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)]
                    };
                }

                // Встраиваем логику getCompetitionsData прямо здесь
                const competitions = await Competition.findAll({
                    where: whereClause,
                    include: [
                        { model: Discipline, attributes: ['name'] }
                    ]
                });

                // Получаем регионы отдельно
                const regions = await Regions.findAll({
                    attributes: ['id', 'name']
                });

                // Создаем карту регионов для быстрого доступа
                const regionsMap = {};
                regions.forEach(region => {
                    regionsMap[region.id] = region.name;
                });

                // Получаем все дисциплины
                const disciplines = await Discipline.findAll({
                    attributes: ['id', 'name']
                });
                
                // Создаем карту дисциплин для быстрого доступа
                const disciplinesMap = {};
                disciplines.forEach(discipline => {
                    disciplinesMap[discipline.id] = discipline.name;
                });

                data = competitions.map(comp => {
                    // Приоритетно используем данные из включенной модели Discipline
                    let disciplineName = comp.Discipline?.name;
                    
                    // Если не удалось получить из связи, используем карту дисциплин
                    if (!disciplineName && comp.disciplineId && disciplinesMap[comp.disciplineId]) {
                        disciplineName = disciplinesMap[comp.disciplineId];
                    }
                    
                    // Если дисциплина все еще не найдена, используем поле 'type' как запасной вариант
                    if (!disciplineName && comp.type) {
                        // Карта соответствия типов и названий дисциплин
                        const typeToName = {
                            'product': 'Продуктовое программирование',
                            'security': 'Программирование систем информационной безопасности',
                            'algorithm': 'Алгоритмическое программирование',
                            'robotics': 'Программирование робототехники',
                            'drones': 'Программирование беспилотных авиационных систем'
                        };
                        
                        disciplineName = typeToName[comp.type] || comp.type;
                    }
                    
                    // Проверяем валидность полей
                    const name = comp.name && typeof comp.name === 'string' && comp.name.trim() !== '' ? 
                                comp.name : 'Без названия';
                    
                    // Обработка даты
                    let startDate;
                    try {
                        startDate = comp.startdate instanceof Date ? 
                                    comp.startdate : 
                                    comp.startdate ? new Date(comp.startdate) : null;
                    } catch (e) {
                        console.error('Ошибка при конвертации даты:', e);
                        startDate = null;
                    }
                    
                    return {
                        name: name,
                        discipline: disciplineName || 'Нет данных',
                        region: comp.regionId && regionsMap[comp.regionId] ? regionsMap[comp.regionId] : 'Нет данных',
                        startDate: startDate,
                        status: comp.status || 'Нет данных'
                    };
                });

                console.log(`Получено ${data.length} записей для экспорта соревнований`);
                if (data.length > 0) {
                    console.log('Пример данных:', data[0]);
                }
            } else if (type === 'athletes') {
                // Создаем whereClause прямо здесь, вместо вызова buildAthleteFilters
                const whereClause = {};
                
                if (filters.regionId) whereClause.idRegions = filters.regionId;
                
                // Встраиваем логику getAthletesData прямо здесь
                const athletes = await User.findAll({
                    where: { ...whereClause, role: 'athlete' },
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

                data = athletes.map(athlete => {
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

                console.log(`Получено ${data.length} записей для экспорта спортсменов`);
                if (data.length > 0) {
                    console.log('Пример данных:', data[0]);
                }
            } else {
                console.log(`Неверный тип данных для экспорта: ${type}`);
                return res.status(400).json({ message: "Неверный тип данных для экспорта" });
            }

            const workbook = new excel.Workbook();
            const worksheet = workbook.addWorksheet(type === 'competitions' ? 'Соревнования' : 'Спортсмены');

            // Настройка заголовков и данных в зависимости от типа
            if (type === 'competitions') {
                worksheet.columns = [
                    { header: 'Название', key: 'name', width: 30 },
                    { header: 'Дисциплина', key: 'discipline', width: 30 },
                    { header: 'Регион', key: 'region', width: 20 },
                    { header: 'Дата начала', key: 'startDate', width: 15 },
                    { header: 'Статус', key: 'status', width: 20 }
                ];
                
                // Форматирование дат в Excel
                data = data.map(item => {
                    // Преобразуем дату в JavaScript Date объект
                    let startDate = item.startDate;
                    if (typeof startDate === 'string') {
                        startDate = new Date(startDate);
                    }
                    
                    // Проверяем, что startDate - валидная дата
                    if (!(startDate instanceof Date) || isNaN(startDate)) {
                        startDate = null;
                    }
                    
                    return {
                        ...item,
                        startDate: startDate
                    };
                });
                
                // Устанавливаем форматирование для колонки дат
                worksheet.getColumn('startDate').numFmt = 'dd.mm.yyyy';
                
                // Проверка соответствия ключей в данных и колонках
                console.log('Ключи в колонках:', worksheet.columns.map(col => col.key));
                if (data.length > 0) {
                    console.log('Ключи в данных:', Object.keys(data[0]));
                }
            } else {
                worksheet.columns = [
                    { header: 'ФИО', key: 'fullName', width: 30 },
                    { header: 'Регион', key: 'region', width: 20 },
                    { header: 'Количество соревнований', key: 'competitionsCount', width: 15 }
                ];
                
                // Проверка соответствия ключей в данных и колонках
                console.log('Ключи в колонках:', worksheet.columns.map(col => col.key));
                if (data.length > 0) {
                    console.log('Ключи в данных:', Object.keys(data[0]));
                }
            }

            try {
                // Добавляем строки данных в таблицу
                worksheet.addRows(data);
                console.log('Строки успешно добавлены в таблицу');
                
                // Автоматическая настройка ширины столбцов
                worksheet.columns.forEach(column => {
                    column.width = column.width || 15;
                });
                
                // Применяем стили к заголовкам
                worksheet.getRow(1).font = { bold: true };
                worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
                
                // Установка границ ячеек
                const borderStyle = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                
                // Применение границ и дополнительное форматирование
                for (let i = 1; i <= worksheet.rowCount; i++) {
                    const row = worksheet.getRow(i);
                    row.eachCell({ includeEmpty: true }, (cell) => {
                        cell.border = borderStyle;
                        cell.alignment = { vertical: 'middle' };
                        
                        // Дополнительное форматирование для дат
                        if (i > 1 && type === 'competitions' && cell.col === worksheet.getColumn('startDate')?.number) {
                            if (cell.value) {
                                cell.numFmt = 'dd.mm.yyyy';
                            }
                        }
                    });
                    row.commit();
                }
                
                // Автофильтр для заголовков
                worksheet.autoFilter = {
                    from: { row: 1, column: 1 },
                    to: { row: 1, column: worksheet.columnCount }
                };
                
                // Добавляем второй лист с агрегированными данными
                if (type === 'competitions' && data.length > 0) {
                    // Создаем лист для агрегированных данных
                    const summarySheet = workbook.addWorksheet('Агрегированные данные');
                    
                    // Подготавливаем данные по дисциплинам
                    const disciplineGroups = {};
                    data.forEach(item => {
                        if (!disciplineGroups[item.discipline]) {
                            disciplineGroups[item.discipline] = 0;
                        }
                        disciplineGroups[item.discipline]++;
                    });
                    
                    // Записываем данные по дисциплинам
                    summarySheet.getCell('A1').value = 'Распределение соревнований по дисциплинам';
                    summarySheet.getCell('A1').font = { bold: true, size: 14 };
                    summarySheet.mergeCells('A1:B1');
                    
                    summarySheet.getCell('A2').value = 'Дисциплина';
                    summarySheet.getCell('B2').value = 'Количество';
                    
                    let rowIndex = 3;
                    Object.entries(disciplineGroups).forEach(([discipline, count]) => {
                        summarySheet.getCell(`A${rowIndex}`).value = discipline;
                        summarySheet.getCell(`B${rowIndex}`).value = count;
                        rowIndex++;
                    });
                    
                    // Подготавливаем данные по статусам
                    const statusGroups = {};
                    data.forEach(item => {
                        if (!statusGroups[item.status]) {
                            statusGroups[item.status] = 0;
                        }
                        statusGroups[item.status]++;
                    });
                    
                    // Записываем данные по статусам
                    rowIndex += 2;
                    summarySheet.getCell(`A${rowIndex}`).value = 'Распределение соревнований по статусам';
                    summarySheet.getCell(`A${rowIndex}`).font = { bold: true, size: 14 };
                    summarySheet.mergeCells(`A${rowIndex}:B${rowIndex}`);
                    
                    rowIndex++;
                    summarySheet.getCell(`A${rowIndex}`).value = 'Статус';
                    summarySheet.getCell(`B${rowIndex}`).value = 'Количество';
                    
                    rowIndex++;
                    Object.entries(statusGroups).forEach(([status, count]) => {
                        summarySheet.getCell(`A${rowIndex}`).value = status;
                        summarySheet.getCell(`B${rowIndex}`).value = count;
                        rowIndex++;
                    });
                    
                    // Форматируем лист с агрегированными данными
                    summarySheet.getColumn('A').width = 40;
                    summarySheet.getColumn('B').width = 15;
                    
                    // Стили для заголовков
                    ['A2', 'B2', `A${rowIndex-Object.keys(statusGroups).length-1}`, `B${rowIndex-Object.keys(statusGroups).length-1}`].forEach(cell => {
                        summarySheet.getCell(cell).font = { bold: true };
                        summarySheet.getCell(cell).alignment = { vertical: 'middle', horizontal: 'center' };
                    });
                    
                    // Добавляем границы для таблиц
                    const borderStyle = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    
                    for (let i = 2; i < rowIndex; i++) {
                        summarySheet.getCell(`A${i}`).border = borderStyle;
                        summarySheet.getCell(`B${i}`).border = borderStyle;
                    }
                    
                } else if (type === 'athletes' && data.length > 0) {
                    // Создаем лист для агрегированных данных
                    const summarySheet = workbook.addWorksheet('Агрегированные данные');
                    
                    // Подготавливаем данные по регионам
                    const regionGroups = {};
                    data.forEach(item => {
                        if (!regionGroups[item.region]) {
                            regionGroups[item.region] = 0;
                        }
                        regionGroups[item.region]++;
                    });
                    
                    // Записываем данные по регионам
                    summarySheet.getCell('A1').value = 'Распределение спортсменов по регионам';
                    summarySheet.getCell('A1').font = { bold: true, size: 14 };
                    summarySheet.mergeCells('A1:B1');
                    
                    summarySheet.getCell('A2').value = 'Регион';
                    summarySheet.getCell('B2').value = 'Количество спортсменов';
                    
                    let rowIndex = 3;
                    Object.entries(regionGroups).forEach(([region, count]) => {
                        summarySheet.getCell(`A${rowIndex}`).value = region;
                        summarySheet.getCell(`B${rowIndex}`).value = count;
                        rowIndex++;
                    });
                    
                    // Форматируем лист с агрегированными данными
                    summarySheet.getColumn('A').width = 40;
                    summarySheet.getColumn('B').width = 15;
                    
                    // Стили для заголовков
                    ['A2', 'B2'].forEach(cell => {
                        summarySheet.getCell(cell).font = { bold: true };
                        summarySheet.getCell(cell).alignment = { vertical: 'middle', horizontal: 'center' };
                    });
                    
                    // Добавляем границы для таблицы
                    const borderStyle = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                    
                    for (let i = 2; i < rowIndex; i++) {
                        summarySheet.getCell(`A${i}`).border = borderStyle;
                        summarySheet.getCell(`B${i}`).border = borderStyle;
                    }
                }
            } catch (error) {
                console.error('Ошибка при добавлении строк в таблицу:', error);
                // Выводим дополнительную информацию для отладки
                console.log('Количество строк данных:', data.length);
                if (data.length > 0) {
                    console.log('Первая строка данных:', JSON.stringify(data[0]));
                }
                throw error; // Выбрасываем ошибку дальше
            }

            // Устанавливаем заголовки для правильного отображения файла
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${type}_analytics.xlsx`);

            try {
                await workbook.xlsx.write(res);
                console.log('Excel-файл успешно записан в ответ');
                res.end();
            } catch (error) {
                console.error('Ошибка при записи Excel-файла в ответ:', error);
                throw error; // Выбрасываем ошибку дальше
            }
        } catch (e) {
            console.error("Ошибка при экспорте данных:", e);
            return res.status(500).json({ message: "Ошибка при экспорте данных" });
        }
    }

    async getCompetitionsData(filters) {
        const competitions = await Competition.findAll({
            where: this.buildCompetitionFilters(filters),
            include: [
                { model: Discipline, attributes: ['name'] }
            ]
        });

        // Получаем регионы отдельно
        const regions = await Regions.findAll({
            attributes: ['id', 'name']
        });

        // Создаем карту регионов для быстрого доступа
        const regionsMap = {};
        regions.forEach(region => {
            regionsMap[region.id] = region.name;
        });

        // Получаем все дисциплины
        const disciplines = await Discipline.findAll({
            attributes: ['id', 'name']
        });
        
        // Создаем карту дисциплин для быстрого доступа
        const disciplinesMap = {};
        disciplines.forEach(discipline => {
            disciplinesMap[discipline.id] = discipline.name;
        });

        return competitions.map(comp => {
            // Приоритетно используем данные из включенной модели Discipline
            let disciplineName = comp.Discipline?.name;
            
            // Если не удалось получить из связи, используем карту дисциплин
            if (!disciplineName && comp.disciplineId && disciplinesMap[comp.disciplineId]) {
                disciplineName = disciplinesMap[comp.disciplineId];
            }
            
            // Если дисциплина все еще не найдена, используем поле 'type' как запасной вариант
            if (!disciplineName && comp.type) {
                // Карта соответствия типов и названий дисциплин
                const typeToName = {
                    'product': 'Продуктовое программирование',
                    'security': 'Программирование систем информационной безопасности',
                    'algorithm': 'Алгоритмическое программирование',
                    'robotics': 'Программирование робототехники',
                    'drones': 'Программирование беспилотных авиационных систем'
                };
                
                disciplineName = typeToName[comp.type] || comp.type;
            }
            
            return {
                name: comp.name,
                discipline: disciplineName || 'Нет данных',
                region: comp.regionId && regionsMap[comp.regionId] ? regionsMap[comp.regionId] : 'Нет данных',
                startDate: comp.startdate,
                status: comp.status || 'Нет данных'
            };
        });
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