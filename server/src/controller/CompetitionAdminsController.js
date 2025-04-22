const ApiError = require("../errorr/ApiError")
const { Op } = require('sequelize');
const {CompetitionAdmins} = require("../models/models")

class CompetitionAdminsController{
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

            const compAd = CompetitionAdmins.findAll({
                where: whereClause,
                limit, offset
            })

            return res.status(200).json(compAd)
        }catch (error){
            next(ApiError.badRequest(e.message))
        }        
    }

    async getOne(req, res){
        const id = req.params.id
        const OneCompAd = await CompetitionAdmins.findByPk(id)
        return res.status(200).json(OneCompAd)
    }

    async create(req, res, next) {
        try {
            let {CompetitionId, UserId} = req.body
            const compAd = await CompetitionAdmins.create({CompetitionId, UserId});
            return res.status(200).json(compAd)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteResults(req,res){
        const id = req.params.id
        await CompetitionAdmins.destroy({where: {id}})
    }

    async updateOne(req, res) {
        const {id} = req.params;
        const {
            CompetitionId, UserId
        } = req.body;


        try {
            const compAd = await Results.findOne({where: {id}});

            if (!compAd) {
                return res.status(404).json({error: 'User was not found'});
            }

            compAd.CompetitionId = CompetitionId;
            compAd.UserId = UserId;
            
            
            await compAd.save();

            return res.status(200).json(compAd);
        } catch (error) {
            console.error(error);
            return res.status(500).json({error: 'Internal server error'});
        }
    }
}

module.exports = new CompetitionAdminsController();