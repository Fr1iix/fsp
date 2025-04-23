const ApiError = require("../errorr/ApiError")
const { Op } = require('sequelize');
const {Adress} = require("../models/models")

class AdressController{
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

            const adress = Adress.findAll({
                where: whereClause,
                limit, offset
            })

            return res.status(200).json(adress)
        }catch (error){
            next(ApiError.badRequest(e.message))
        }        
    }

    async getOne(req, res){
        const id = req.params.id
        const address = await Adress.findByPk(id)
        return res.status(200).json(address)
    }

    async create(req, res, next) {
        try {
            let {regionId, town, street} = req.body
            const address = await Adress.create({regionId, town, street});
            return res.status(200).json(address)
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
            regionId, town, street
        } = req.body;


        try {
            const adress = await Adress.findOne({where: {id}});

            if (!adress) {
                return res.status(404).json({error: 'User was not found'});
            }

            adress.regionId = regionId;
            adress.town = town;
            adress.street = street;
            
            await adress.save();

            return res.status(200).json(adress);
        } catch (error) {
            console.error(error);
            return res.status(500).json({error: 'Internal server error'});
        }
    }
}

module.exports = new AdressController();