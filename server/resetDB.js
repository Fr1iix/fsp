require('dotenv').config();
const sequelize = require('./db');
const { Sequelize } = require('sequelize');

async function resetDatabase() {
	try {
		console.log('Подключение к базе данных...');
		await sequelize.authenticate();
		console.log('Успешное подключение к базе данных');

		console.log('Удаление и пересоздание базы данных...');
		// Используем чистый SQL для удаления всех таблиц с CASCADE
		await sequelize.query('DROP SCHEMA public CASCADE;');
		await sequelize.query('CREATE SCHEMA public;');

		// Установка привилегий 
		await sequelize.query('GRANT ALL ON SCHEMA public TO postgres;');
		await sequelize.query('GRANT ALL ON SCHEMA public TO public;');

		console.log('База данных очищена');

		// Загружаем модели после очистки базы
		const models = require('./src/models/models');

		// Синхронизация моделей с базой данных
		console.log('Создание новых таблиц...');
		await sequelize.sync({ force: true });
		console.log('Новые таблицы созданы');

		console.log('База данных успешно сброшена');
		process.exit(0);
	} catch (error) {
		console.error('Ошибка при сбросе базы данных:', error);
		process.exit(1);
	}
}

resetDatabase(); 