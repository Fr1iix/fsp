const sequelize = require('../../db');
const { DataTypes } = require('sequelize');

const User = sequelize.define('user', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, unique: true },
    password: { type: DataTypes.STRING },
    role: { type: DataTypes.STRING, defaultValue: 'user' }
});

const UserInfo = sequelize.define('user_info', {
    firstName: { type: DataTypes.STRING, allowNull: false },
    middleName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    birthday: { type: DataTypes.DATE, allowNull: false },
    phone: { type: DataTypes.STRING },
    gender: { type: DataTypes.STRING, allowNull: false },
    github: { type: DataTypes.STRING },
    discription: { type: DataTypes.STRING }
});

const Results = sequelize.define('results', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    AmountOfCompetitions: { type: DataTypes.INTEGER },
    middlerating: { type: DataTypes.INTEGER }
});

const Team = sequelize.define('team', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, unique: true },
    discription: { type: DataTypes.STRING },
    points: { type: DataTypes.INTEGER },
    result: { type: DataTypes.INTEGER }
});

const Competition = sequelize.define('competition', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    discipline: { type: DataTypes.STRING, defaultValue: 'Продуктовое программирование' },
    name: { type: DataTypes.STRING, unique: true },
    startdate: { type: DataTypes.DATE, defaultValue: Date.now },
    enddate: { type: DataTypes.DATE },
    discription: { type: DataTypes.STRING },
    format: { type: DataTypes.STRING },
    type: { type: DataTypes.STRING, defaultValue: 'Открытые' }
});

const CompetitionAdmins = sequelize.define('competitionadmins', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
});

const Teammembers = sequelize.define('teammembers', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
});

const Address = sequelize.define('address', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    region: { type: DataTypes.STRING },
    town: { type: DataTypes.STRING },
    street: { type: DataTypes.STRING }
});

const Projects = sequelize.define('projects', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    files: { type: DataTypes.STRING }
});

// Associations
User.hasOne(UserInfo, { foreignKey: 'userId', onDelete: 'CASCADE' });
UserInfo.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Results, { foreignKey: 'userId', onDelete: 'CASCADE' });
Results.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(CompetitionAdmins, { foreignKey: 'userId', onDelete: 'CASCADE' });
CompetitionAdmins.belongsTo(User, { foreignKey: 'userId' });

Competition.hasMany(CompetitionAdmins, { foreignKey: 'competitionId', onDelete: 'CASCADE' });
CompetitionAdmins.belongsTo(Competition, { foreignKey: 'competitionId' });

Address.hasMany(Competition, { foreignKey: 'addressId', onDelete: 'CASCADE' });
Competition.belongsTo(Address, { foreignKey: 'addressId' });

Competition.hasMany(Team, { foreignKey: 'competitionId', onDelete: 'CASCADE' });
Team.belongsTo(Competition, { foreignKey: 'competitionId' });

Team.belongsToMany(User, { through: Teammembers, foreignKey: 'teamId' });
User.belongsToMany(Team, { through: Teammembers, foreignKey: 'userId' });

User.hasMany(Projects, { foreignKey: 'userId', onDelete: 'CASCADE' });
Projects.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Team, { foreignKey: 'userId', onDelete: 'CASCADE' });
Team.belongsTo(User, { foreignKey: 'userId' });

UserInfo.belongsTo(Address, { foreignKey: 'addressId' });
Address.hasMany(UserInfo, { foreignKey: 'addressId' });

module.exports = {
    sequelize,
    User,
    UserInfo,
    Results,
    Team,
    Competition,
    CompetitionAdmins,
    Teammembers,
    Address,
    Projects
};
