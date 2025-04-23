const ApiError = require("../errorr/ApiError")
const { Op } = require('sequelize');
const {Projects} = require("../models/models")

class ProjectsController{
    getAll = (req, res, next) => {
        try{
            let limit = parseInt(req.query.limit, 10) || 10;
            let offset = parseInt(req.query.offset, 10) || 0;
            const search = req.query.search || '';

            const whereClause = search
                ? {
                name: {
                    [Op.iLike]: `%${search}%`, // для Postgres; используйте [Op.substring] для других СУБД
                },
            }
            : {};

            const rpoj = Projects.findAll({
                where: whereClause,
                limit, offset
            })

            return res.status(200).json(rpoj)
        }catch (error){
            next(ApiError.badRequest(e.message))
        }        
    }

    async getOne(req, res){
        const id = req.params.id
        const rpoj = await Projects.findByPk(id)
        return res.status(200).json(rpoj)
    }

    async create(req, res, next) {
        try {
            let {UserId, name, files} = req.body
            const rpoj = await Projects.create({UserId, name, files});
            return res.status(200).json(rpoj)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteAdress(req,res){
        const id = req.params.id
        await Projects.destroy({where: {id}})
    }

    async updateOne(req, res) {
        const {id} = req.params;
        const {
            UserId, name, files
        } = req.body;


        try {
            const rpoj = await Projects.findOne({where: {id}});

            if (!rpoj) {
                return res.status(404).json({error: 'User was not found'});
            }

            rpoj.UserId = UserId;
            rpoj.name = name;
            rpoj.files = files;
            
            await rpoj.save();

            return res.status(200).json(rpoj);
        } catch (error) {
            console.error(error);
            return res.status(500).json({error: 'Internal server error'});
        }
    }
}

module.exports = new ProjectsController();