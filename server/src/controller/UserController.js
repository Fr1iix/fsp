const ApiError = require('../errorr/ApiError');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User, UserInfo } = require('../models/models')

const generateJwt = (id, email, role) => {
    return jwt.sign(
        { id, email, role },
        process.env.SECRET_KEY,
        { expiresIn: '24h' }
    )
}

class UserController {
    async registration(req, res, next) {
        const { email, password, role } = req.body
        if (!email || !password) {
            return next(ApiError.badRequest('Некорректный email или password'))
        }

        const candidate = await User.findOne({ where: { email } })
        if (candidate) {
            return next(ApiError.badRequest('Пользователь с таким email уже существует'))
        }

        try {
            const hashPassword = await bcrypt.hash(password, 5)

            // Создаем пользователя
            const user = await User.create({ email, password: hashPassword, role })

            // Создаем связанные данные пользователя
            try {
                await UserInfo.create({ userId: user.id })
            } catch (infoError) {
                console.error('Ошибка при создании информации о пользователе:', infoError)
                // Если не удалось создать UserInfo, все равно продолжаем
                // Можно позже создать эту запись
            }

            // Генерируем токен
            const token = generateJwt(user.id, user.email, user.role)

            // Возвращаем токен клиенту
            return res.json({ token })
        } catch (error) {
            console.error('Ошибка при регистрации пользователя:', error)
            return next(ApiError.badRequest('Ошибка при создании пользователя: ' + error.message))
        }
    }


    async login(req, res, next) {
        const { email, password } = req.body
        const user = await User.findOne({ where: { email } })
        if (!user) {
            return next(ApiError.internal('Пользователь не найден'))
        }

        let comparePassword = bcrypt.compareSync(password, user.password)
        if (!comparePassword) {
            return next(ApiError.internal('Указан неверный пароль'))
        }

        const token = generateJwt(user.id, user.email, user.role)

        return res.json({ token })
    }

    async check(req, res) {
        const token = generateJwt(req.user.id, req.user.email, req.user.role)
        return res.json({ token })
    }

    async checkEmail(req, res, next) {
        const { email } = req.body

        if (!email) {
            return next(ApiError.badRequest('Email не указан'))
        }

        try {
            const user = await User.findOne({ where: { email } })

            if (user) {
                // Если пользователь найден, возвращаем статус 200
                return res.status(200).json({ exists: true })
            } else {
                // Если пользователь не найден, возвращаем статус 404
                return res.status(404).json({ exists: false })
            }
        } catch (error) {
            return next(ApiError.internal('Ошибка при проверке email'))
        }
    }
}

module.exports = new UserController()