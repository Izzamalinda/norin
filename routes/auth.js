const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");       // Untuk hash jawaban & password
const { User } = require("../models");

router.get("/loginAdmin", (req, res) => {
  console.log("✅ /loginAdmin kepanggil"); // debug
  res.render("loginAdmin", { title: "Norin Cafe", error: null });
});

// ==================== LOGIN ====================
router.post("/loginAdmin", async (req, res) => {
  const { username, password, remember } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.render("loginAdmin", { title: "Norin Cafe", error: "User tidak ditemukan!" });
    }

    const storedPassword = user.password;

    let passwordMatch = false;

    // cek apakah password di DB tampak seperti hash bcrypt
    if (storedPassword.startsWith("$2b$") || storedPassword.startsWith("$2a$")) {
      passwordMatch = await bcrypt.compare(password, storedPassword);
    } else {
      passwordMatch = password === storedPassword;
    }

    if (!passwordMatch) {
      return res.render("loginAdmin", { title: "Norin Cafe", error: "Password salah!" });
    }

    // Set session
    req.session.user = { id: user.id, username: user.username };
    if (remember === "yes") {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 7; // 7 hari
    } else {
      req.session.cookie.expires = false;
    }

    return res.redirect("/admin");
  } catch (err) {
    console.error("🔥 Login error detail:", err);
    res.status(500).send("Internal Server Error, cek console!");
  }
});

// 👉 Render halaman lupa password
router.get("/forgotpasswordAdmin", (req, res) => {
  res.render("forgotpasswordAdmin");
});

// 👉 Ambil pertanyaan keamanan berdasarkan username
router.get("/getSecurityQuestion", async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: "Username wajib diisi!" });

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ error: "User tidak ditemukan!" });

    res.json({ securityQuestion: user.security_question });
  } catch (err) {
    console.error("🔥 Error ambil security question:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// 👉 Verifikasi jawaban + reset password
router.post("/forgotpasswordAdmin", async (req, res) => {
  console.log("🔥 Route /forgotpasswordAdmin kepanggil");   // debug
  console.log("📩 req.body:", req.body);                   // debug
  
  const { username, answer, newPassword } = req.body;

  if (!username || !answer || !newPassword) {
    return res.status(400).json({ error: "Semua field wajib diisi!" });
  }

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ error: "User tidak ditemukan!" });

    // 🔑 cek jawaban keamanan (karena masih plaintext di DB)
    const isMatch = answer.trim().toLowerCase() === user.security_answer.trim().toLowerCase();
    if (!isMatch) return res.status(400).json({ error: "Jawaban keamanan salah!" });

    // 🔑 update password (sekarang juga plaintext biar konsisten dengan DB kamu)
    user.password = newPassword;  
    await user.save();

    res.json({ message: "Password berhasil direset, silahkan login kembali." });
  } catch (err) {
    console.error("🔥 Error reset password:", err);
    res.status(500).json({ error: "Server error" });
  }
});



// ==================== LOGOUT ====================
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).send("Gagal logout!");
    }
    res.clearCookie("connect.sid"); // hapus cookie session
    return res.redirect("/loginAdmin"); // arahkan ke login lagi
  });
});


module.exports = router;
