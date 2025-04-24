const Router = require('express');
const router = new Router();
const CompetitionResultController = require('../controller/CompetitionResultController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Получение всех результатов соревнования
router.get('/competition/:competitionId',
    authMiddleware,
    CompetitionResultController.getCompetitionResults
);

// Получение результатов конкретного спортсмена
router.get('/user/:userId',
    authMiddleware,
    CompetitionResultController.getUserResults
);

// Добавление результата соревнования (только для организаторов)
router.post('/add',
    authMiddleware,
    roleMiddleware(['organizer']),
    CompetitionResultController.addResult
);

// Обновление результата соревнования (только для организаторов)
router.put('/update/:id',
    authMiddleware,
    roleMiddleware(['organizer']),
    CompetitionResultController.updateResult
);

// Подтверждение результатов соревнования (только для организаторов)
router.post('/confirm/:competitionId',
    authMiddleware,
    roleMiddleware(['organizer']),
    CompetitionResultController.confirmResults
);

// Удаление результата соревнования (только для организаторов)
router.delete('/delete/:id',
    authMiddleware,
    roleMiddleware(['organizer']),
    CompetitionResultController.deleteResult
);

module.exports = router; 