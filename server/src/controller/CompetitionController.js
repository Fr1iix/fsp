const ApiError = require("../errorr/ApiError")
const { Op } = require('sequelize');
const { Competition } = require("../models/models")

class CompetitionController {
    getAll = async (req, res, next) => {
        try {
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

            const comp = await Competition.findAll({
                where: whereClause,
                limit, offset
            });

            console.log('Найдено соревнований:', comp.length);
            return res.status(200).json(comp);
        } catch (error) {
            console.error('Ошибка при получении соревнований:', error);
            next(ApiError.badRequest(error.message));
        }
    }

    async getOneCompetition(req, res) {
        const id = req.params.id
        const OneComp = await Competition.findByPk(id)
        return res.status(200).json(OneComp)
    }

    async create(req, res, next) {
        try {
            let { disciplineId, name, discription, format,
                type, startdate, enddate, startdate_cometition,
                enddate_cometition, maxParticipants, status, AddressId, regionId } = req.body
            const comp = await Competition.create({
                disciplineId, name, discription, format,
                type, startdate, enddate, startdate_cometition,
                enddate_cometition, maxParticipants, status, AddressId, regionId
            });
            return res.status(200).json(comp)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteComp(req, res) {
        const id = req.params.id
        await Competition.destroy({ where: { id } })
    }

    async updateOne(req, res) {
        const { id } = req.params;
        const { disciplineId, name, discription, format,
            type, startdate, enddate, startdate_cometition,
            enddate_cometition, maxParticipants, status, AddressId, regionId
        } = req.body;


        try {
            const comp = await Competition.findOne({ where: { id } });

            if (!comp) {
                return res.status(404).json({ error: 'User was not found' });
            }

            comp.disciplineId = disciplineId;
            comp.name = name;
            comp.discription = discription;
            comp.format = format;
            comp.type = type;
            comp.startdate = startdate;
            comp.enddate = enddate;
            comp.startdate_cometition = startdate_cometition;
            comp.enddate_cometition = enddate_cometition;
            comp.maxParticipants = maxParticipants;
            comp.status = status;
            comp.AddressId = AddressId;
            comp.regionId = regionId;

            await comp.save();

            return res.status(200).json(comp);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new CompetitionController();