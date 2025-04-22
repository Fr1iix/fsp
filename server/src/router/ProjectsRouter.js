const Router = require('express')
const router = new Router()
const ProjectsController = require('../controller/ProjectsController')

router.delete('/deleteTeam/:id', ProjectsController.deleteAdress)
router.put("/updateTeam/:id", ProjectsController.updateOne)
router.get("/getTeam/:id", ProjectsController.getOne)
router.get("/getTeam", ProjectsController.getAll)

module.exports = router