const Router = require('express');
const router = new Router();
const applicationController = require('../controller/ApplicationController');
const authMiddleware = require('../middleware/AuthMiddleware');
const checkRoleMiddleware = require('../middleware/CheckRoleMiddleware');

// Маршруты для всех пользователей
router.post('/', authMiddleware, applicationController.create);
router.post('/participate', authMiddleware, applicationController.createParticipationRequest);
router.get('/my', authMiddleware, applicationController.getMyApplications);
router.get('/:id', authMiddleware, applicationController.getOne);

// Маршрут для получения детальной информации о заявке
router.get('/details/:id', authMiddleware, applicationController.getApplicationDetails);

// Маршруты для администраторов
router.get('/', checkRoleMiddleware('ADMIN'), applicationController.getAll);
router.put('/:id', checkRoleMiddleware('ADMIN'), applicationController.updateOne);
router.delete('/:id', checkRoleMiddleware('ADMIN'), applicationController.delete);

// Маршруты для региональных представителей
router.get('/regional', checkRoleMiddleware('regional'), applicationController.getRegionalApplications);
router.get('/user/:userId', checkRoleMiddleware(['ADMIN', 'regional']), applicationController.getByUser);
router.put('/status/:id', checkRoleMiddleware(['ADMIN', 'regional']), applicationController.updateStatus);

module.exports = router; 