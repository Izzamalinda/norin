const express = require("express");
const router = express.Router();
const keranjangController = require("../controllers/keranjangController");

router.post("/add", keranjangController.addToKeranjang);
router.patch("/update", keranjangController.updateJumlah);
router.delete("/:id_menu", keranjangController.deleteItem);
router.post("/checkout", keranjangController.checkout);
// 📝 Tambah atau ubah catatan item
router.patch("/catatan", keranjangController.updateCatatan);



module.exports = router;
