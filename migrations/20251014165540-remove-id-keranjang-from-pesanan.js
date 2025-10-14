"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 🧹 Hapus kolom id_keranjang dari tabel pesanan
    await queryInterface.removeColumn("pesanan", "id_keranjang");
  },

  async down(queryInterface, Sequelize) {
    // 🔁 Jika rollback, tambahkan kembali kolom id_keranjang
    await queryInterface.addColumn("pesanan", "id_keranjang", {
      type: Sequelize.STRING(50),
      allowNull: true,
      references: {
        model: "keranjang",
        key: "id_keranjang",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },
};
