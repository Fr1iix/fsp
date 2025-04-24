const Router = require('express')
const router = new Router()
const UserControllers = require('../controller/userController')
const authMiddleware = require('../middleware/AuthMiddleware')

router.post('/registration', UserControllers.registration)
router.post('/login', UserControllers.login)
router.get('/auth', authMiddleware, UserControllers.check)
router.post('/check-email', UserControllers.checkEmail)
router.put('/updateRegion/:id', authMiddleware, UserControllers.updateRegion)

module.exports = router