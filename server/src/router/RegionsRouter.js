const Router = require('express')
const router = new Router()
const RegionsController = require('../controller/RegionsController')

router.delete('/:id', RegionsController.deleteRegion)
router.put("/:id", RegionsController.updateOne)
router.get("/:id", RegionsController.getOne)
router.get("/", RegionsController.getAll)

module.exports = router