const fs = require('fs');
const path = require('path');
const { sequelize } = require('../models/models');
const ApiError = require('../errorr/ApiError');

class MigrationController {
    async runMigration(req, res, next) {
        try {
            const sqlPath = path.join(process.cwd(), '..', 'migration_fix_columns.sql');
            console.log('Чтение файла миграции:', sqlPath);
            
            if (!fs.existsSync(sqlPath)) {
                console.error('Файл миграции не найден:', sqlPath);
                return res.status(404).json({ message: 'Файл миграции не найден' });
            }
            
            const sqlScript = fs.readFileSync(sqlPath, 'utf8');
            console.log('SQL скрипт для выполнения:');
            console.log(sqlScript);
            
            // Разделяем скрипт на отдельные запросы
            const queries = sqlScript
                .split(';')
                .map(query => query.trim())
                .filter(query => query.length > 0);
            
            console.log(`Найдено ${queries.length} SQL запросов для выполнения`);
            
            const results = [];
            
            // Выполняем каждый запрос
            for (let i = 0; i < queries.length; i++) {
                const query = queries[i];
                console.log(`Выполнение запроса ${i + 1}:`, query);
                
                try {
                    const [result] = await sequelize.query(query);
                    console.log(`Результат запроса ${i + 1}:`, result);
                    results.push({ query, success: true, result });
                } catch (error) {
                    console.error(`Ошибка в запросе ${i + 1}:`, error.message);
                    results.push({ query, success: false, error: error.message });
                }
            }
            
            return res.status(200).json({ message: 'Миграция выполнена', results });
        } catch (error) {
            console.error('Ошибка при выполнении миграции:', error);
            return next(ApiError.internal(error.message));
        }
    }
}

module.exports = new MigrationController(); 