// controllers/pesananController.js
const { Pesanan, Meja, Keranjang, Menu } = require("../models");

// ✅ ADMIN - Menampilkan semua pesanan (dengan detail menu)
exports.getAllPesanan = async (req, res) => {
  try {
    const pesanan = await Pesanan.findAll({
      include: [
        {
          model: Meja,
          attributes: ["id_meja", "no_meja"],
        },
        {
          model: Keranjang,
          include: [
            {
              model: Menu,
              attributes: ["id_menu", "nama", "harga"], // ✅ gunakan "nama", bukan "nama_menu"
            },
          ],
        },
      ],
      order: [["tanggal_pesan", "DESC"]],
    });

    res.render("pesanan", {
      user: req.session.user,
      title: "Daftar Pesanan",
      pesanan,
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

// ✅ PELANGGAN - Melihat daftar/status pesanan berdasarkan meja
exports.getPesananByMeja = async (req, res) => {
  try {
    const { id_meja } = req.params;

    const pesanan = await Pesanan.findAll({
      where: { id_meja },
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