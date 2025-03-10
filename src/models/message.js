const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Message = sequelize.define('Message', {
    conversationId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
    receiverId: {
        type: DataTypes.JSON,
        defaultValue: [],
        allowNull: false
    },
    messages: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Message;