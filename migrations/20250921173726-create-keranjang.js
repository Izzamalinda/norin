'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('keranjang', {
      id_keranjang: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      id_menu: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'menu',
          key: 'id_menu'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      jumlah: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      catatan: {
        type: Sequelize.STRING,
        allowNull: true
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('keranjang');
  }
};
