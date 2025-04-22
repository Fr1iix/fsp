const Router = require('express')
const router = new Router()
const DisciplineController = require('../controller/DisciplineController')

router.delete('/deleteTeam/:id', DisciplineController.deleteAdress)
router.put("/updateTeam/:id", DisciplineController.updateOne)
router.get("/getTeam/:id", DisciplineController.getOne)
router.get("/getTeam", DisciplineController.getAll)

module.exports = router