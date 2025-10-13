const express = require("express");
const router = express.Router();
const pesananController = require("../controllers/pesananController");

// ✅ Route untuk melihat status pesanan berdasarkan id_meja
router.get("/status/:id_meja", pesananController.getPesananByMeja);

module.exports = router;