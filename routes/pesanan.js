const express = require("express");
const router = express.Router();
const pesananController = require("../controllers/pesananController");

router.get("/status/:id_meja", pesananController.getPesananByMeja.bind(pesananController));
router.get("/jumlah-pesanan", pesananController.getJumlahPesanan.bind(pesananController));

module.exports = router;