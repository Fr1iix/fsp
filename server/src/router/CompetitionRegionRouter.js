const Router = require('express')
const router = new Router()
const CompetitionRegionController = require('../controller/CompetitionRegion')

router.delete('/deleteTeam/:id', CompetitionRegionController.deleteAdress)
router.put("/updateTeam/:id", CompetitionRegionController.updateOne)
router.get("/getTeam/:id", CompetitionRegionController.getOne)
router.get("/getTeam", CompetitionRegionController.getAll)

module.exports = router