const {DataTypes} = require('sequelize')
const sequelize = require('../database')

const Conversation = sequelize.define("conversation", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    conversationId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user1:{
        type: DataTypes.STRING,
        allowNull: false
    },
    user2:{
        type: DataTypes.STRING,
        allowNull: false
    },
    last_seen1:{
        type:DataTypes.JSON,
        allowNull:true,
        defaultValue: {}
    },
    last_seen2:{
        type:DataTypes.JSON,
        allowNull:true,
        defaultValue: {}
    },
    state1:{
        type:DataTypes.STRING,
        allowNull:true,
        defaultValue: 'offline'
    },
    state2:{
        type:DataTypes.STRING,
        allowNull:true,
        defaultValue: 'offline'
    },part:{
        type:DataTypes.STRING,
        allowNull:false
    }

}, {
    timestamps: false,
})
module.exports = Conversation;