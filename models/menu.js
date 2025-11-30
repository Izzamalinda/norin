'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Menu extends Model {
    static associate(models) {
      // Relasi: 1 Menu bisa ada di banyak Keranjang
      Menu.hasMany(models.Keranjang, { foreignKey: 'id_menu' });
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
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'available'
    },
    kategori: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Makanan'
    }
  }, {
    sequelize,
    modelName: 'Menu',
    tableName: 'menu',
    timestamps: false
  });

  // ✔ Hook harus diletakkan SETELAH init
  Menu.addHook("beforeCreate", async (menu) => {
    const last = await Menu.findOne({
      order: [["id_menu", "DESC"]]
    });

    let newId = "M001";

    if (last) {
      const lastNumber = parseInt(last.id_menu.substring(1), 10);
      newId = "M" + String(lastNumber + 1).padStart(3, "0");
    }

    menu.id_menu = newId;
  });

  return Menu;
};
