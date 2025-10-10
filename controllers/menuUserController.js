const { Menu } = require("../models");
const { Op } = require("sequelize");

// ===============================
// 🧩 Ambil semua menu & render halaman user
// ===============================
exports.getAllMenu = async (req, res) => {
  try {
    const no_meja = req.query.meja || null; // dari QR code (contoh: /menu?meja=5)
    const menus = await Menu.findAll({
      where: { status_menu: "available" },
      order: [["nama", "ASC"]],
    });

    res.render("user/menuUser", { 
      menus,
      no_meja, // dikirim ke view supaya bisa tampil "Anda sedang memesan dari Meja 5"
      keyword: null 
    });
  } catch (error) {
    console.error(error);
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
