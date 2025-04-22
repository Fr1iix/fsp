const Router = require('express')
const router = new Router()
const AdressController = require('../controller/AdressController')

router.delete('/deleteResult/:id', AdressController.deleteAdress)
router.put("/updateResult/:id", AdressController.updateOne)
router.get("/getResult/:id", AdressController.getOne)
router.get("/getResult", AdressController.getAll)

module.exports = router