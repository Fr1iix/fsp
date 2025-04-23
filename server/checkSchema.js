require('dotenv').config();
const sequelize = require('./db');

async function checkSchema() {
  try {
    console.log('Подключение к базе данных...');
    await sequelize.authenticate();
    console.log('Успешное подключение к базе данных');

    // Проверяем структуру таблицы teams
    console.log('Структура таблицы teams:');
    const teamsColumns = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'teams'
      ORDER BY ordinal_position;
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(teamsColumns);

    // Проверяем структуру таблицы application
    console.log('Структура таблицы application:');
    const applicationColumns = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'application'
      ORDER BY ordinal_position;
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(applicationColumns);

    // Выводим первые несколько записей из таблицы teams
    console.log('Данные из таблицы teams:');
    const teams = await sequelize.query(`
      SELECT * FROM teams LIMIT 3;
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(teams);

    // Выводим первые несколько записей из таблицы application
    console.log('Данные из таблицы application:');
    const applications = await sequelize.query(`
      SELECT * FROM application LIMIT 3;
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(applications);

  } catch (error) {
    console.error('Ошибка при проверке схемы базы данных:', error);
  } finally {
    await sequelize.close();
    console.log('Соединение с базой данных закрыто');
  }
}

checkSchema(); 