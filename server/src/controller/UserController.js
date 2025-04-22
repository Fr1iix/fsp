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
        try {
            console.log('Registration request received:', req.body);
            const { email, password, role } = req.body

            if (!email || !password) {
                return next(ApiError.badRequest('Некорректный email или password'))
            }

            // Использую только нужные атрибуты, чтобы избежать проблем с несуществующими колонками
            const candidate = await User.findOne({
                where: { email },
                attributes: ['id', 'email', 'password', 'role']
            })

            if (candidate) {
                return next(ApiError.badRequest('Пользователь с таким email уже существует'))
            }

            const hashPassword = await bcrypt.hash(password, 5)

            // Создаем пользователя
            const user = await User.create({ email, password: hashPassword, role })
            console.log('User created successfully:', user.id);

            // Создаем связанные данные пользователя с пустыми значениями
            try {
                const userInfo = await UserInfo.create({
                    userId: user.id,
                    firstName: '',
                    lastName: '',
                    middleName: '',
                    gender: 'не указан',
                    birthday: new Date(),
                    phone: ''
                });
                console.log('UserInfo created successfully:', userInfo.id);
            } catch (infoError) {
                console.error('Ошибка при создании информации о пользователе:', infoError);
                // Если не удалось создать UserInfo, все равно продолжаем
                // Можно позже создать эту запись
            }

            // Генерируем токен
            const token = generateJwt(user.id, user.email, user.role)
            console.log('Token generated successfully');

            // Возвращаем токен клиенту
            return res.json({ token })
        } catch (error) {
            console.error('Общая ошибка при регистрации пользователя:', error);
            return next(ApiError.badRequest('Ошибка при создании пользователя: ' + error.message));
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body
            // Использую только нужные атрибуты
            const user = await User.findOne({
                where: { email },
                attributes: ['id', 'email', 'password', 'role']
            })

            if (!user) {
                return next(ApiError.internal('Пользователь не найден'))
            }

            let comparePassword = bcrypt.compareSync(password, user.password)
            if (!comparePassword) {
                return next(ApiError.internal('Указан неверный пароль'))
            }

            const token = generateJwt(user.id, user.email, user.role)

            return res.json({ token })
        } catch (error) {
            console.error('Ошибка при входе в систему:', error);
            return next(ApiError.internal('Ошибка при входе в систему'));
        }
    }

    async check(req, res, next) {
        try {
            const token = generateJwt(req.user.id, req.user.email, req.user.role)
            return res.json({ token })
        } catch (error) {
            console.error('Ошибка при проверке токена:', error);
            return next(ApiError.internal('Ошибка при проверке токена'));
        }
    }

    async checkEmail(req, res, next) {
        try {
            const { email } = req.body

            if (!email) {
                return next(ApiError.badRequest('Email не указан'))
            }

            // Ограничиваем атрибуты, которые мы запрашиваем из базы данных
            const user = await User.findOne({
                where: { email },
                attributes: ['id', 'email'] // Запрашиваем только id и email
            })

            return res.status(200).json({
                exists: !!user
            });
        } catch (error) {
            console.error('Ошибка при проверке email:', error);
            return next(ApiError.internal('Ошибка при проверке email'))
        }
    }
}

module.exports = new UserController()