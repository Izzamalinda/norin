const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");
const upload = require("../config/multer-menu");

function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/loginAdmin");
  }
  next();
}

router.get("/", checkAuth, (req, res) => {
  res.render("dashboardAdmin", { title: "Dashboard Admin" });
});

// Kelola menu
router.get("/kelola-menu", checkAuth, menuController.getAll);
router.post("/kelola-menu", upload.single("foto"), menuController.create);
router.post("/kelola-menu/:id/update", upload.single("foto"), menuController.update);
router.post("/kelola-menu/:id/delete", menuController.delete);

module.exports = router;
