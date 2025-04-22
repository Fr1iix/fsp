const sequelize = require('../../db')
const { DataTypes } = require('sequelize')

const User = sequelize.define('user', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, unique: true },
    password: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING, defaultValue: 'user' },
    idRegions: { type: DataTypes.INTEGER, foreignKey: true },
})

const UserInfo = sequelize.define('user_info', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    UserId: { type: DataTypes.INTEGER, foreignKey: true },
    firstName: { type: DataTypes.STRING, allowNull: true },
    middleName: { type: DataTypes.STRING, allowNull: true },
    lastName: { type: DataTypes.STRING, allowNull: true },
    birthday: { type: DataTypes.DATE, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    gender: { type: DataTypes.STRING, allowNull: true, defaultValue: 'не указан' },
    github: { type: DataTypes.STRING, allowNull: true },
    discription: { type: DataTypes.STRING, allowNull: true },
    AddressId: { type: DataTypes.INTEGER, foreignKey: true, allowNull: true },
})

const Results = sequelize.define('results', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    UserId: { type: DataTypes.INTEGER, foreignKey: true },
    AmountOfCompetitions: { type: DataTypes.INTEGER },
    middlerating: { type: DataTypes.INTEGER },
})

const Team = sequelize.define('team', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    CompetitionId: { type: DataTypes.INTEGER, foreignKey: true },
    name: { type: DataTypes.STRING, unique: true },
    discription: { type: DataTypes.STRING, defaultValue: " " },
    points: { type: DataTypes.INTEGER },
    result: { type: DataTypes.INTEGER },
    teammembersId: { type: DataTypes.INTEGER, foreignKey: true },
})

const Competition = sequelize.define('competition', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    disciplineId: { type: DataTypes.INTEGER, foreignKey: true },
    name: { type: DataTypes.STRING, unique: true },
    discription: { type: DataTypes.STRING },
    format: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING, defaultValue: 'Открытые' },
    startdate: { type: DataTypes.DATE, defaultValue: Date.now() },
    enddate: { type: DataTypes.DATE, },
    startdate_cometition: { type: DataTypes.DATE, },
    enddate_cometition: { type: DataTypes.DATE, },
    maxParticipants: { type: DataTypes.INTEGER, },
    status: { type: DataTypes.STRING, defaultValue: 'Регистрация открыта' },
    AddressId: { type: DataTypes.INTEGER, foreignKey: true },
    regionId: { type: DataTypes.INTEGER, foreignKey: true },
})

const CompetitionAdmins = sequelize.define('competitionadmins', {
    CompetitionId: { type: DataTypes.INTEGER, foreignKey: true },
    UserId: { type: DataTypes.INTEGER, foreignKey: true },
})

const Teammembers = sequelize.define('teammembers', {
    is_capitan: { type: DataTypes.BOOLEAN, defaultValue: false },
    UserId: { type: DataTypes.INTEGER, foreignKey: true },
    TeamId: { type: DataTypes.INTEGER, foreignKey: true },
})

const Adress = sequelize.define('address', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    regionId: { type: DataTypes.INTEGER, foreignKey: true },
    town: { type: DataTypes.STRING },
    street: { type: DataTypes.STRING },
})

const Projects = sequelize.define("projects", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    UserId: { type: DataTypes.INTEGER, foreignKey: true },
    name: { type: DataTypes.STRING, unique: true },
    files: { type: DataTypes.STRING, unique: true },
})

const Discipline = sequelize.define("discipline", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, unique: true },
    discription: { type: DataTypes.STRING },
    competitionsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    participantsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    progres: { type: DataTypes.INTEGER, }
})

const Regions = sequelize.define("regions", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, unique: true },
})

const CompetitionRegion = sequelize.define("competitionRegion", {
    competitionId: { type: DataTypes.INTEGER, foreignKey: true },
    regionId: { type: DataTypes.INTEGER, foreignKey: true },
})

const Application = sequelize.define("application", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    UserId: { type: DataTypes.INTEGER, foreignKey: true },
    TeamId: { type: DataTypes.INTEGER, foreignKey: true },
    CompetitionId: { type: DataTypes.INTEGER, foreignKey: true },
    status: { type: DataTypes.STRING, },
    UUID: { type: DataTypes.STRING },
})

User.hasOne(UserInfo, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
})
UserInfo.belongsTo(User)

User.hasOne(Results, {
    foreignKey: 'userId',
    onDelete: 'CASCADE'
})
Results.belongsTo(User)

User.hasOne(CompetitionAdmins, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
})
CompetitionAdmins.belongsTo(User)

Competition.hasOne(CompetitionAdmins, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
})
CompetitionAdmins.belongsTo(Competition)

Adress.hasOne(Competition, {
    foreignKey: 'AddressId',
    onDelete: 'CASCADE'
})
Competition.belongsTo(Adress)

Competition.hasMany(Team, {
    foreignKey: 'competitionId',
    onDelete: 'CASCADE'
})
Team.belongsTo(Competition)

User.hasOne(Teammembers, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
})
Teammembers.belongsTo(User)

Team.hasOne(Teammembers, {
    foreignKey: 'TeamId',
    onDelete: 'CASCADE'
})
Teammembers.belongsTo(Team)

User.hasOne(Projects, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
})
Projects.belongsTo(User)

Discipline.hasOne(Competition, {
    foreignKey: 'disciplineId',
    onDelete: 'CASCADE'
})
Competition.belongsTo(Discipline)

Regions.hasOne(User, {
    foreignKey: 'idRegions',
    onDelete: 'CASCADE'
})
User.belongsTo(Regions)

Regions.hasOne(Adress, {
    foreignKey: 'regionId',
    onDelete: 'CASCADE'
})
Adress.belongsTo(Regions)

Competition.hasOne(CompetitionRegion, {
    foreignKey: 'competitionId',
    onDelete: 'CASCADE'
})
CompetitionAdmins.belongsTo(Competition)

Regions.hasOne(CompetitionRegion, {
    foreignKey: 'regionId',
    onDelete: 'CASCADE'
})
CompetitionAdmins.belongsTo(Regions)

User.hasOne(Application, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
})
Application.belongsTo(User)

Competition.hasOne(Application, {
    foreignKey: 'CompetitionId',
    onDelete: 'CASCADE'
})
Application.belongsTo(Competition)

Team.hasOne(Application, {
    foreignKey: 'TeamId',
    onDelete: 'CASCADE'
})
Application.belongsTo(Team)

module.exports = {
    sequelize,
    User,
    UserInfo,
    Results,
    Team,
    Competition,
    CompetitionAdmins,
    Teammembers,
    Adress,
    Projects,
    Discipline,
    Regions,
    CompetitionRegion,
    Application
}