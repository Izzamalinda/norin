const { Menu, Meja } = require("../models");
const { Op } = require("sequelize");

// 🔹 Helper untuk hitung jumlah kategori
async function getKategoriCount() {
  const makananCount = await Menu.count({ where: { kategori: { [Op.like]: "%Makanan%" } } });
  const minumanCount = await Menu.count({ where: { kategori: { [Op.like]: "%Minuman%" } } });
  const cemilanCount = await Menu.count({ where: { kategori: { [Op.like]: "%Cemilan%" } } });
  return { makananCount, minumanCount, cemilanCount };
}

// ===============================
// 🧩 Halaman utama menu
// ===============================
exports.getAllMenu = async (req, res) => {
  try {
    const mejaQuery = req.query.meja;
    if (mejaQuery) {
      let meja = await Meja.findOne({ where: { no_meja: mejaQuery } });
      if (!meja) {
        const id_meja = "M" + String(mejaQuery).padStart(3, "0");
        const qr_path = `/uploads/qrcode/meja-${mejaQuery}.png`;
        meja = await Meja.create({ id_meja, no_meja: mejaQuery, qr_code: qr_path });
      }
      req.session.id_meja = meja.id_meja;
    }

    const menus = await Menu.findAll({
      where: { status_menu: "available" },
      order: [["nama", "ASC"]],
    });

    const { makananCount, minumanCount, cemilanCount } = await getKategoriCount();

    res.render("user/menuUser", {
      menus,
      no_meja: req.session.id_meja || null,
      keranjang: req.session.keranjang || [],
      makananCount,
      minumanCount,
      cemilanCount,
      keyword: null,
    });
  } catch (error) {
    console.error("❌ getAllMenu:", error);
    res.status(500).send("Terjadi kesalahan: " + error.message);
  }
};

// ===============================
// 🧩 Filter menu berdasarkan kategori
// ===============================
exports.getMenuByCategory = async (req, res) => {
  try {
    const { kategori } = req.params;
    const no_meja = req.query.meja || req.session.id_meja || null;

    const menus = await Menu.findAll({
      where: {
        kategori: { [Op.substring]: kategori.charAt(0).toUpperCase() + kategori.slice(1).toLowerCase() }
, // Sesuai kolom kategori di tabel Menu
        status_menu: "available",
      },
      order: [["nama", "ASC"]],
    });

    const { makananCount, minumanCount, cemilanCount } = await getKategoriCount();

    res.render("user/menuUser", {
      menus,
      keyword: null,
      no_meja,
      makananCount,
      minumanCount,
      cemilanCount,
      keranjang: req.session.keranjang || [],
    });
  } catch (error) {
    console.error("❌ getMenuByCategory:", error);
    res.status(500).send("Terjadi kesalahan: " + error.message);
  }
};

// ===============================
// 🧩 Pencarian menu
// ===============================
exports.searchMenu = async (req, res) => {
  try {
    const { keyword } = req.query;
    const no_meja = req.query.meja || req.session.id_meja || null;

    const menus = await Menu.findAll({
      where: {
        nama: { [Op.like]: `%${keyword}%` },
        status_menu: "available",
      },
      order: [["nama", "ASC"]],
    });

    const { makananCount, minumanCount, cemilanCount } = await getKategoriCount();

    res.render("user/menuUser", {
      menus,
      keyword,
      no_meja,
      makananCount,
      minumanCount,
      cemilanCount,
      keranjang: req.session.keranjang || [],
    });
  } catch (error) {
    console.error("❌ searchMenu:", error);
    res.status(500).send("Terjadi kesalahan: " + error.message);
  }
};

// ===============================
// 🧩 Detail menu berdasarkan ID
// ===============================
exports.getMenuById = async (req, res) => {
  try {
    const { id } = req.params;
    const no_meja = req.query.meja || req.session.id_meja || null;

    const menu = await Menu.findOne({ where: { id_menu: id } });
    if (!menu) return res.status(404).send("Menu tidak ditemukan");

    res.render("user/menuDetail", { menu, no_meja });
  } catch (error) {
    res.status(500).send("Terjadi kesalahan: " + error.message);
  }
};
