const express = require("express");
const router = express.Router();
const keranjangController = require("../controllers/keranjangController");

router.post("/add", keranjangController.addToKeranjang.bind(keranjangController));
router.patch("/update", keranjangController.updateJumlah.bind(keranjangController));
router.delete("/:id_menu", keranjangController.deleteItem.bind(keranjangController));
router.post("/checkout", keranjangController.checkout.bind(keranjangController));
router.patch("/catatan", keranjangController.updateCatatan.bind(keranjangController));



module.exports = router;
