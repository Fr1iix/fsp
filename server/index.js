require('dotenv').config()
const express = require('express')
const router = require('./src/router/index')
const sequelize = require('./db')
const models = require('./src/models/models')
const cors = require('cors')
const fileUpload = require('express-fileupload')
const path = require('path')
const errorHandler = require('./src/middleware/ErrorHandlingMiddleware')

const PORT = process.env.PORT
const app = express()

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // URL вашего фронтенда
    credentials: true
}))
app.use(express.json())
app.use(express.static(path.resolve(__dirname, 'src', 'static')))
app.use(fileUpload({}))
app.use('/api', router)

// Обработчик ошибок - последний middleware
app.use(errorHandler)

const start = async () => {
    try {
        await sequelize.authenticate()
        console.log('Успешное подключение к базе данных')

        // Добавляем отсутствующие столбцы в таблицу teams
        try {
            console.log('Выполняем миграцию для таблицы teams...')

            // Проверяем существование столбца lookingForMembers
            const [lookingForMembersResults] = await sequelize.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'teams' 
                AND column_name = 'lookingForMembers'
            `);

            if (lookingForMembersResults.length === 0) {
                console.log('Добавляем столбец lookingForMembers...');
                await sequelize.query(`ALTER TABLE "teams" ADD COLUMN "lookingForMembers" BOOLEAN DEFAULT false`);
            }

            // Проверяем существование столбца availableSlots
            const [availableSlotsResults] = await sequelize.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'teams' 
                AND column_name = 'availableSlots'
            `);

            if (availableSlotsResults.length === 0) {
                console.log('Добавляем столбец availableSlots...');
                await sequelize.query(`ALTER TABLE "teams" ADD COLUMN "availableSlots" INTEGER DEFAULT 0`);
            }

            // Проверяем существование столбца requiredRoles
            const [requiredRolesResults] = await sequelize.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'teams' 
                AND column_name = 'requiredRoles'
            `);

            if (requiredRolesResults.length === 0) {
                console.log('Добавляем столбец requiredRoles...');
                await sequelize.query(`ALTER TABLE "teams" ADD COLUMN "requiredRoles" TEXT DEFAULT ''`);
            }

            console.log('Миграция таблицы teams завершена успешно');
        } catch (migrationError) {
            console.error('Ошибка при выполнении миграции teams:', migrationError);
        }

        // Добавляем отсутствующие столбцы в таблицу invitations
        try {
            console.log('Выполняем миграцию для таблицы invitations...')

            // Проверяем существование столбца type
            const [typeResults] = await sequelize.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'invitations' 
                AND column_name = 'type'
            `);

            if (typeResults.length === 0) {
                console.log('Добавляем столбец type в таблицу invitations...');
                await sequelize.query(`ALTER TABLE "invitations" ADD COLUMN "type" VARCHAR(255) DEFAULT 'invitation'`);
                console.log('Столбец type успешно добавлен');
            }

            console.log('Миграция таблицы invitations завершена успешно');
        } catch (migrationError) {
            console.error('Ошибка при выполнении миграции invitations:', migrationError);
        }

        await sequelize.sync()
        console.log('Модели синхронизированы с базой данных')

        app.listen(PORT, () => {
            console.log(`Сервер запущен на порту ${PORT}`)
        })
    } catch (e) {
        console.error('Ошибка при запуске сервера:', e)
    }
}

start()