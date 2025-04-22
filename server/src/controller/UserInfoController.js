const { UserInfo } = require('../models/models')
const db = require('../../db')
const ApiError = require('../errorr/ApiError');

// Простой кэш для хранения информации о пользователях
const userInfoCache = new Map();
const CACHE_TTL = 60 * 1000; // 1 минута в миллисекундах

class UserInfoController {
    async create(req, res, next) {
        try {
            let { firstName, lastName, middleName, birthday, gender, address, phone } = req.body
            const userinfo = await UserInfo.create({ firstName, lastName, middleName, birthday, gender, address, phone });
            return res.json(userinfo)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async deleteUserInfo(req, res) {
        const id = req.params.id
        await UserInfo.destroy({ where: { id } })
        // Очищаем кэш при удалении
        userInfoCache.delete(id);
        return res.json({ message: "Информация о пользователе удалена" })
    }

    async updateOne(req, res) {
        const { id } = req.params;
        const {
            firstName, lastName, middleName, birthday, gender, address, phone, github, discription
        } = req.body;

        try {
            const userinfo = await UserInfo.findOne({ where: { userId: id } });

            if (!userinfo) {
                return res.status(404).json({ error: 'Информация о пользователе не найдена' });
            }

            // Обновляем только те поля, которые пришли в запросе
            if (firstName !== undefined) userinfo.firstName = firstName;
            if (lastName !== undefined) userinfo.lastName = lastName;
            if (middleName !== undefined) userinfo.middleName = middleName;
            if (birthday !== undefined) userinfo.birthday = birthday;
            if (gender !== undefined) userinfo.gender = gender;
            if (address !== undefined) userinfo.address = address;
            if (phone !== undefined) userinfo.phone = phone;
            if (github !== undefined) userinfo.github = github;
            if (discription !== undefined) userinfo.discription = discription;

            await userinfo.save();

            // Обновляем кэш после изменения
            userInfoCache.set(id, {
                data: userinfo,
                timestamp: Date.now()
            });

            return res.json(userinfo);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    async getOneUserInfo(req, res) {
        const id = req.params.id

        try {
            // Проверяем, есть ли данные в кэше и не устарели ли они
            const cached = userInfoCache.get(id);
            if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
                return res.json(cached.data);
            }

            // Если кэш отсутствует или устарел, делаем запрос в базу
            const userInfo = await UserInfo.findOne({ where: { userId: id } })

            if (!userInfo) {
                return res.status(404).json({ error: 'Информация о пользователе не найдена' });
            }

            // Сохраняем результат в кэше
            userInfoCache.set(id, {
                data: userInfo,
                timestamp: Date.now()
            });

            return res.json(userInfo)
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }
}

module.exports = new UserInfoController()
