const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");
const upload = require("../config/multer-menu");
const dashboardController = require("../controllers/dashboardController");

function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/loginAdmin");
  }
  next();
}

// Dashboard langsung render dengan data
router.get("/", checkAuth, dashboardController.renderDashboard);

// Kelola menu
router.get("/kelola-menu", checkAuth, menuController.getAll);
router.post("/kelola-menu", upload.single("foto"), menuController.create);
router.post("/kelola-menu/:id/update", upload.single("foto"), menuController.update);
router.post("/kelola-menu/:id/delete", menuController.delete);

// API JSON tetap bisa
router.get("/api/dashboard/summary", checkAuth, dashboardController.getSummary);
router.get("/api/dashboard/sales", checkAuth, dashboardController.getSalesAnalytics);
router.get("/api/dashboard/top-categories", checkAuth, dashboardController.getTopCategories);
router.get("/api/dashboard/recent-activities", checkAuth, dashboardController.getRecentActivities);
router.post("/api/dashboard/actions/menu", checkAuth, dashboardController.createMenuQuick);

module.exports = router;
