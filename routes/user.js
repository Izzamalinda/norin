const express = require("express");
const router = express.Router();
const menuUserController = require("../controllers/menuUserController");

// Halaman menu untuk user
router.get("/menu", menuUserController.getAllMenu);

router.get("/menu/:id", menuUserController.getMenuById);

// Pencarian menu
router.get("/menu/search/find", menuUserController.searchMenu);

// Filter kategori
router.get("/menu/kategori/:kategori", menuUserController.getMenuByCategory);

module.exports = router;
