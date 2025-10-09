const express = require("express");
const router = express.Router();
const keranjangController = require("../controllers/keranjangController");

router.get("/", keranjangController.getKeranjang);
router.post("/add", keranjangController.addToKeranjang);
router.patch("/update", keranjangController.updateJumlah);
router.delete("/:id_menu", keranjangController.deleteItem);
router.post("/checkout", keranjangController.checkout);


module.exports = router;
