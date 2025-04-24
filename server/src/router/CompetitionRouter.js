const Router = require('express')
const router = new Router()
const CompetitionController = require('../controller/CompetitionController')

router.delete('/deleteCompetition/:id', CompetitionController.deleteComp)
router.put("/updateCompetition/:id", CompetitionController.updateOne)
router.get("/Competition/:id", CompetitionController.getOneCompetition)
router.get("/getCompetition", CompetitionController.getAll)
router.get("/", CompetitionController.getAll)
router.post("/", CompetitionController.create)

// Новые маршруты
router.get("/:id/stats", CompetitionController.getCompetitionStats)
router.get("/:id/teams", CompetitionController.getCompetitionTeams)

module.exports = router