const Router = require('express')
const router = new Router()
const UserControllers = require('../controller/userController')
const authMiddleware = require('../middleware/authMiddleware')

// Регистрация и вход
router.post('/register', UserControllers.registration) // Соответствует клиентской логике
router.post('/login', UserControllers.login)

// Проверка аутентификации и токена
router.get('/refresh', authMiddleware, UserControllers.check)
router.get('/check', authMiddleware, UserControllers.check)

module.exports = router 