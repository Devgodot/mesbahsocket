const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.STRING(10),
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING(256),
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING(11),
        allowNull: false,
        defaultValue: '09'
    },
    password: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    data: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
    }
}, {
    tableName: 'users', // Specify the table name explicitly
    timestamps: false // Disable createdAt and updatedAt
});

module.exports = User;