const sequelize = require('../../db')
const {DataTypes} = require('sequelize')

const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    email: {type: DataTypes.STRING, unique: true},
    password: {type: DataTypes.STRING, allowNull: false},
    phone: {type: DataTypes.CHAR},
    role: {type: DataTypes.STRING, defaultValue: 'user'}
})

const UserInfo = sequelize.define('user_info', {
    firstName: {type: DataTypes.STRING},
    lastName: {type: DataTypes.STRING},
    middleName: {type: DataTypes.STRING},
    birthday: {type: DataTypes.STRING},
    gender: {type: DataTypes.STRING},
    address: {type: DataTypes.STRING},
    age: {type: DataTypes.INTEGER},
})

User.hasOne(UserInfo, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
})
UserInfo.belongsTo(User)

module.exports = {
    User,
    UserInfo
}