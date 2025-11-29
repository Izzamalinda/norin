const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.get("/loginAdmin", authController.getLoginAdmin);
router.post("/loginAdmin", authController.postLoginAdmin);

router.get("/forgotpasswordAdmin", authController.getForgotPasswordAdmin);
router.get("/getSecurityQuestion", authController.getSecurityQuestion);
router.post("/forgotpasswordAdmin", authController.postForgotPasswordAdmin);

router.get("/logout", authController.logout);

module.exports = router;
