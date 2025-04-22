const ApiError = require("../errorr/ApiError")
const { Op } = require('sequelize');
const {CompetitionRegion} = require("../models/models")

class CompetitionRegionController{
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

            const comReg = CompetitionRegion.findAll({
                where: whereClause,
                limit, offset
            })

            return res.status(200).json(comReg)
        }catch (error){
            next(ApiError.badRequest(e.message))
        }        
    }

    async getOne(req, res){
        const id = req.params.id
        const comReg = await CompetitionRegion.findByPk(id)
        return res.status(200).json(comReg)
    }

    async create(req, res, next) {
        try {
            let {competitionId, regionId} = req.body
            const comReg = await CompetitionRegion.create({competitionId, regionId});
            return res.status(200).json(comReg)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteAdress(req,res){
        const id = req.params.id
        await CompetitionRegion.destroy({where: {id}})
    }

    async updateOne(req, res) {
        const {id} = req.params;
        const {
            competitionId, regionId
        } = req.body;


        try {
            const comReg = await CompetitionRegion.findOne({where: {id}});

            if (!comReg) {
                return res.status(404).json({error: 'User was not found'});
            }

            comReg.competitionId = competitionId;
            comReg.regionId = regionId;
            
            await comReg.save();

            return res.status(200).json(comReg);
        } catch (error) {
            console.error(error);
            return res.status(500).json({error: 'Internal server error'});
        }
    }
}

module.exports = new CompetitionRegionController();