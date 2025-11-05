const express = require("express");
const router = express.Router();
const menuUserController = require("../controllers/menuUserController");

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

router.get("/menu", menuUserController.getAllMenu);
router.get("/menu/:id", menuUserController.getMenuById);
router.get("/menu/search/find", menuUserController.searchMenu);
router.get("/menu/kategori/:kategori", menuUserController.getMenuByCategory);

module.exports = router;
