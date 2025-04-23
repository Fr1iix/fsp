const Router = require('express');
const router = new Router();
const analyticsController = require('../controller/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Маршруты для аналитики соревнований
router.get('/competitions', 
    authMiddleware, 
    roleMiddleware(['FSP', 'regional']), 
    analyticsController.getCompetitionsAnalytics
);

// Маршруты для аналитики спортсменов
router.get('/athletes', 
    authMiddleware, 
    roleMiddleware(['FSP', 'regional']), 
    analyticsController.getAthletesAnalytics
);

// Маршрут для экспорта данных
router.get('/export', 
    authMiddleware, 
    roleMiddleware(['FSP', 'regional']), 
    analyticsController.exportAnalytics
);

module.exports = router; 