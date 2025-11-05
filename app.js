const express = require("express");
const path = require("path");
const ejs = require("ejs");
const session = require("express-session");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const { sequelize } = require("./models");

// Import routes
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const keranjangRoutes = require("./routes/keranjang");
const keranjangViewRoutes = require("./routes/keranjangView");
const mejaRoutes = require("./routes/meja");
const pesananRoutes = require("./routes/pesanan");

const app = express();
const server = http.createServer(app);

// ✅ Aktifkan Socket.IO dan pisahkan namespace
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ================== Namespace khusus ==================
const adminNamespace = io.of("/admin");
const userNamespace = io.of("/user");

adminNamespace.on("connection", (socket) => {
  console.log("👑 Admin terhubung:", socket.id);
  socket.on("disconnect", () => console.log("❌ Admin terputus:", socket.id));
});

userNamespace.on("connection", (socket) => {
  console.log("🧑 User terhubung:", socket.id);
  socket.on("disconnect", () => console.log("❌ User terputus:", socket.id));
});


// Simpan di app agar controller bisa akses
app.set("io", io);
app.set("adminNamespace", adminNamespace);
app.set("userNamespace", userNamespace);

const PORT = process.env.PORT || 3000;

// ================== View engine ==================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ================== Middleware ==================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
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

// ================== Routes ==================
app.get("/", (req, res) => res.redirect("/loginAdmin"));

app.use("/", authRoutes);
app.use("/admin", adminRoutes);
app.use("/", userRoutes);
app.use("/keranjang", keranjangRoutes);
app.use("/keranjang/view", keranjangViewRoutes);
app.use("/meja", mejaRoutes);
app.use("/pesanan", pesananRoutes);

// ================== DB & Server ==================
sequelize
  .sync()
  .then(() => {
    console.log("✅ Database & tabel siap!");
    server.listen(PORT, () =>
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("🔥 DB Sync error:", err));
