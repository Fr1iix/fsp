const Router = require('express')
const router = new Router()
const userRouter = require('./userRouter')
const userinfoRouter = require('./userinfoRouter')

router.use('/user', userRouter)
router.use('/userinfo', userinfoRouter)

module.exports = router