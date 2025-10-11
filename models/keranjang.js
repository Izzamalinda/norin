'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Keranjang extends Model {
    static associate(models) {
      // Keranjang berisi 1 menu
      Keranjang.belongsTo(models.Menu, { foreignKey: 'id_menu' });
      // Keranjang bisa dipakai di banyak pesanan
      Keranjang.hasMany(models.Pesanan, { foreignKey: 'id_keranjang' });
    }
  }

  Keranjang.init({
    id_keranjang: {
      type: DataTypes.STRING(50),
      primaryKey: true
    },
    id_menu: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    jumlah: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    catatan: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Keranjang',
    tableName: 'keranjang',
    timestamps: false
  });

  return Keranjang;
};
