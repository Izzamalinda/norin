'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Keranjang extends Model {
    static associate(models) {
      // Setiap item keranjang punya 1 menu
      Keranjang.belongsTo(models.Menu, { foreignKey: 'id_menu' });

      // Setiap item keranjang milik 1 pesanan
      Keranjang.belongsTo(models.Pesanan, { foreignKey: 'id_pesanan' });
    }
  }

  Keranjang.init(
    {
      id_keranjang: {
        type: DataTypes.STRING(50),
        primaryKey: true,
      },
      id_menu: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      jumlah: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      catatan: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      total_harga: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
      },
      id_pesanan: {
        type: DataTypes.STRING(50),
        allowNull: true, // akan diisi saat checkout
      },
    },
    {
      sequelize,
      modelName: 'Keranjang',
      tableName: 'keranjang',
      timestamps: false,
    }
  );

  return Keranjang;
};
