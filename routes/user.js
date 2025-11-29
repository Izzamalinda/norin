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

router.get("/menu", menuUserController.getAllMenu.bind(menuUserController));
router.get("/menu/:id", menuUserController.getMenuById.bind(menuUserController));
router.get("/menu/search/find", menuUserController.searchMenu.bind(menuUserController));
router.get("/menu/kategori/:kategori", menuUserController.getMenuByCategory.bind(menuUserController));

module.exports = router;
