'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Pesanan extends Model {
    static associate(models) {
      // Relasi ke meja
      Pesanan.belongsTo(models.Meja, { foreignKey: 'id_meja' });
      // Relasi ke keranjang (opsional)
      Pesanan.hasMany(models.Keranjang, { foreignKey: 'id_pesanan' });
    }
  }

  Pesanan.init({
    id_pesanan: {
      type: DataTypes.STRING(50),
      primaryKey: true
    },
    tanggal_pesan: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status_pesanan: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    id_meja: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Pesanan',
    tableName: 'pesanan',
    timestamps: false
  });

  return Pesanan;
};
