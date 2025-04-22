const ApiError = require("../errorr/ApiError")
const { Op } = require('sequelize');
const {Competition} = require("../models/models")

class CompetitionController{
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

            const comp = Competition.findAll({
                where: whereClause,
                limit, offset
            })

            return res.status(200).json(comp)
        }catch (error){
            next(ApiError.badRequest(e.message))
        }        
    }

    async getOneCompetition(req, res){
        const id = req.params.id
        const OneComp = await Competition.findByPk(id)
        return res.status(200).json(OneComp)
    }

    async create(req, res, next) {
        try {
            let {AddressId, discipline, name, startdate, enddate, discription, format, type, status} = req.body
            const comp = await Competition.create({AddressId, discipline, name, startdate, enddate, discription, format, type, status});
            return res.status(200).json(result)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteComp(req,res){
        const id = req.params.id
        await Competition.destroy({where: {id}})
    }

    async updateOne(req, res) {
        const {id} = req.params;
        const {
            AddressId, discipline, name, startdate,
            enddate, discription, format, type, status
        } = req.body;


        try {
            const comp = await Competition.findOne({where: {id}});

            if (!comp) {
                return res.status(404).json({error: 'User was not found'});
            }

            comp.AddressId = AddressId;
            comp.discipline = discipline;
            comp.name = name;
            comp.startdate = startdate;
            comp.enddate = enddate;
            comp.discription = discription;
            comp.format = format;
            comp.type = type;
            comp.status = status;
            
            await comp.save();

            return res.status(200).json(comp);
        } catch (error) {
            console.error(error);
            return res.status(500).json({error: 'Internal server error'});
        }
    }
}

module.exports = new CompetitionController();