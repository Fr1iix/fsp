const Router = require('express')
const router = new Router()
const ApplicationController = require('../controller/ApplicationController')

router.delete('/deleteApplication/:id', ApplicationController.deleteAdress)
router.put("/updateApplication/:id", ApplicationController.updateOne)
router.get("/getApplication/:id", ApplicationController.getOne)
router.get("/getApplication", ApplicationController.getAll)

module.exports = router