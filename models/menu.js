'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Menu extends Model {
    static associate(models) {
      // Relasi: 1 Menu bisa ada di banyak Keranjang
      Menu.hasMany(models.keranjang, { foreignKey: 'id_menu' });

      // Relasi: 1 Menu bisa dapat banyak Review
      Menu.hasMany(models.review, { foreignKey: 'id_menu' });
    }
  }

  Menu.init({
    id_menu: {
      type: DataTypes.STRING(50),
      primaryKey: true
    },
    nama: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    harga: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    deskripsi: {
      type: DataTypes.STRING,
      allowNull: true
    },
    foto: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status_menu: {
      type: DataTypes.STRING(20), // contoh: "available", "unavailable"
      allowNull: false,
      defaultValue: 'available'
    }
  }, {
    sequelize,
    modelName: 'Menu',
    tableName: 'menu',
    timestamps: false
  });

  return Menu;
};
