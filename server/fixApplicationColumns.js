require('dotenv').config();
const sequelize = require('./db');

async function fixApplicationColumns() {
  try {
    console.log('Подключение к базе данных...');
    await sequelize.authenticate();
    console.log('Успешное подключение к базе данных');

    // 1. Проверяем существование столбцов с маленькой буквы
    console.log('Проверка наличия столбцов в таблице application...');
    
    const checkColumnsResult = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'application' 
      AND (column_name = 'userId' OR column_name = 'teamId' OR column_name = 'competitionId');
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log('Найдены следующие столбцы:', checkColumnsResult.map(col => col.column_name));
    
    if (checkColumnsResult.length === 0) {
      console.log('Дублирующиеся столбцы не найдены, исправление не требуется');
      return;
    }

    // 2. Переносим данные из столбцов с маленькой буквы в столбцы с большой буквы
    console.log('Перенос данных из столбцов с маленькой буквы...');
    
    if (checkColumnsResult.some(col => col.column_name === 'userId')) {
      console.log('Перенос данных из userId в UserId...');
      await sequelize.query(`
        UPDATE application 
        SET "UserId" = "userId"
        WHERE "UserId" IS NULL AND "userId" IS NOT NULL;
      `);
    }
    
    if (checkColumnsResult.some(col => col.column_name === 'teamId')) {
      console.log('Перенос данных из teamId в TeamId...');
      await sequelize.query(`
        UPDATE application 
        SET "TeamId" = "teamId"
        WHERE "TeamId" IS NULL AND "teamId" IS NOT NULL;
      `);
    }
    
    if (checkColumnsResult.some(col => col.column_name === 'competitionId')) {
      console.log('Перенос данных из competitionId в CompetitionId...');
      await sequelize.query(`
        UPDATE application 
        SET "CompetitionId" = "competitionId"
        WHERE "CompetitionId" IS NULL AND "competitionId" IS NOT NULL;
      `);
    }

    console.log('Данные успешно перенесены');

    // 3. Опционально: удаляем старые столбцы
    const dropColumns = true; // Изменили на true чтобы удалить старые столбцы
    
    if (dropColumns) {
      console.log('Удаление старых столбцов...');
      
      const dropColumns = [];
      if (checkColumnsResult.some(col => col.column_name === 'userId')) {
        dropColumns.push('"userId"');
      }
      if (checkColumnsResult.some(col => col.column_name === 'teamId')) {
        dropColumns.push('"teamId"');
      }
      if (checkColumnsResult.some(col => col.column_name === 'competitionId')) {
        dropColumns.push('"competitionId"');
      }
      
      if (dropColumns.length > 0) {
        await sequelize.query(`
          ALTER TABLE application DROP COLUMN ${dropColumns.join(', DROP COLUMN ')};
        `);
        console.log('Старые столбцы удалены');
      }
    }

    console.log('Исправление столбцов в таблице application завершено');
  } catch (error) {
    console.error('Ошибка при исправлении столбцов:', error);
  } finally {
    await sequelize.close();
    console.log('Соединение с базой данных закрыто');
  }
}

fixApplicationColumns(); 