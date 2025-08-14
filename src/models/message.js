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
    sender:{
        type:DataTypes.STRING,
        allowNull:false
    },
    response: {
        type:DataTypes.STRING,
        allowNull:true
    },
    deleted: {
        type: DataTypes.DATE,
        allowNull:true,
    },
    part:{
        type:DataTypes.STRING,
        allowNull:false
    },
    seen:{
        type:DataTypes.DATE,
        allowNull:true
    },
    edited:{
        type:DataTypes.BOOLEAN,
        defaultValue:false
    },
    time:{
        type:DataTypes.STRING,
        allowNull:true
    }
}, {
    timestamps:false
});

module.exports = Message;