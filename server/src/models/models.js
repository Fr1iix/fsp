const sequelize = require('../../db')
const {DataTypes} = require('sequelize')

const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    email: {type: DataTypes.STRING, unique: true},
    password: {type: DataTypes.STRING},
    role: {type: DataTypes.STRING, defaultValue: 'user'},
})

const UserInfo = sequelize.define('user_info', {
    firstName: {type: DataTypes.STRING},
    lastName: {type: DataTypes.STRING},
    middleName: {type: DataTypes.STRING},
    birthday: {type: DataTypes.DATE},
    gender: {type: DataTypes.STRING},
    address: {type: DataTypes.STRING},
    phone: {type: DataTypes.STRING},
})

User.hasOne(UserInfo, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
})
UserInfo.belongsTo(User)

module.exports = {
    sequelize,
    User,
    UserInfo
}