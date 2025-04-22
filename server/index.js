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