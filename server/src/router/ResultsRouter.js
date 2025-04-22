const Router = require('express')
const router = new Router()
const ResultsController = require('../controller/ResultsController')

router.delete('/deleteResult/:id', ResultsController.deleteResults)
router.put("/updateResult/:id", ResultsController.updateOne)
router.get("/getResult/:id", ResultsController.getOneResult)
router.get("/getResult", ResultsController.getAll)

module.exports = router