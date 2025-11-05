const express = require("express");
const router = express.Router();
const pesananController = require("../controllers/pesananController");

router.get("/status/:id_meja", pesananController.getPesananByMeja);

module.exports = router;