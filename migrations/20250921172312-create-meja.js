'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('meja', {
      id_meja: {
        type: Sequelize.STRING(50),
        primaryKey: true
      },
      no_meja: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true
      },
      qr_code: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('meja');
  }
};
