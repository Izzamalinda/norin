const { Pesanan, Meja, Keranjang, Menu } = require("../models");
const { Op } = require("sequelize");

class PesananController {
  
  async getAllPesanan(req, res) {
    try {
      const limit = 10;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;

      const totalPesanan = await Pesanan.count({ distinct: true, col: "id_pesanan" });

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
  }

  async updateStatus(req, res) {
    try {
      const { id_pesanan } = req.params;
      const { status_pesanan } = req.body;
      const io = req.app.get("io");

      const pesanan = await Pesanan.findByPk(id_pesanan, {
        include: { model: Meja, attributes: ["id_meja", "no_meja"] },
      });

      if (!pesanan) return res.status(404).send("Pesanan tidak ditemukan");

      await pesanan.update({ status_pesanan });

      io.emit("statusPesananUpdate", {
        id_meja: pesanan.Meja.id_meja,
        no_meja: pesanan.Meja.no_meja,
        id_pesanan: pesanan.id_pesanan,
        status_pesanan,
      });

      res.redirect("/admin/daftar-pesanan");

    } catch (err) {
      console.error("❌ Error updateStatus:", err);
      res.status(500).send("Gagal mengupdate status pesanan");
    }
  }

  async getPesananByMeja(req, res) {
    try {
      const { id_meja } = req.params;

      const pesanan = await Pesanan.findAll({
        where: {
          id_meja,
          status_pesanan: { [Op.notIn]: ["Selesai", "Completed"] },
        },
        include: [
          {
            model: Keranjang,
            include: [{ model: Menu, attributes: ["nama", "harga"] }],
          },
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
  }

  async createPesanan(req, res) {
    try {
      const io = req.app.get("io");
      const { id_meja, total_harga, status_pesanan } = req.body;

      const meja = await Meja.findByPk(id_meja);
      if (!meja) return res.status(404).json({ message: "Meja tidak ditemukan" });

      const pesananBaru = await Pesanan.create({
        id_meja,
        tanggal_pesan: new Date(),
        status_pesanan: status_pesanan || "Menunggu Pembayaran",
        total_harga,
      });

      res.status(200).json({
        message: "Pesanan berhasil dibuat",
        pesananBaru,
      });

    } catch (err) {
      console.error("❌ Error createPesanan:", err);
      res.status(500).send("Gagal membuat pesanan baru");
    }
  } 

  async getJumlahPesanan(req, res) {
    try {
      const totalPesanan = await Pesanan.count({
        where: {
          status_pesanan: { [Op.notIn]: ["Selesai", "Completed"] },
        },
      });

      res.json({ total: totalPesanan });

    } catch (err) {
      console.error("❌ Error getJumlahPesanan:", err);
      res.status(500).json({ total: 0 });
    }
  }
}

module.exports = new PesananController();
