// controllers/keranjangController.js
const { Keranjang, Menu, Pesanan, Meja } = require("../models");
const { v4: uuidv4 } = require("uuid");

// GET semua item (JSON) - optional
exports.getKeranjang = async (req, res) => {
  try {
    const keranjang = await Keranjang.findAll({ include: [{ model: Menu }] });
    res.json(keranjang);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tambah ke keranjang -> kembalikan jumlah
exports.addToKeranjang = async (req, res) => {
  try {
    const { id_menu } = req.body;
    let item = await Keranjang.findOne({ where: { id_menu } });

    if (item) {
      item.jumlah += 1;
      await item.save();
    } else {
      await Keranjang.create({
        id_keranjang: uuidv4(),
        id_menu,
        jumlah: 1,
      });
      item = await Keranjang.findOne({ where: { id_menu } });
    }

    // kembalikan jumlah terbaru
    res.json({ success: true, jumlah: item.jumlah });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Ubah jumlah item
exports.updateJumlah = async (req, res) => {
  try {
    const { id_menu, action } = req.body;
    const item = await Keranjang.findOne({ where: { id_menu } });

    if (!item) return res.status(404).json({ message: "Item tidak ditemukan" });

    if (action === "tambah") item.jumlah += 1;
    else if (action === "kurang") item.jumlah -= 1;

    if (item.jumlah <= 0) {
      await item.destroy();
      return res.json({ success: true, removed: true });
    }

    await item.save();
    res.json({ success: true, jumlah: item.jumlah });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Hapus item
exports.deleteItem = async (req, res) => {
  try {
    const { id_menu } = req.params;
    await Keranjang.destroy({ where: { id_menu } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkout = async (req, res) => {
  try {
    const keranjang = await Keranjang.findAll({ include: [{ model: Menu }] });

    if (!keranjang || keranjang.length === 0) {
      return res.status(400).json({ message: "Keranjang masih kosong" });
    }

    // pastikan ada id_meja dari session
    let id_meja_to_use = null;
    if (req.session && req.session.id_meja) {
      id_meja_to_use = req.session.id_meja;
    } else {
      let meja = await Meja.findOne({ where: { no_meja: 1 } });
      if (!meja) {
        meja = await Meja.create({
          id_meja: "M001",
          no_meja: 1,
          qr_code: `/uploads/qrcode/meja-1.png`,
        });
      }
      id_meja_to_use = meja.id_meja;
    }

    // hitung total harga
    const totalHarga = keranjang.reduce(
      (sum, it) => sum + it.jumlah * (it.Menu ? it.Menu.harga : 0),
      0
    );

    // buat pesanan baru
    const id_pesanan = uuidv4();
    const pesananBaru = await Pesanan.create({
      id_pesanan,
      tanggal_pesan: new Date(),
      status_pesanan: "Menunggu Pembayaran",
      id_meja: id_meja_to_use,
    });

    // hubungkan semua item keranjang ke pesanan baru
    for (const item of keranjang) {
      item.id_pesanan = id_pesanan;
      await item.save();
    }

    // jika kamu ingin simpan id_keranjang pertama ke pesanan
    if (keranjang[0]) {
      await pesananBaru.update({ id_keranjang: keranjang[0].id_keranjang });
    }

    res.redirect(`/pesanan/status/${id_meja_to_use}`);

    res.json({
      success: true,
      id_pesanan,
      totalHarga,
      message: "Checkout berhasil!",
    });
  } catch (err) {
    console.error("❌ Error checkout:", err);
    res.status(500).json({ error: err.message });
  }
};

