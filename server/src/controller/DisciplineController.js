const ApiError = require("../errorr/ApiError")
const { Op } = require('sequelize');
const {Discipline} = require("../models/models")

class DisciplineController{
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

            const disc = Discipline.findAll({
                where: whereClause,
                limit, offset
            })

            return res.status(200).json(disc)
        }catch (error){
            next(ApiError.badRequest(e.message))
        }        
    }

    async getOne(req, res){
        const id = req.params.id
        const disc = await Discipline.findByPk(id)
        return res.status(200).json(disc)
    }

    async create(req, res, next) {
        try {
            let {name, discription, competitionsCount, participantsCount, progres} = req.body
            const disc = await Discipline.create({name, discription, competitionsCount, participantsCount, progres});
            return res.status(200).json(disc)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteAdress(req,res){
        const id = req.params.id
        await Discipline.destroy({where: {id}})
    }

    async updateOne(req, res) {
        const {id} = req.params;
        const {
            name, discription, competitionsCount, participantsCount, progres
        } = req.body;


        try {
            const disc = await Discipline.findOne({where: {id}});

            if (!disc) {
                return res.status(404).json({error: 'User was not found'});
            }

            disc.name = name;
            disc.discription = discription;
            disc.competitionsCount = competitionsCount;
            disc.naparticipantsCountme = participantsCount;
            disc.progres = progres;
            
            await disc.save();

            return res.status(200).json(disc);
        } catch (error) {
            console.error(error);
            return res.status(500).json({error: 'Internal server error'});
        }
    }
}

module.exports = new DisciplineController();