const { Menu, Meja } = require("../models");
const { Op } = require("sequelize");

// ===============================
// 🧩 Ambil semua menu & render halaman user
// ===============================
exports.getAllMenu = async (req, res) => {
  try {
    // bila ada query ?meja=3 dari QR, simpan id_meja ke session
    const mejaQuery = req.query.meja;
    if (mejaQuery) {
      // mejaQuery adalah nomor meja (angka atau string)
      let meja = await Meja.findOne({ where: { no_meja: mejaQuery } });
      if (!meja) {
        // buat id_meja yang konsisten (M001)
        const id_meja = "M" + String(mejaQuery).padStart(3, "0");
        // asumsikan file QR sudah dibuat bernama meja-<no_meja>.png
        const qr_path = `/uploads/qrcode/meja-${mejaQuery}.png`;
        meja = await Meja.create({ id_meja, no_meja: mejaQuery, qr_code: qr_path });
      }
      req.session.id_meja = meja.id_meja;
    }

    const menus = await Menu.findAll({
      where: { status_menu: "available" },
      order: [["nama", "ASC"]],
    });
    res.render("user/menuUser", { menus, no_meja: req.session.id_meja || null, keranjang: req.session.keranjang || [] });
  } catch (error) {
    res.status(500).send("Terjadi kesalahan: " + error.message);
  }
};

// ===============================
// 🧩 Ambil semua menu tanpa render (dipakai route lain, seperti QR code handler)
// ===============================
exports.getAllMenuData = async () => {
  try {
    const menus = await Menu.findAll({
      where: { status_menu: "available" },
      order: [["nama", "ASC"]],
    });
    return menus;
  } catch (error) {
    console.error("❌ Error mengambil data menu:", error);
    throw error;
  }
};

// ===============================
// 🧩 Detail menu berdasarkan ID
// ===============================
exports.getMenuById = async (req, res) => {
  try {
    const { id } = req.params;
    const no_meja = req.query.meja || null;

    const menu = await Menu.findOne({ where: { id_menu: id } });
    if (!menu) return res.status(404).send("Menu tidak ditemukan");

    res.render("user/menuDetail", { menu, no_meja });
  } catch (error) {
    res.status(500).send("Terjadi kesalahan: " + error.message);
  }
};

// ===============================
// 🧩 Pencarian menu
// ===============================
exports.searchMenu = async (req, res) => {
  try {
    const { keyword } = req.query;
    const no_meja = req.query.meja || null;

    const menus = await Menu.findAll({
      where: {
        nama: { [Op.like]: `%${keyword}%` },
        status_menu: "available",
      },
    });

    res.render("user/menuUser", { menus, keyword, no_meja });
  } catch (error) {
    res.status(500).send("Terjadi kesalahan: " + error.message);
  }
};

// ===============================
// 🧩 Filter menu berdasarkan kategori
// ===============================
exports.getMenuByCategory = async (req, res) => {
  try {
    const { kategori } = req.params;
    const no_meja = req.query.meja || null;

    const menus = await Menu.findAll({
      where: {
        kategori: { [Op.like]: `%${kategori}%` },
        status_menu: "available",
      },
    });

    res.render("user/menuUser", { menus, keyword: null, no_meja });
  } catch (error) {
    res.status(500).send("Terjadi kesalahan: " + error.message);
  }
};
