// controllers/keranjangController.js
const { v4: uuidv4 } = require("uuid");
const { Menu, Pesanan, Keranjang } = require("../models");
const { ensureMejaExists, hasActivePesanan } = require("./mejaController");

// 🧺 Tambah ke keranjang (disimpan di session)
exports.addToKeranjang = async (req, res) => {
  try {
    const { id_menu } = req.body;
    const menu = await Menu.findByPk(id_menu);
    if (!menu) return res.status(404).json({ message: "Menu tidak ditemukan" });

    // Pastikan ada session keranjang
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
    console.error("❌ addToKeranjang:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🔁 Update jumlah item di keranjang session
exports.updateJumlah = async (req, res) => {
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
    res.status(500).json({ error: err.message });
  }
};

// ❌ Hapus item dari keranjang session
exports.deleteItem = async (req, res) => {
  const { id_menu } = req.params;
  if (!req.session.keranjang) return res.json({ success: false });

  req.session.keranjang = req.session.keranjang.filter(i => i.id_menu !== id_menu);
  res.json({ success: true });
};

// ✅ Checkout → simpan ke database
exports.checkout = async (req, res) => {
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
    const id_pesanan = uuidv4();

    await Pesanan.create({
      id_pesanan,
      tanggal_pesan: new Date(),
      status_pesanan: "Menunggu Pembayaran",
      total_harga: totalHarga,
      id_meja,
    });

    for (const i of items) {
      await Keranjang.create({
        id_keranjang: uuidv4(),
        id_menu: i.id_menu,
        jumlah: i.jumlah,
        total_harga: i.total_harga,
        id_pesanan,
      });
    }

    // Kosongkan keranjang setelah checkout
    req.session.keranjang = [];

    res.json({ success: true, id_meja });
  } catch (err) {
    console.error("❌ Checkout error:", err);
    res.status(500).json({ error: err.message });
  }
};
