'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Meja extends Model {
    static associate(models) {
      // nanti bisa relasi dengan Pesanan (1 meja bisa punya banyak pesanan)
      Meja.hasMany(models.Pesanan, { foreignKey: 'id_meja' });
    }
  }

  Meja.init({
    id_meja: {
      type: DataTypes.STRING(50),
      primaryKey: true
    },
    no_meja: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    qr_code: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Meja',
    tableName: 'meja',
    timestamps: false
  });

  return Meja;
};
