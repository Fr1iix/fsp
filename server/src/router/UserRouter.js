const Router = require('express')
const router = new Router()
const UserControllers = require('../controller/userController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/registration', UserControllers.registration)
router.post('/login', UserControllers.login)
router.get('/auth', authMiddleware, UserControllers.check)
router.post('/check-email', UserControllers.checkEmail)

module.exports = router