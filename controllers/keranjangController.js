const { Menu, Pesanan, Keranjang } = require("../models");
const { Op } = require("sequelize");
const { ensureMejaExists, hasActivePesanan } = require("./mejaController");

class KeranjangController {
  async addToKeranjang(req, res) {
    try {
      const { id_menu } = req.body;
      const menu = await Menu.findByPk(id_menu);
      if (!menu) return res.status(404).json({ message: "Menu tidak ditemukan" });

      if (!req.session.keranjang) req.session.keranjang = [];

      const existing = req.session.keranjang.find(i => i.id_menu === id_menu);
      if (existing) {
        existing.jumlah += 1;
        existing.total_harga = existing.jumlah * menu.harga;
      } else {
        req.session.keranjang.push({
          id_menu,
          nama: menu.nama,
          harga: menu.harga,
          jumlah: 1,
          total_harga: menu.harga,
        });
      }

      res.json({ success: true, keranjang: req.session.keranjang });
    } catch (err) {
      console.error("addToKeranjang:", err);
      res.status(500).json({ error: err.message });
    }
  }

  async updateJumlah(req, res) {
    try {
      const { id_menu, action } = req.body;
      if (!req.session.keranjang) req.session.keranjang = [];

      const item = req.session.keranjang.find(i => i.id_menu === id_menu);
      if (!item) return res.json({ success: false });

      if (action === "tambah") item.jumlah += 1;
      if (action === "kurang") item.jumlah -= 1;

      if (item.jumlah <= 0) {
        req.session.keranjang = req.session.keranjang.filter(i => i.id_menu !== id_menu);
      } else {
        item.total_harga = item.jumlah * item.harga;
      }

      return res.json({
        success: true,
        keranjang: req.session.keranjang
      });
    } catch (err) {
      console.error("updateJumlah:", err);
      res.status(500).json({ error: err.message });
    }
  }

  async deleteItem(req, res) {
    try {
      const { id_menu } = req.params;
      if (!req.session.keranjang) return res.json({ success: false });

      req.session.keranjang = req.session.keranjang.filter(i => i.id_menu !== id_menu);
      res.json({ success: true });
    } catch (err) {
      console.error("deleteItem:", err);
      res.status(500).json({ error: err.message });
    }
  }

  async updateCatatan(req, res) {
    try {
      const { id_menu, catatan } = req.body;

      if (req.session.keranjang) {
        const item = req.session.keranjang.find(i => i.id_menu === id_menu);
        if (item) item.catatan = catatan; 
      }

      await Keranjang.update(
        { catatan: JSON.stringify(catatan) },
        { where: { id_menu } }
      );

      res.json({ success: true, message: "Catatan diperbarui" });
    } catch (error) {
      console.error("Gagal update catatan:", error);
      res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
  }

  async checkout(req, res) {
    try {
      const id_meja = req.session.id_meja;
      const items = req.session.keranjang || [];

      if (!id_meja) return res.status(400).json({ message: "Belum scan QR meja" });
      if (items.length === 0) return res.status(400).json({ message: "Keranjang kosong" });

      const meja = await ensureMejaExists(id_meja);
      if (!meja) return res.status(404).json({ message: "Data meja tidak ditemukan" });

      const aktif = await hasActivePesanan(id_meja);
      if (aktif) return res.redirect(`/pesanan/status/${id_meja}`);

      const totalHarga = items.reduce((sum, i) => sum + i.total_harga, 0);

      const lastOrder = await Pesanan.findOne({
        where: { id_pesanan: { [Op.like]: 'PSN%' } },
        order: [['id_pesanan', 'DESC']],
      });

      let lastNumber = 0;
      if (lastOrder && /^PSN\d+$/.test(lastOrder.id_pesanan)) {
        lastNumber = parseInt(lastOrder.id_pesanan.replace('PSN', ''), 10);
      }
      const id_pesanan = 'PSN' + String(lastNumber + 1).padStart(4, '0');

      await Pesanan.create({
        id_pesanan,
        tanggal_pesan: new Date(new Date().getTime() + 7 * 60 * 60 * 1000),
        status_pesanan: "Menunggu Pembayaran",
        total_harga: totalHarga,
        id_meja,
      });

      for (const i of items) {
        const lastCart = await Keranjang.findOne({
          where: { id_keranjang: { [Op.like]: 'KRJ%' } },
          order: [['id_keranjang', 'DESC']],
        });

        let lastCartNumber = 0;
        if (lastCart && /^KRJ\d+$/.test(lastCart.id_keranjang)) {
          lastCartNumber = parseInt(lastCart.id_keranjang.replace('KRJ', ''), 10);
        }

        const id_keranjang = 'KRJ' + String(lastCartNumber + 1).padStart(4, '0');

        await Keranjang.create({
          id_keranjang,
          id_menu: i.id_menu,
          jumlah: i.jumlah,
          total_harga: i.total_harga,
          id_pesanan,
        });
      }

      req.session.keranjang = [];

      res.json({ success: true, id_meja });
    } catch (err) {
      console.error("Checkout error:", err);
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new KeranjangController();
