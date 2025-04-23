const { UserInfo } = require('../models/models')
const db = require('../../db')
const ApiError = require('../errorr/ApiError');

class UserInfoController {
    async create(req, res, next) {
        try {
            let { UserId, firstName, lastName, middleName, birthday, gender, phone, github, discription, AddressId } = req.body
            const userinfo = await UserInfo.create({
                UserId,
                firstName,
                lastName,
                middleName,
                birthday,
                gender,
                phone,
                github,
                discription,
                AddressId
            });
            return res.json(userinfo)
        } catch (e) {
            console.error('Ошибка при создании информации пользователя:', e);
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteUserInfo(req, res) {
        const id = req.params.id
        await UserInfo.destroy({ where: { id } })
    }

    async updateOne(req, res) {
        const { id } = req.params;
        const {
            UserId, firstName, lastName, middleName, birthday, gender, phone, github, discription, AddressId
        } = req.body;

        try {
            const userinfo = await UserInfo.findOne({ where: { UserId: id } });

            if (!userinfo) {
                console.log('Информация о пользователе не найдена для UserId:', id);
                return res.status(404).json({ error: 'Информация о пользователе не найдена' });
            }

            if (UserId !== undefined) userinfo.UserId = UserId;
            if (firstName !== undefined) userinfo.firstName = firstName;
            if (lastName !== undefined) userinfo.lastName = lastName;
            if (middleName !== undefined) userinfo.middleName = middleName;
            if (birthday !== undefined) userinfo.birthday = birthday;
            if (gender !== undefined) userinfo.gender = gender;
            if (phone !== undefined) userinfo.phone = phone;
            if (github !== undefined) userinfo.github = github;
            if (discription !== undefined) userinfo.discription = discription;
            if (AddressId !== undefined) userinfo.AddressId = AddressId;

            console.log('Обновляем информацию о пользователе:', userinfo.toJSON());
            await userinfo.save();

            return res.json(userinfo);
        } catch (error) {
            console.error('Ошибка при обновлении информации о пользователе:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    async getOneUserInfo(req, res) {
        const id = req.params.id;
        try {
            const userInfo = await UserInfo.findOne({ where: { UserId: id } });

            if (!userInfo) {
                console.log('Информация о пользователе не найдена для UserId:', id);
                return res.status(404).json({ error: 'Информация о пользователе не найдена' });
            }

            return res.json(userInfo);
        } catch (error) {
            console.error('Ошибка при получении информации о пользователе:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }
}

module.exports = new UserInfoController