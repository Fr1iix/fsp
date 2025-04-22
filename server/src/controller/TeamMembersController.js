const ApiError = require("../errorr/ApiError")
const { Op } = require('sequelize');
const {Teammembers} = require("../models/models")

class TeamMembersController{
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

            const TeamMem = Teammembers.findAll({
                where: whereClause,
                limit, offset
            })

            return res.status(200).json(TeamMem)
        }catch (error){
            next(ApiError.badRequest(e.message))
        }        
    }

    async getOne(req, res){
        const id = req.params.id
        const OneTeamMem = await Teammembers.findByPk(id)
        return res.status(200).json(OneTeamMem)
    }

    async create(req, res, next) {
        try {
            let {UserId, TeamId} = req.body
            const TeamMem = await Teammembers.create({UserId, TeamId});
            return res.status(200).json(TeamMem)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteResults(req,res){
        const id = req.params.id
        await Teammembers.destroy({where: {id}})
    }

    async updateOne(req, res) {
        const {id} = req.params;
        const {
            UserId, TeamId
        } = req.body;


        try {
            const TeamMem = await Teammembers.findOne({where: {id}});

            if (!TeamMem) {
                return res.status(404).json({error: 'User was not found'});
            }

            TeamMem.UserId = UserId;
            TeamMem.TeamId = TeamId;
            
            await TeamMem.save();

            return res.status(200).json(TeamMem);
        } catch (error) {
            console.error(error);
            return res.status(500).json({error: 'Internal server error'});
        }
    }
}

module.exports = new TeamMembersController();