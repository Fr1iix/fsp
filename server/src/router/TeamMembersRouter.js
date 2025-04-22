const Router = require('express')
const router = new Router()
const TeamMembersController = require('../controller/TeamMembersController')

router.delete('/deleteTeamMembers/:id', TeamMembersController.deleteResults)
router.put("/updateTeamMembers/:id", TeamMembersController.updateOne)
router.get("/getTeamMembers/:id", TeamMembersController.getOne)
router.get("/getTeamMembers", TeamMembersController.getAll)

module.exports = router