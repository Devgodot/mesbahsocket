const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('data', 'pachim', "haghshenas67", {
    host: 'localhost',
    dialect: 'mysql'
});

module.exports = sequelize;
