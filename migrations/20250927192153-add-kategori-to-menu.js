'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('menu', 'kategori', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'Makanan'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('menu', 'kategori');
  }
};
