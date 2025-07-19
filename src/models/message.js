const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.STRING,
        defaultValue: (DataTypes.UUIDV4),
        primaryKey: true
    },
    conversationId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    
    messages: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    response: {
        type:DataTypes.STRING,
        allowNull:true
    },
    deleted: {
        type: DataTypes.DATE,
        allowNull:true
    },
    seen:{
        type:DataTypes.DATE,
        allowNull:true
    },
    edited:{
        type:DataTypes.BOOLEAN,
        defaultValue:false
    },
    part:{
        type:DataTypes.STRING,
        allowNull:false
    }
});

module.exports = Message;