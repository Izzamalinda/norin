'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('keranjang', 'id_pesanan', {
      type: Sequelize.STRING(50),
      allowNull: true,
      references: {
        model: 'pesanan',
        key: 'id_pesanan',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('keranjang', 'id_pesanan');
  },
};
