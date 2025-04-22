const Router = require('express')
const router = new Router()
const TeamController = require('../controller/TeamController')

router.delete('/deleteTeam/:id', TeamController.deleteTeam)
router.put("/updateTeam/:id", TeamController.updateOne)
router.get("/getTeam/:id", TeamController.getTeam)
router.get("/getTeam", TeamController.getAll)

module.exports = router