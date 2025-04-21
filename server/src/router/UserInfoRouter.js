const Router = require('express')
const router = new Router()
const UserInfoController = require('../controller/UserInfoController')

router.delete('/deleteUserInfo/:id', UserInfoController.deleteUserInfo)
router.put("/updateUserInfo/:id", UserInfoController.updateOne)
router.get("/getoneUserInfo/:id", UserInfoController.getOneUserInfo)

module.exports = router