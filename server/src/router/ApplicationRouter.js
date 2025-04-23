const Router = require('express')
const router = new Router()
const ApplicationController = require('../controller/ApplicationController')
const authMiddleware = require('../middleware/authmiddleware')
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware')



// Получение всех заявок (для администраторов, ФСП и региональных представителей)
router.get('/', authMiddleware, checkRoleMiddleware(['admin', 'fsp', 'regional']), ApplicationController.getAll)

// Получение заявок конкретного пользователя
router.get('/user/:userId', authMiddleware, ApplicationController.getByUser)

// Получение конкретной заявки
router.get('/:id', authMiddleware, ApplicationController.getOne)

// Создание новой заявки
router.post('/', authMiddleware, ApplicationController.create)

// Создание новой заявки на участие в соревновании (для обычных пользователей)
router.post('/participation', authMiddleware, ApplicationController.createParticipationRequest)

// Получение заявок текущего пользователя
router.get('/my', authMiddleware, ApplicationController.getMyApplications)

// Получение заявок для соревнований в регионе пользователя (для региональных представителей)
router.get('/regional', authMiddleware, checkRoleMiddleware(['regional']), ApplicationController.getRegionalApplications)

// Обновление статуса заявки (для ФСП и региональных представителей)
router.patch('/:id/status', authMiddleware, checkRoleMiddleware(['fsp', 'regional']), ApplicationController.updateStatus)

// Полное обновление заявки
router.put('/:id', authMiddleware, ApplicationController.updateOne)

// Удаление заявки
router.delete('/:id', authMiddleware, ApplicationController.delete)

module.exports = router