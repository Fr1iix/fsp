const ApiError = require("../errorr/ApiError")
const { Op } = require('sequelize');
const {Results} = require("../models/models")

class ResultsController{
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

            const result = Results.findAll({
                where: whereClause,
                limit, offset
            })

            return res.status(200).json(result)
        }catch (error){
            next(ApiError.badRequest(e.message))
        }        
    }

    async getOneResult(req, res){
        const id = req.params.id
        const OneResult = await Results.findByPk(id)
        return res.status(200).json(OneResult)
    }

    async create(req, res, next) {
        try {
            let {UserId, AmountOfCompetitions, middlerating} = req.body
            const result = await Results.create({UserId, AmountOfCompetitions, middlerating});
            return res.status(200).json(result)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteResults(req,res){
        const id = req.params.id
        await Results.destroy({where: {id}})
    }

    async updateOne(req, res) {
        const {id} = req.params;
        const {
            UserId, AmountOfCompetitions, middlerating
        } = req.body;


        try {
            const result = await Results.findOne({where: {id}});

            if (!result) {
                return res.status(404).json({error: 'User was not found'});
            }

            result.UserId = UserId;
            result.AmountOfCompetitions = AmountOfCompetitions;
            result.middlerating = middlerating;
            
            await result.save();

            return res.status(200).json(result);
        } catch (error) {
            console.error(error);
            return res.status(500).json({error: 'Internal server error'});
        }
    }

}

module.exports = new ResultsController();