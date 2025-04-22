const ApiError = require('../errorr/ApiError');

module.exports = function (err, req, res, next) {
    // Выводим ошибку в консоль для отладки
    console.error('Ошибка на сервере:', err);

    if (err instanceof ApiError) {
        return res.status(err.status).json({ message: err.message })
    }
    return res.status(500).json({ message: "Непредвиденная ошибка сервера" })
}