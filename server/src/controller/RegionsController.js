const ApiError = require("../errorr/ApiError")
const { Op } = require('sequelize');
const {Regions} = require("../models/models")

class RegionsController{
    getAll = async (req, res, next) => {
        try{
            let limit = parseInt(req.query.limit, 10) || 10;
            let offset = parseInt(req.query.offset, 10) || 0;
            const search = req.query.search || '';

            console.log("Получен запрос на список регионов");

            const whereClause = search
                ? {
                name: {
                    [Op.iLike]: `%${search}%`, // для Postgres; используйте [Op.substring] для других СУБД
                },
            }
            : {};

            const regions = await Regions.findAll({
                where: whereClause,
                limit, offset
            });

            console.log(`Найдено ${regions.length} регионов`);
            console.log("Данные о регионах:", JSON.stringify(regions));

            return res.status(200).json(regions);
        }catch (error){
            console.error("Ошибка при получении списка регионов:", error);
            next(ApiError.badRequest(error.message));
        }        
    }

    async getOne(req, res){
        const id = req.params.id
        const reg = await Regions.findByPk(id)
        return res.status(200).json(reg)
    }

    async create(req, res, next) {
        try {
            let {name} = req.body
            const reg = await Regions.create({name});
            return res.status(200).json(reg)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteRegion(req, res) {
        const id = req.params.id;
        console.log(`Запрос на удаление региона с ID: ${id}`);
        try {
            await Regions.destroy({where: {id}});
            return res.status(200).json({message: "Регион успешно удален"});
        } catch (error) {
            console.error("Ошибка при удалении региона:", error);
            return res.status(500).json({error: "Внутренняя ошибка сервера"});
        }
    }

    async updateOne(req, res) {
        const {id} = req.params;
        const {
            name
        } = req.body;


        try {
            const reg = await Regions.findOne({where: {id}});

            if (!reg) {
                return res.status(404).json({error: 'User was not found'});
            }

            reg.name = name;
            
            await reg.save();

            return res.status(200).json(reg);
        } catch (error) {
            console.error(error);
            return res.status(500).json({error: 'Internal server error'});
        }
    }
}

module.exports = new RegionsController();