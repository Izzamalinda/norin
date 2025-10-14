'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('keranjang', 'total_harga', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      after: 'jumlah', // posisi setelah kolom jumlah (opsional)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('keranjang', 'total_harga');
  }
};
