const sequelize = require('../../db')
const { DataTypes } = require('sequelize')

const User = sequelize.define('user', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, unique: true },
    password: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING, defaultValue: 'user' }
})

const UserInfo = sequelize.define('user_info', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    firstName: { type: DataTypes.STRING, defaultValue: '' },
    lastName: { type: DataTypes.STRING, defaultValue: '' },
    middleName: { type: DataTypes.STRING, defaultValue: '' },
    birthday: { type: DataTypes.DATE, defaultValue: new Date() },
    gender: { type: DataTypes.STRING, defaultValue: 'не указан' },
    phone: { type: DataTypes.STRING, defaultValue: '' },
    address: { type: DataTypes.STRING, defaultValue: '' },
    github: { type: DataTypes.STRING, defaultValue: '' },
    discription: { type: DataTypes.TEXT, defaultValue: '' }
})

const Results = sequelize.define('results', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    UserId: { type: DataTypes.INTEGER, foreignKey: true },
    AmountOfCompetitions: { type: DataTypes.INTEGER },
    middlerating: { type: DataTypes.INTEGER },
})

const Team = sequelize.define('team', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    UserId: { type: DataTypes.INTEGER, foreignKey: true },
    CompetitionId: { type: DataTypes.INTEGER, foreignKey: true },
    name: { type: DataTypes.STRING, unique: true },
    discription: { type: DataTypes.STRING, defaultValue: " " },
    points: { type: DataTypes.INTEGER },
    result: { type: DataTypes.INTEGER },
})

const Competition = sequelize.define('competition', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    AddressId: { type: DataTypes.INTEGER, foreignKey: true },
    discipline: { type: DataTypes.STRING, defaultValue: 'Продуктовое программирование' },
    name: { type: DataTypes.STRING, unique: true },
    startdate: { type: DataTypes.DATE, defaultValue: Date.now() },
    enddate: { type: DataTypes.DATE, },
    discription: { type: DataTypes.STRING },
    format: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING, defaultValue: 'Открытые' },
    status: { type: DataTypes.STRING, defaultValue: 'Регистрация открыта' }
})

const CompetitionAdmins = sequelize.define('competitionadmins', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    CompetitionId: { type: DataTypes.INTEGER, foreignKey: true },
    UserId: { type: DataTypes.INTEGER, foreignKey: true },
})

const Teammembers = sequelize.define('teammembers', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    UserId: { type: DataTypes.INTEGER, foreignKey: true },
    TeamId: { type: DataTypes.INTEGER, foreignKey: true },
})

const Adress = sequelize.define('address', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    region: { type: DataTypes.STRING },
    town: { type: DataTypes.STRING },
    street: { type: DataTypes.STRING },
})


User.hasOne(UserInfo, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
})
UserInfo.belongsTo(User, {
    foreignKey: 'userId'
})

User.hasOne(Results, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
})
Results.belongsTo(User)

User.hasMany(CompetitionAdmins, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
})
CompetitionAdmins.belongsTo(User)

Competition.hasMany(CompetitionAdmins, {
    foreignKey: 'competitionId',
    onDelete: 'CASCADE'
})
CompetitionAdmins.belongsTo(Competition)

Adress.hasMany(Competition, {
    foreignKey: 'addressId',
    onDelete: 'CASCADE'
})
Competition.belongsTo(Adress)

Competition.hasMany(Team, {
    foreignKey: 'competitionId',
    onDelete: 'CASCADE'
})
Team.belongsTo(Competition)

User.hasMany(Teammembers, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
})
Teammembers.belongsTo(User)

Team.hasMany(Teammembers, {
    foreignKey: 'teamId',
    onDelete: 'CASCADE'
})
Teammembers.belongsTo(Team)


module.exports = {
    User,
    UserInfo,
    Results,
    Team,
    Competition,
    CompetitionAdmins,
    Teammembers,
    Adress
}