'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pesanan', {
      id_pesanan: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      tanggal_pesan: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status_pesanan: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      id_meja: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'meja',
          key: 'id_meja'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_keranjang: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'keranjang',
          key: 'id_keranjang'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('pesanan');
  }
};
