const ApiError = require('../errorr/ApiError')
const { Op } = require('sequelize');
const {Team} = require('../models/models')

class TeamController {
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

            const team = Team.findAll({
                where: whereClause,
                limit, offset
            })

            return res.status(200).json(team)
        }catch (error){
            next(ApiError.badRequest(e.message))
        }        
    }

    async getTeam(req, res){
        const id = req.params.id
        const OneTeam = await Team.findByPk(id)
        return res.status(200).json(OneTeam)
    }

    async create(req, res, next) {
        try {
            let { CompetitionId, name, discription, points, result, teammembersId} = req.body
            const team = await Team.create({CompetitionId, name, discription, points, result, teammembersId});
            return res.status(200).json(team)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteTeam(req,res){
        const id = req.params.id
        await Team.destroy({where: {id}})
    }

    async updateOne(req, res) {
        const {id} = req.params;
        const {
            CompetitionId, name, discription, points, result, teammembersId
        } = req.body;


        try {
            const team = await Team.findOne({where: {id}});

            if (!team) {
                return res.status(404).json({error: 'Team was not found'});
            }
            
            team.CompetitionId = CompetitionId;
            team.name = name;
            team.discription = discription;
            team.points = points;
            team.result = result;
            team.teammembersId = teammembersId;

            await team.save();

            return res.status(200).json(team);
        } catch (error) {
            console.error(error);
            return res.status(500).json({error: 'Internal server error'});
        }
    }


}

module.exports = new TeamController();