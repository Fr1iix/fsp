const ApiError = require("../errorr/ApiError")
const { Op } = require('sequelize');
const {Application} = require("../models/models")

class ApplicationController{
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

            const app = Adress.findAll({
                where: whereClause,
                limit, offset
            })

            return res.status(200).json(app)
        }catch (error){
            next(ApiError.badRequest(e.message))
        }        
    }

    async getOne(req, res){
        const id = req.params.id
        const app = await Adress.findByPk(id)
        return res.status(200).json(app)
    }

    async create(req, res, next) {
        try {
            let {UserId, TeamId, CompetitionId, status, UUID} = req.body
            const app = await Adress.create({UserId, TeamId, CompetitionId, status, UUID});
            return res.status(200).json(app)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteAdress(req,res){
        const id = req.params.id
        await Address.destroy({where: {id}})
    }

    async updateOne(req, res) {
        const {id} = req.params;
        const {
            UserId, TeamId, CompetitionId, status, UUID
        } = req.body;


        try {
            const app = await Adress.findOne({where: {id}});

            if (!app) {
                return res.status(404).json({error: 'User was not found'});
            }

            app.UserId = UserId;
            app.TeamId = TeamId;
            app.CompetitionId = CompetitionId;
            app.status = status;
            app.UUID = UUID;
            
            await app.save();

            return res.status(200).json(app);
        } catch (error) {
            console.error(error);
            return res.status(500).json({error: 'Internal server error'});
        }
    }
}

module.exports = new ApplicationController();