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

// Новые маршруты для запросов на присоединение к команде

// Создание запроса на присоединение к команде
router.post('/join-request', authMiddleware, InvitationController.createJoinRequest);

// Получение запросов на присоединение ко всем командам, где пользователь капитан
router.get('/my-teams-join-requests', authMiddleware, InvitationController.getUserTeamsJoinRequests);

// Получение запросов на присоединение к команде
router.get('/join-requests/:teamId', authMiddleware, InvitationController.getTeamJoinRequests);

// Проверка наличия запроса на присоединение к команде от текущего пользователя
router.get('/check-join-request/:teamId', authMiddleware, InvitationController.checkJoinRequest);

// Ответ на запрос на присоединение к команде (принять/отклонить)
router.patch('/join-request/:id/respond', authMiddleware, InvitationController.respondToJoinRequest);

module.exports = router; 