const Router = require('express')
const router = new Router()
const userRouter = require('./userRouter')
const userInfoRouter = require('./userInfoRouter')
const ResultRouter = require('./ResultsRouter')
const TeamRouter = require('./TeamRouter')
const CompetitionRouter = require('./CompetitionRouter')
const CompetitionAdminsRouter = require('./CompetitionAdminsRouter')
const TeammembersRouter = require('./TeammembersRouter')
const AdressRouter = require('./AdressRouter')
const authRouter = require('./authRouter')

// Маршруты аутентификации
router.use('/auth', authRouter)

// Маршруты пользователей и информации о них
router.use('/user', userRouter)
router.use('/userInfo', userInfoRouter)

// Другие маршруты
router.use('/result', ResultRouter)
router.use('/team', TeamRouter)
router.use('/competition', CompetitionRouter)
router.use('/competitionAdmin', CompetitionAdminsRouter)
router.use('/teamMember', TeammembersRouter)
router.use('/address', AdressRouter)

module.exports = router
