const express = require("express");
const router = express.Router();
const mejaController = require("../controllers/mejaController");

router.get("/list", mejaController.listMeja.bind(mejaController));
router.get("/generate", mejaController.renderGeneratePage.bind(mejaController));
router.post("/generate", mejaController.generateMeja.bind(mejaController));
router.post("/delete/:id", mejaController.deleteMeja.bind(mejaController));

module.exports = router;
