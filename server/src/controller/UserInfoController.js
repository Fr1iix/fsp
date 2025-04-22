const {UserInfo} = require('../models/models')
const db = require('../../db')
const ApiError = require('../errorr/ApiError');

class UserInfoController {
    async create(req, res, next) {
        try {
            let {UserId, firstName,lastname,middleName,birthday,gender,address,phone, github, discription, AddressId} = req.body
            const userinfo = await UserInfo.create({UserId, firstName,lastname,middleName,birthday,gender,address,phone, github, discription, AddressId});
            return res.json(userinfo)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteUserInfo(req,res){
        const id = req.params.id
        await UserInfo.destroy({where: {id}})
    }

    async updateOne(req, res) {
        const {id} = req.params;
        const {
            UserId, firstName,lastname,middleName,birthday,gender,address,phone, github, discription, AddressId
        } = req.body;


        try {
            const userinfo = await UserInfo.findOne({where: {id}});

            if (!userinfo) {
                return res.status(404).json({error: 'User was not found'});
            }

            userinfo.UserId = UserId;
            userinfo.firstName = firstName;
            userinfo.lastname = lastname;
            userinfo.middleName = middleName;
            userinfo.birthday = birthday;
            userinfo.gender = gender;
            userinfo.address = address;
            userinfo.phone = phone;
            userinfo.github = github;
            userinfo.discription = discription;
            userinfo.AddressId = AddressId;


            await userinfo.save();

            return res.json(userinfo);
        } catch (error) {
            console.error(error);
            return res.status(500).json({error: 'Internal server error'});
        }
    }

    async getOneUserInfo(req, res){
        const id = req.params.id
        const OneUserInfo = await UserInfo.findByPk(id)
        return res.json(OneUserInfo)
    }
}

module.exports = new UserInfoController
