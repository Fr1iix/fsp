const Router = require('express')
const router = new Router()
const CompetitionController = require('../controller/CompetitionController')

router.delete('/deleteCompetition/:id', CompetitionController.deleteComp)
router.put("/updateCompetition/:id", CompetitionController.updateOne)
router.get("/Competition/:id", CompetitionController.getOneCompetition)
router.get("/Competition", CompetitionController.getAll)
router.post("/Competition", CompetitionController.create)

module.exports = router