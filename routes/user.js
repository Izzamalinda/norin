const express = require("express");
const router = express.Router();
const menuUserController = require("../controllers/menuUserController");

// ✅ Tangkap query ?meja= dan simpan di session
router.get("/", async (req, res, next) => {
  try {
    const { meja } = req.query;
    if (meja) {
      req.session.no_meja = meja;
      console.log(`🪑 Meja aktif dari QR: ${meja}`);
    }
    next();
  } catch (err) {
    console.error("❌ Error session meja:", err);
    next();
  }
});

// ✅ Halaman utama menu
router.get("/menu", menuUserController.getAllMenu);

// ✅ Detail menu
router.get("/menu/:id", menuUserController.getMenuById);

// ✅ Pencarian menu
router.get("/menu/search/find", menuUserController.searchMenu);

// ✅ Filter kategori
router.get("/menu/kategori/:kategori", menuUserController.getMenuByCategory);

module.exports = router;
