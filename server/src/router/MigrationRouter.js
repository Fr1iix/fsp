const Router = require('express');
const router = new Router();
const MigrationController = require('../controller/MigrationController');
const authMiddleware = require('../middleware/AuthMiddleware');

// Маршрут для выполнения миграции (только для админов)
router.post('/run', authMiddleware, MigrationController.runMigration);

module.exports = router; 