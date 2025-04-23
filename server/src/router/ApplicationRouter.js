const Router = require('express')
const router = new Router()
const ApplicationController = require('../controller/ApplicationController')
const authMiddleware = require('../middleware/authmiddleware')
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware')



// Получение всех заявок (только для администраторов и ФСП)
router.get('/', authMiddleware, checkRoleMiddleware(['admin', 'fsp']), ApplicationController.getAll)

// Получение заявок конкретного пользователя
router.get('/user/:userId', authMiddleware, ApplicationController.getByUser)

// Получение конкретной заявки
router.get('/:id', authMiddleware, ApplicationController.getOne)

// Создание новой заявки
router.post('/', authMiddleware, ApplicationController.create)

// Обновление статуса заявки (только для ФСП)
router.patch('/:id/status', authMiddleware, checkRoleMiddleware(['fsp']), ApplicationController.updateStatus)

// Полное обновление заявки
router.put('/:id', authMiddleware, ApplicationController.updateOne)

// Удаление заявки
router.delete('/:id', authMiddleware, ApplicationController.delete)

module.exports = router