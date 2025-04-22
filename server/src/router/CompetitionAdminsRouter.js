const Router = require('express')
const router = new Router()
const CompetitionAdmins = require('../controller/CompetitionAdminsController')

router.delete('/deleteCompetitionAdmins/:id', CompetitionAdmins.deleteResults)
router.put("/updateCompetitionAdmins/:id", CompetitionAdmins.updateOne)
router.get("/getCompetitionAdmins/:id", CompetitionAdmins.getOne)
router.get("/getCompetitionAdmins", CompetitionAdmins.getAll)

module.exports = router