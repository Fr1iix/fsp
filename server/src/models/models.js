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
    lookingForMembers: { type: DataTypes.BOOLEAN, defaultValue: false },
    availableSlots: { type: DataTypes.INTEGER, defaultValue: 0 },
    requiredRoles: { type: DataTypes.STRING, defaultValue: "" },
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

const CompetitionResult = sequelize.define('competition_result', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    CompetitionId: { type: DataTypes.INTEGER, foreignKey: true },
    UserId: { type: DataTypes.INTEGER, foreignKey: true },
    TeamId: { type: DataTypes.INTEGER, foreignKey: true, allowNull: true },
    place: { type: DataTypes.INTEGER },
    points: { type: DataTypes.INTEGER },
    isConfirmed: { type: DataTypes.BOOLEAN, defaultValue: false },
})

const Invitation = sequelize.define("invitation", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    TeamId: { type: DataTypes.INTEGER, foreignKey: true },
    UserId: { type: DataTypes.INTEGER, foreignKey: true },
    InvitedBy: { type: DataTypes.INTEGER, foreignKey: true },
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    CompetitionId: { type: DataTypes.INTEGER, foreignKey: true },
    type: { type: DataTypes.STRING, defaultValue: 'invitation' },
})

User.hasOne(UserInfo, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE',
    as: 'user_info'
})
UserInfo.belongsTo(User)

User.hasOne(Results, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
})
Results.belongsTo(User, {
    foreignKey: 'UserId'
})

User.hasOne(CompetitionAdmins, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
})
CompetitionAdmins.belongsTo(User, {
    foreignKey: 'UserId'
})

Competition.hasOne(CompetitionAdmins, {
    foreignKey: 'CompetitionId',
    onDelete: 'CASCADE'
})
CompetitionAdmins.belongsTo(Competition, {
    foreignKey: 'CompetitionId'
})

Adress.hasOne(Competition, {
    foreignKey: 'AddressId',
    onDelete: 'CASCADE'
})
Competition.belongsTo(Adress, {
    foreignKey: 'AddressId'
})

Competition.hasMany(Team, {
    foreignKey: 'CompetitionId',
    onDelete: 'CASCADE'
})
Team.belongsTo(Competition, {
    foreignKey: 'CompetitionId'
})

User.hasOne(Teammembers, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
})
Teammembers.belongsTo(User, {
    foreignKey: 'UserId'
})

Team.hasMany(Teammembers, {
    foreignKey: 'TeamId',
    onDelete: 'CASCADE'
})
Teammembers.belongsTo(Team, {
    foreignKey: 'TeamId'
})

User.hasOne(Projects, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
})
Projects.belongsTo(User, {
    foreignKey: 'UserId'
})

Discipline.hasOne(Competition, {
    foreignKey: 'disciplineId',
    onDelete: 'CASCADE'
})
Competition.belongsTo(Discipline, {
    foreignKey: 'disciplineId'
})

Regions.hasOne(User, {
    foreignKey: 'idRegions',
    onDelete: 'CASCADE'
})
User.belongsTo(Regions, {
    foreignKey: 'idRegions'
})

Regions.hasOne(Adress, {
    foreignKey: 'regionId',
    onDelete: 'CASCADE'
})
Adress.belongsTo(Regions, {
    foreignKey: 'regionId'
})

Competition.hasOne(CompetitionRegion, {
    foreignKey: 'competitionId',
    onDelete: 'CASCADE'
})
CompetitionAdmins.belongsTo(Competition, {
    foreignKey: 'CompetitionId'
})

Regions.hasOne(CompetitionRegion, {
    foreignKey: 'regionId',
    onDelete: 'CASCADE'
})
CompetitionAdmins.belongsTo(Regions, {
    foreignKey: 'regionId'
})

User.hasOne(Application, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
})
Application.belongsTo(User, {
    foreignKey: 'UserId'
})

Competition.hasOne(Application, {
    foreignKey: 'CompetitionId',
    onDelete: 'CASCADE'
})
Application.belongsTo(Competition, {
    foreignKey: 'CompetitionId'
})

Team.hasMany(Application, {
    foreignKey: 'TeamId',
    onDelete: 'CASCADE'
})
Application.belongsTo(Team, {
    foreignKey: 'TeamId'
})

// Добавляем связи для результатов соревнований
Competition.hasMany(CompetitionResult, {
    foreignKey: 'CompetitionId',
    onDelete: 'CASCADE'
})
CompetitionResult.belongsTo(Competition, {
    foreignKey: 'CompetitionId'
})

User.hasMany(CompetitionResult, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
})
CompetitionResult.belongsTo(User, {
    foreignKey: 'UserId'
})

Team.hasMany(CompetitionResult, {
    foreignKey: 'TeamId',
    onDelete: 'CASCADE'
})
CompetitionResult.belongsTo(Team, {
    foreignKey: 'TeamId'
})

// Связи для приглашений
Team.hasMany(Invitation, {
    foreignKey: 'TeamId',
    onDelete: 'CASCADE'
})
Invitation.belongsTo(Team, {
    foreignKey: 'TeamId'
})

User.hasMany(Invitation, {
    foreignKey: 'UserId',
    onDelete: 'CASCADE'
})
Invitation.belongsTo(User, {
    foreignKey: 'UserId'
})

User.hasMany(Invitation, {
    foreignKey: 'InvitedBy',
    onDelete: 'CASCADE',
    as: 'SentInvitations'
})
Invitation.belongsTo(User, {
    foreignKey: 'InvitedBy',
    as: 'Inviter'
})

Competition.hasMany(Invitation, {
    foreignKey: 'CompetitionId',
    onDelete: 'CASCADE'
})
Invitation.belongsTo(Competition, {
    foreignKey: 'CompetitionId'
})

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
    Application,
    CompetitionResult,
    Invitation
}