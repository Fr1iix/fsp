const Router = require('express')
const router = new Router()
const DisciplineController = require('../controller/DisciplineController')

router.delete('/:id', DisciplineController.deleteAdress)
router.put("/:id", DisciplineController.updateOne)
router.get("/:id", DisciplineController.getOne)
router.get("/", DisciplineController.getAll)

module.exports = router