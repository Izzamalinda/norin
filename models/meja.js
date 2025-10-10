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
      type: DataTypes.INTEGER,
      autoIncrement: true,     // ✅ biar otomatis nambah
      primaryKey: true
    },
    no_meja: {
      type: DataTypes.STRING,
      allowNull: false
    },
    qr_code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Meja',
    tableName: 'meja',
    timestamps: false
  });

  return Meja;
};
