const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");
const upload = require("../config/multer-menu");
const dashboardController = require("../controllers/dashboardController");
const pesananController = require("../controllers/pesananController");

function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/loginAdmin");
  }
  next();
}

router.get("/dashboard", checkAuth, (req, res) => {
  res.render("dashboardAdmin", { 
    user: req.session.user,
    title: "Dashboard Admin"
  });
});

// redirect default
router.get("/", checkAuth, (req, res) => {
  res.redirect("/admin/dashboard");
});

// ===============================
//  Kelola Menu
// ===============================
router.get("/kelola-menu", checkAuth, menuController.getAll.bind(menuController));
router.post("/kelola-menu", checkAuth, upload.single("foto"), menuController.create.bind(menuController));
router.post("/kelola-menu/:id/update", checkAuth, upload.single("foto"), menuController.update.bind(menuController));
router.post("/kelola-menu/:id/delete", checkAuth, menuController.delete.bind(menuController));

// ===============================
//  Pesanan Admin
// ===============================
router.get("/daftar-pesanan", checkAuth, pesananController.getAllPesanan.bind(pesananController));
router.post("/daftar-pesanan/:id_pesanan/update", checkAuth, pesananController.updateStatus.bind(pesananController));

// ===============================
//  API Dashboard
// ===============================
router.get("/api/dashboard/summary", checkAuth, dashboardController.getSummary.bind(dashboardController));
router.get("/api/dashboard/sales", checkAuth, dashboardController.getSalesAnalytics.bind(dashboardController));
router.get("/api/dashboard/top-menus", checkAuth, dashboardController.getTopMenus.bind(dashboardController));
router.get("/api/dashboard/recent-activities", checkAuth, dashboardController.getRecentActivities.bind(dashboardController));
router.post("/api/dashboard/actions/menu", checkAuth, dashboardController.createMenuQuick.bind(dashboardController));

module.exports = router;
