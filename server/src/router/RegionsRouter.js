const Router = require('express')
const router = new Router()
const RegionsController = require('../controller/RegionsController')

router.delete('/deleteTeam/:id', RegionsController.deleteAdress)
router.put("/updateTeam/:id", RegionsController.updateOne)
router.get("/getTeam/:id", RegionsController.getOne)
router.get("/getTeam", RegionsController.getAll)

module.exports = router