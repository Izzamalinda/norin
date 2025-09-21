const express = require("express");
const router = express.Router();

function checkAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/loginAdmin");
  }
  next();
}

router.get("/", checkAuth, (req, res) => {
  res.render("dashboardAdmin", { title: "Dashboard Admin" });
});



module.exports = router;
