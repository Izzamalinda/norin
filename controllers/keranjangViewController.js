// controllers/keranjangViewController.js
const { Keranjang, Menu } = require("../models");

exports.showKeranjang = async (req, res) => {
  try {
    const keranjang = await Keranjang.findAll({
      include: [{ model: Menu }],
      order: [["id_keranjang", "ASC"]],
    });

    const totalHarga = keranjang.reduce((sum, item) => {
      return sum + item.jumlah * (item.Menu ? item.Menu.harga : 0);
    }, 0);

    res.render("user/keranjang", { keranjang, totalHarga });
  } catch (err) {
    res.status(500).send("Terjadi kesalahan: " + err.message);
  }
};
