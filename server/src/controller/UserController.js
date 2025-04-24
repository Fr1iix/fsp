const ApiError = require('../errorr/ApiError');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User, UserInfo } = require('../models/models')

const generateJwt = (id, email, role, idRegions = null) => {
    console.log(`Генерация JWT токена: id=${id}, email=${email}, role=${role}, idRegions=${idRegions}`);
    return jwt.sign(
        { id, email, role, region: idRegions ? idRegions.toString() : null },
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
                    UserId: user.id,
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
                console.error('Детали ошибки:', infoError.message);
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
            // Получаем актуальные данные пользователя из БД
            const user = await User.findByPk(req.user.id);
            
            if (!user) {
                return next(ApiError.unauthorized('Пользователь не найден'));
            }
            
            // Генерируем токен с актуальными данными, включая регион
            const token = generateJwt(user.id, user.email, user.role, user.idRegions);
            return res.json({ token });
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

    async updateRegion(req, res, next) {
        try {
            const userId = req.params.id;
            const { idRegions } = req.body;
            
            console.log(`Запрос на обновление региона пользователя ID=${userId} на регион ID=${idRegions}`);
            
            // Проверяем, существует ли пользователь
            const user = await User.findByPk(userId);
            if (!user) {
                return next(ApiError.badRequest('Пользователь не найден'));
            }
            
            // Проверяем права доступа: только владелец аккаунта или админ может обновлять регион
            if (req.user.id != userId && req.user.role !== 'admin') {
                return next(ApiError.forbidden('У вас нет прав на изменение этого пользователя'));
            }
            
            // Обновляем регион пользователя
            await user.update({ idRegions });
            
            console.log(`Регион успешно обновлен для пользователя ID=${userId}`);
            
            // Генерируем новый токен с обновленными данными
            const token = generateJwt(user.id, user.email, user.role, idRegions);
            
            return res.status(200).json({
                success: true,
                message: 'Регион пользователя успешно обновлен',
                token
            });
        } catch (error) {
            console.error('Ошибка при обновлении региона пользователя:', error);
            return next(ApiError.internal('Ошибка при обновлении региона пользователя: ' + error.message));
        }
    }
}

module.exports = new UserController()