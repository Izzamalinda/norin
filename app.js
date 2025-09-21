const express = require("express");
const path = require("path");
const ejs = require("ejs");
const authRoutes = require("./routes/auth"); 
const sequelize = require("./config/db");  // koneksi db
require("dotenv").config(); // load .env
const session = require("express-session"); // 🔑 taruh require di atas

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: "norincafe-secret", // ganti dengan string random panjang
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // secure:false karena kita pakai http, bukan https
}));

app.get("/", (req, res) => {
  res.redirect("/loginAdmin");
});

app.use("/", authRoutes);  // <-- aktifkan login
// app.use("/admin", adminRoutes); // ini aktif nanti setelah ada adminRoutes

const adminRoutes = require("./routes/admin");
app.use("/admin", adminRoutes);

const userRoutes = require("./routes/user");
app.use("/", userRoutes);   // akses lewat /menu

sequelize.sync()
  .then(() => {
    console.log("Database & tables created!");
    app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
  })
  .catch(err => console.error("DB Sync error:", err));
