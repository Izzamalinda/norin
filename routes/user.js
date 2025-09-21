const express = require("express");
const router = express.Router();

// Halaman menu untuk user
router.get("/menu", (req, res) => {
  res.render("menu", { title: "Menu Norin Cafe" });
});

module.exports = router;
