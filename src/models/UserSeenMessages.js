const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const UserSeenMessages = sequelize.define('UserSeenMessages', {
    message_id: {
        type: DataTypes.STRING,
        allowNull: false
        
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'user_seen_messages', // Specify the table name explicitly
    timestamps: false // Disable createdAt and updatedAt
});

module.exports = UserSeenMessages;