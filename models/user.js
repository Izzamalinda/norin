const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  security_question: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  security_answer: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  tableName: "users",   
  timestamps: false     
});

module.exports = User;
