const { Keranjang, Pesanan, Menu } = require("../models");
const { v4: uuidv4 } = require("uuid");

// GET semua item keranjang
exports.getKeranjang = async (req, res) => {
  try {
    const keranjang = await Keranjang.findAll({
      include: [{ model: Menu }],
    });
    res.json(keranjang);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST tambah ke keranjang
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
    }

    res.json({ message: "Berhasil menambah ke keranjang" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH ubah jumlah item
exports.updateJumlah = async (req, res) => {
  try {
    const { id_menu, action } = req.body;
    const item = await Keranjang.findOne({ where: { id_menu } });

    if (!item) return res.status(404).json({ message: "Item tidak ditemukan" });

    if (action === "tambah") item.jumlah += 1;
    else if (action === "kurang") item.jumlah -= 1;

    if (item.jumlah <= 0) {
      await item.destroy();
      return res.json({ message: "Item dihapus dari keranjang" });
    }

    await item.save();
    res.json({ message: "Jumlah diperbarui", jumlah: item.jumlah });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE hapus item dari keranjang
exports.deleteItem = async (req, res) => {
  try {
    const { id_menu } = req.params;
    await Keranjang.destroy({ where: { id_menu } });
    res.json({ message: "Item dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==================== CHECKOUT ====================
exports.checkout = async (req, res) => {
  try {
    // Ambil semua data dari tabel keranjang
    const keranjang = await Keranjang.findAll({ include: [{ model: Menu }] });

    if (keranjang.length === 0) {
      return res.status(400).json({ message: "Keranjang masih kosong" });
    }

    // Hitung total harga
    const totalHarga = keranjang.reduce((sum, item) => {
      return sum + item.jumlah * (item.Menu ? item.Menu.harga : 0);
    }, 0);

    // Buat id_pesanan unik
    const id_pesanan = uuidv4();

    // Simpan ke tabel pesanan
    await Pesanan.create({
      id_pesanan,
      tanggal_pesan: new Date(),
      status_pesanan: "Menunggu Konfirmasi",
      id_meja: "M001", // sementara, nanti bisa diganti sesuai QR meja
      id_keranjang: null, // karena 1 pesanan bisa punya banyak item
    });

    // Kosongkan keranjang setelah checkout
    await Keranjang.destroy({ where: {} });

    console.log("✅ Pesanan berhasil disimpan:", id_pesanan);
    res.json({
      message: "Pesanan berhasil dibuat",
      id_pesanan,
      totalHarga,
    });
  } catch (err) {
    console.error("❌ Error checkout:", err);
    res.status(500).json({ error: err.message });
  }
};

