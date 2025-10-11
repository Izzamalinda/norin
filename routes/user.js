const express = require("express");
const router = express.Router();
const menuUserController = require("../controllers/menuUserController");

// ✅ Halaman utama menu (mendukung ?meja=5)
router.get("/menu", async (req, res) => {
  try {
    const no_meja = req.query.meja || null;

    // ambil semua data menu (kita buat method tambahan di controller)
    const allMenu = await menuUserController.getAllMenuData();

    res.render("user/menuUser", { 
      title: "Menu Restoran", 
      menus: allMenu,
      no_meja // kirim ke EJS agar bisa tampil di halaman
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Gagal memuat halaman menu.");
  }
});

// ✅ Detail menu
router.get("/menu/:id", menuUserController.getMenuById);

// ✅ Pencarian menu
router.get("/menu/search/find", menuUserController.searchMenu);

// ✅ Filter kategori
router.get("/menu/kategori/:kategori", menuUserController.getMenuByCategory);

module.exports = router;
