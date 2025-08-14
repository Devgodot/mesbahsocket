const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const GameData = sequelize.define('game_data', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    data:{
        type:DataTypes.JSON,
        allowNull:false
    }
},
    {
        timestamps:false
    }
);

module.exports = GameData;
