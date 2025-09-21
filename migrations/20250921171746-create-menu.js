'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('menu', {
      id_menu: {
        type: Sequelize.STRING(50),
        primaryKey: true
      },
      nama: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      harga: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      deskripsi: {
        type: Sequelize.STRING,
        allowNull: true
      },
      foto: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status_menu: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'available'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('menu');
  }
};
