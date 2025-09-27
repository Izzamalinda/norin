const { Menu } = require("../models");
const { Op } = require("sequelize");

// GET semua menu yang tersedia
exports.getAllMenu = async (req, res) => {
  try {
    const menus = await Menu.findAll({
      where: { status_menu: "available" },
      order: [["nama", "ASC"]],
    });
    res.render("user/menuUser", { menus }); // render ke EJS
  } catch (error) {
    res.status(500).send("Terjadi kesalahan: " + error.message);
  }
};

// GET detail menu by id
exports.getMenuById = async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await Menu.findOne({ where: { id_menu: id } });

    if (!menu) return res.status(404).send("Menu tidak ditemukan");

    res.render("user/menuDetail", { menu });
  } catch (error) {
    res.status(500).send("Terjadi kesalahan: " + error.message);
  }
};

// Pencarian menu
exports.searchMenu = async (req, res) => {
  try {
    const { keyword } = req.query;
    const menus = await Menu.findAll({
      where: {
        nama: { [Op.like]: `%${keyword}%` },
        status_menu: "available",
      },
    });
    res.render("user/menuUser", { menus, keyword }); // kirim keyword ke view
  } catch (error) {
    res.status(500).send("Terjadi kesalahan: " + error.message);
  }
};


// Filter kategori
exports.getMenuByCategory = async (req, res) => {
  try {
    const { kategori } = req.params;
    const menus = await Menu.findAll({
      where: {
        kategori: { [Op.like]: `%${kategori}%` }, // disarankan pakai kolom kategori
        status_menu: "available",
      },
    });
    res.render("user/menuUser", { menus });
  } catch (error) {
    res.status(500).send("Terjadi kesalahan: " + error.message);
  }
};
