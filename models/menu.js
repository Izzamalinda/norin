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
  timestamps: false,
  hooks: {
    beforeCreate: async (menu, options) => {
      const lastMenu = await Menu.findOne({
        order: [['id_menu', 'DESC']]
      });
      let newId = "M001";
      if (lastMenu) {
        const lastIdNum = parseInt(lastMenu.id_menu.substring(1));
        newId = "M" + String(lastIdNum + 1).padStart(3, "0");
      }
      menu.id_menu = newId;
    }
  }
});

  return Menu;
};
