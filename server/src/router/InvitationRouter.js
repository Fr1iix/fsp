const Router = require('express');
const router = new Router();
const InvitationController = require('../controller/InvitationController');
const authMiddleware = require('../middleware/AuthMiddleware');

// Получение всех приглашений для текущего пользователя
router.get('/my', authMiddleware, InvitationController.getMyInvitations);

// Получение всех приглашений для указанной команды
router.get('/team/:teamId', authMiddleware, InvitationController.getTeamInvitations);

// Создание нового приглашения
router.post('/', authMiddleware, InvitationController.create);

// Ответ на приглашение (принять/отклонить)
router.patch('/:id/respond', authMiddleware, InvitationController.respondToInvitation);

module.exports = router; 