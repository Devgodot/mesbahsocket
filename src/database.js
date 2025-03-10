const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('data', 'pachim', "haghshenas67", {
    host: 'localhost',
    port: 3307,
    dialect: 'mysql'
});

module.exports = sequelize;
