const express = require("express");
const router = express.Router();
const menuUserController = require("../controllers/menuUserController");

// ✅ Halaman utama menu (mendukung ?meja=5)
router.get("/menu", async (req, res) => {
  try {
    const id_meja = req.query.meja || null;

    // simpan ke session biar backend tahu meja ini
    if (id_meja) {
      req.session.id_meja = id_meja;
      console.log("🪑 ID Meja disimpan di session:", id_meja);
    }

    // ambil semua data menu dari controller
    const allMenu = await menuUserController.getAllMenuData();

    // kirim ke EJS
    res.render("user/menuUser", { 
      title: "Menu Restoran", 
      menus: allMenu,
      id_meja: id_meja || req.session.id_meja || null
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
