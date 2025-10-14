// controllers/pesananController.js
const { Pesanan, Meja, Keranjang, Menu } = require("../models");
const { Op } = require("sequelize");

// ✅ ADMIN - Menampilkan semua pesanan
// ✅ ADMIN - Menampilkan semua pesanan (dengan pagination benar)
exports.getAllPesanan = async (req, res) => {
  try {
    const limit = 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // ✅ Hitung total pesanan unik (bukan hasil join keranjang)
    const totalPesanan = await Pesanan.count({
      distinct: true,
      col: "id_pesanan",
    });

    // ✅ Ambil data berdasarkan halaman
    const pesanan = await Pesanan.findAll({
      include: [
        { model: Meja, attributes: ["id_meja", "no_meja"] },
        {
          model: Keranjang,
          include: [{ model: Menu, attributes: ["nama", "harga"] }],
        },
      ],
      order: [["tanggal_pesan", "DESC"]],
      limit,
      offset,
    });

    const totalPages = Math.ceil(totalPesanan / limit);

    // ✅ Jika page > totalPages, kembalikan ke halaman terakhir
    if (page > totalPages && totalPages > 0) {
      return res.redirect(`/admin/daftar-pesanan?page=${totalPages}`);
    }

    res.render("pesanan", {
      user: req.session.user,
      title: "Daftar Pesanan",
      pesanan,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    console.error("❌ Error getAllPesanan:", err);
    res.status(500).send("Gagal memuat daftar pesanan");
  }
};



// ✅ ADMIN - Update status pesanan
exports.updateStatus = async (req, res) => {
  try {
    const { id_pesanan } = req.params;
    const { status_pesanan } = req.body;

    const pesanan = await Pesanan.findByPk(id_pesanan);
    if (!pesanan) return res.status(404).send("Pesanan tidak ditemukan");

    await pesanan.update({ status_pesanan });


    res.redirect("/admin/daftar-pesanan");
  } catch (err) {
    console.error("❌ Error updateStatus:", err);
    res.status(500).send("Gagal mengupdate status pesanan");
  }
};

// ✅ USER - Melihat pesanan berdasarkan meja
exports.getPesananByMeja = async (req, res) => {
  try {
    const { id_meja } = req.params;

    const pesanan = await Pesanan.findAll({
  where: {
    id_meja,
    status_pesanan: { [Op.notIn]: ["Selesai", "Completed"] }
  },
  include: [
    { model: Keranjang, include: [{ model: Menu, attributes: ["nama", "harga"] }] },
  ],
  order: [["tanggal_pesan", "DESC"]],
});

    res.render("statusPesanan", {
      title: "Status Pesanan Anda",
      pesanan,
    });
  } catch (err) {
    console.error("❌ Error getPesananByMeja:", err);
    res.status(500).send("Gagal memuat status pesanan");
  }
};
