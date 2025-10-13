const express = require("express");
const path = require("path");
const ejs = require("ejs");
const session = require("express-session");

require("dotenv").config();

const { sequelize } = require("./models"); // pakai models/index.js

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const keranjangRoutes = require("./routes/keranjang");
const keranjangViewRoutes = require("./routes/keranjangView");
const mejaRoutes = require('./routes/meja');
const pesananRoutes = require("./routes/pesanan");


const app = express();
const PORT = process.env.PORT || 3000;

// ========== Setup view engine ==========
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========== Middleware ==========
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "norincafe-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  })
);

// ========== Routes ==========
app.get("/", (req, res) => {
  res.redirect("/loginAdmin");
});

app.use("/", authRoutes);
app.use("/admin", adminRoutes);
app.use("/", userRoutes);
app.use("/keranjang", keranjangRoutes);
app.use("/keranjang/view", keranjangViewRoutes);
app.use('/meja', mejaRoutes);
app.use("/pesanan", pesananRoutes);

// ========== DB Sync & Server ==========
sequelize
  .sync()
  .then(() => {
    console.log("✅ Database & tables created!");
    app.listen(PORT, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("🔥 DB Sync error:", err));
