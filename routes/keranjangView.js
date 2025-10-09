const express = require("express");
const router = express.Router();
const keranjangViewController = require("../controllers/keranjangViewController");

router.get("/", keranjangViewController.showKeranjang);

module.exports = router;
