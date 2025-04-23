require('dotenv').config();
const { User, UserInfo } = require('./src/models/models');
const sequelize = require('./db');

// Функция для заполнения информации о пользователях
async function fillUserInfo() {
    try {
        // Подключаемся к базе данных
        await sequelize.authenticate();
        console.log('Успешное подключение к базе данных');

        // Получаем всех пользователей
        const users = await User.findAll();
        console.log(`Найдено ${users.length} пользователей`);

        // Для каждого пользователя
        for (const user of users) {
            // Проверяем, есть ли у него запись в UserInfo
            const existingInfo = await UserInfo.findOne({
                where: { UserId: user.id }
            });

            // Если записи нет, создаем её
            if (!existingInfo) {
                await UserInfo.create({
                    UserId: user.id,
                    firstName: `Имя${user.id}`,
                    lastName: `Фамилия${user.id}`,
                    middleName: '',
                    gender: 'не указан',
                    birthday: new Date(),
                    phone: `+7900${user.id.toString().padStart(7, '0')}`,
                });
                console.log(`Создана запись UserInfo для пользователя ID=${user.id}`);
            } else {
                console.log(`У пользователя ID=${user.id} уже есть запись в UserInfo`);
            }
        }

        console.log('Заполнение UserInfo успешно завершено');
    } catch (error) {
        console.error('Произошла ошибка:', error);
    } finally {
        // Закрываем соединение с базой данных
        await sequelize.close();
    }
}

// Запускаем функцию
fillUserInfo(); 