const Router = require('express')
const router = new Router()
const ApplicationController = require('../controller/ApplicationController')
const authMiddleware = require('../middleware/authmiddleware')


// Получение заявок конкретного пользователя
router.get('/user/:userId', authMiddleware, ApplicationController.getByUser)

// Получение конкретной заявки
router.get('/:id', authMiddleware, ApplicationController.getOne)

// Создание новой заявки
router.post('/', authMiddleware, ApplicationController.create)

// Полное обновление заявки
router.put('/:id', authMiddleware, ApplicationController.updateOne)

// Удаление заявки
router.delete('/:id', authMiddleware, ApplicationController.delete)

module.exports = router