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
    const { id_menu, id_meja } = req.body;
    if (!id_menu || !id_meja) {
      return res.status(400).json({ message: "id_menu dan id_meja wajib dikirim" });
    }

    let item = await Keranjang.findOne({ where: { id_menu, id_meja } });

    if (item) {
      item.jumlah += 1;
      await item.save();
    } else {
      await Keranjang.create({
        id_keranjang: uuidv4(),
        id_menu,
        jumlah: 1,
        id_meja, // 🟢 simpan id_meja di sini!
      });
      item = await Keranjang.findOne({ where: { id_menu, id_meja } });
    }

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
    console.log("===== CHECKOUT DIPANGGIL =====");
    console.log("📦 BODY DARI FRONTEND:", req.body);

    const id_meja_to_use = req.body.id_meja;
    if (!id_meja_to_use) {
      return res.status(400).json({ message: "ID meja wajib dikirim" });
    }
    console.log("🪑 id_meja diterima:", id_meja_to_use);

    // 🔹 Ambil keranjang khusus untuk meja ini
    const keranjangItems = await Keranjang.findAll({
      where: { id_meja: id_meja_to_use },
      include: [{ model: Menu }],
    });

    if (!keranjangItems || keranjangItems.length === 0) {
      console.log("🚫 Keranjang meja ini kosong");
      return res.status(400).json({ message: "Keranjang masih kosong untuk meja ini" });
    }

    // 🔸 Buat id_keranjang baru
    const newKeranjangId = uuidv4();

    // 🔸 Salin semua item ke id_keranjang baru (keranjang pesanan)
    for (const item of keranjangItems) {
      await Keranjang.create({
        id_keranjang: newKeranjangId,
        id_menu: item.id_menu,
        jumlah: item.jumlah,
        catatan: item.catatan || null,
      });
    }

    // 🔸 Hitung total & deskripsi
    let totalHarga = 0;
    let deskripsi = "";
    for (const item of keranjangItems) {
      const subtotal = item.jumlah * item.Menu.harga;
      totalHarga += subtotal;
      deskripsi += `${item.Menu.nama} x${item.jumlah}, `;
    }

    // 🔸 Buat pesanan
    const id_pesanan = uuidv4();
    await Pesanan.create({
      id_pesanan,
      tanggal_pesan: new Date(),
      status_pesanan: "Menunggu Konfirmasi",
      id_meja: id_meja_to_use,
      total_harga: totalHarga,
      deskripsi_pesanan: deskripsi,
      id_keranjang: newKeranjangId,
    });

    console.log("✅ Pesanan dibuat:", id_pesanan, "Total:", totalHarga);

    // 🔹 Hapus isi keranjang meja ini
    await Keranjang.destroy({ where: { id_meja: id_meja_to_use } });

    res.json({
      success: true,
      id_pesanan,
      id_meja: id_meja_to_use,
      totalHarga,
    });
  } catch (err) {
    console.error("❌ Error checkout:", err);
    res.status(500).json({ error: err.message });
  }
};
