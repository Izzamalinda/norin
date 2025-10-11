// controllers/dashboardController.js
const { QueryTypes } = require("sequelize");
const { sequelize, Menu, Pesanan, Keranjang } = require("../models");
const moment = require("moment");

// === Render Dashboard ===
function renderDashboard(req, res) {
  res.render("dashboardAdmin", { title: "Dashboard" });
}

// === Summary (Card Atas Dashboard) ===
async function getSummary(req, res) {
  try {
    const today = moment().format("YYYY-MM-DD");

    // Revenue hari ini: untuk tiap pesanan ambil total dari keranjang (jika id_keranjang ada).
    // Jika tidak ada id_keranjang maka kontribusi = 0.
    const q2 = await sequelize.query(
      `
      SELECT COALESCE(SUM(
        COALESCE((
          SELECT COALESCE(SUM(k2.jumlah * m2.harga), 0)
          FROM keranjang k2
          JOIN menu m2 ON k2.id_menu = m2.id_menu
          WHERE k2.id_keranjang = p.id_keranjang
        ), 0)
      ), 0) AS revenue
      FROM pesanan p
      WHERE DATE(p.tanggal_pesan) = :today
        AND p.status_pesanan IN ('Selesai','Completed','completed')
      `,
      { replacements: { today }, type: QueryTypes.SELECT }
    );

    const revenueToday = Number(q2[0].revenue || 0);

    const totalPesanan = await Pesanan.count();

    let menuAktif = 0;
    try {
      menuAktif = await Menu.count({ where: { status_menu: "available" } });
    } catch {
      menuAktif = await Menu.count();
    }

    const q3 = await sequelize.query(
      `SELECT COUNT(DISTINCT id_meja) AS cnt 
       FROM pesanan
       WHERE DATE(tanggal_pesan) = CURDATE()
         AND status_pesanan IN ('Menunggu Konfirmasi','Diproses','Selesai')`,
      { type: QueryTypes.SELECT }
    );

    const customerAktif = q3[0].cnt || 0;

    return res.json({
      success: true,
      data: { revenueToday, totalPesanan, menuAktif, customerAktif },
    });
  } catch (err) {
    console.error("getSummary error", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
}

// === Sales Analytics (Penjualan n Hari) ===
async function getSalesAnalytics(req, res) {
  try {
    const range = parseInt(req.query.range) || 7;
    const days = [];
    for (let i = range - 1; i >= 0; i--) {
      days.push(moment().subtract(i, "days").format("YYYY-MM-DD"));
    }
    const start = days[0];
    const end = days[days.length - 1];

    // Ambil revenue per tanggal: untuk setiap pesanan hitung total dari keranjang (jika ada)
    const rows = await sequelize.query(
      `
      SELECT t.date, COALESCE(SUM(t.order_total),0) AS revenue
      FROM (
        SELECT DATE(p.tanggal_pesan) AS date,
          (SELECT COALESCE(SUM(k2.jumlah * m2.harga), 0)
           FROM keranjang k2
           JOIN menu m2 ON k2.id_menu = m2.id_menu
           WHERE k2.id_keranjang = p.id_keranjang
          ) AS order_total
        FROM pesanan p
        WHERE DATE(p.tanggal_pesan) BETWEEN :start AND :end
          AND p.status_pesanan IN ('Selesai','Completed','completed')
      ) t
      GROUP BY t.date
      ORDER BY t.date ASC
      `,
      {
        replacements: { start, end },
        type: QueryTypes.SELECT,
      }
    );

    console.log("📊 SALES ANALYTICS RAW:", rows);

    const map = {};
    rows.forEach((r) => {
      map[r.date] = Number(r.revenue);
    });

    const series = days.map((d) => ({ date: d, revenue: map[d] || 0 }));

    return res.json({ success: true, data: { series } });
  } catch (err) {
    console.error("getSalesAnalytics", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// === Top Categories (Kategori Terlaris) ===
async function getTopCategories(req, res) {
  try {
    const days = parseInt(req.query.days) || 30;
    const start = moment().subtract(days, "days").format("YYYY-MM-DD");
    const end = moment().format("YYYY-MM-DD");

    // Hitung kategori terlaris berdasarkan pesanan yang memiliki id_keranjang (jika tidak ada, tidak dihitung)
    const rows = await sequelize.query(
      `
      SELECT m.kategori, COALESCE(SUM(k.jumlah),0) as total_sold
      FROM pesanan p
      JOIN keranjang k ON p.id_keranjang = k.id_keranjang
      JOIN menu m ON k.id_menu = m.id_menu
      WHERE DATE(p.tanggal_pesan) BETWEEN :start AND DATE_ADD(:end, INTERVAL 1 DAY)
        AND p.status_pesanan IN ('Selesai','Completed','completed')
      GROUP BY m.kategori
      ORDER BY total_sold DESC
      LIMIT 10
      `,
      {
        replacements: { start, end },
        type: QueryTypes.SELECT,
      }
    );

    console.log("🏷️ TOP CATEGORIES RAW:", rows);

    const result = rows.map((r) => ({
      kategori: r.kategori,
      total: Number(r.total_sold),
    }));

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("getTopCategories", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// === Recent Activities (Pesanan Terbaru) ===
const getRecentActivities = async (req, res) => {
  try {
    const limit = req.query.limit || 5;

    const recent = await sequelize.query(
      `
      SELECT 
        p.id_pesanan,
        DATE_FORMAT(p.tanggal_pesan, '%d/%m/%Y %H:%i') AS tanggal,
        p.status_pesanan AS status,
        COALESCE(pfh.order_total, COALESCE(SUM(k.jumlah * m.harga), 0)) AS total_amount,
        GROUP_CONCAT(CONCAT(m.nama, ' x', k.jumlah) SEPARATOR ', ') AS items,
        meja.no_meja AS nomor_meja
      FROM pesanan p
      LEFT JOIN keranjang k ON p.id_keranjang = k.id_keranjang
      LEFT JOIN menu m ON k.id_menu = m.id_menu
      LEFT JOIN meja ON meja.id_meja = p.id_meja
      LEFT JOIN (
        SELECT p2.id_pesanan, 
          (SELECT COALESCE(SUM(k2.jumlah * m2.harga),0)
           FROM keranjang k2 JOIN menu m2 ON k2.id_menu = m2.id_menu
           WHERE k2.id_keranjang = p2.id_keranjang
          ) AS order_total
        FROM pesanan p2
      ) pfh ON pfh.id_pesanan = p.id_pesanan
      GROUP BY p.id_pesanan, p.tanggal_pesan, p.status_pesanan, pfh.order_total, meja.no_meja
      ORDER BY p.tanggal_pesan DESC
      LIMIT :limit
      `,
      {
        replacements: { limit: Number(limit) },
        type: QueryTypes.SELECT,
      }
    );

    res.json({ success: true, data: recent });
  } catch (err) {
    console.error("❌ Error getRecentActivities:", err);
    res.json({ success: false, data: [] });
  }
};

// === Quick Action: Tambah Menu ===
async function createMenuQuick(req, res) {
  try {
    const { nama, harga, kategori, deskripsi } = req.body;
    if (!nama || !harga)
      return res
        .status(400)
        .json({ success: false, message: "nama & harga required" });

    const newMenu = await Menu.create({
      nama,
      harga,
      kategori,
      deskripsi,
      status_menu: "aktif",
      foto: "",
    });

    return res.json({ success: true, data: newMenu });
  } catch (err) {
    console.error("createMenuQuick", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// === Render Halaman Penjualan ===
function renderPenjualan(req, res) {
  res.render("penjualanAdmin", { title: "Laporan Penjualan" });
}

// === API: Laporan Penjualan (Bisa filter range) ===
async function getLaporanPenjualan(req, res) {
  try {
    const range = req.query.range || "7"; // default 7 hari
    let startDate = null;

    if (range === "30") {
      startDate = moment().subtract(30, "days").format("YYYY-MM-DD");
    } else if (range === "365") {
      startDate = moment().subtract(365, "days").format("YYYY-MM-DD");
    } else {
      startDate = moment().subtract(7, "days").format("YYYY-MM-DD");
    }

    const rows = await sequelize.query(
      `
      SELECT 
        DATE(p.tanggal_pesan) AS tanggal,
        COUNT(DISTINCT p.id_pesanan) AS total_pesanan,
        COALESCE(SUM(kagg.total_qty), 0) AS total_item,
        COALESCE(SUM(kagg.total_revenue), 0) AS total_pendapatan
      FROM pesanan p
      LEFT JOIN (
        SELECT k2.id_keranjang, 
          SUM(k2.jumlah) AS total_qty,
          SUM(k2.jumlah * m2.harga) AS total_revenue
        FROM keranjang k2
        JOIN menu m2 ON k2.id_menu = m2.id_menu
        GROUP BY k2.id_keranjang
      ) kagg ON kagg.id_keranjang = p.id_keranjang
      WHERE DATE(p.tanggal_pesan) >= :startDate
        AND p.status_pesanan IN ('Selesai', 'Completed', 'completed')
      GROUP BY DATE(p.tanggal_pesan)
      ORDER BY tanggal DESC
      `,
      {
        replacements: { startDate },
        type: QueryTypes.SELECT,
      }
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("❌ getLaporanPenjualan:", err);
    res.json({ success: false, data: [] });
  }
}

module.exports = {
  renderDashboard,
  getSummary,
  getSalesAnalytics,
  getTopCategories,
  getRecentActivities,
  createMenuQuick,
  renderPenjualan,
  getLaporanPenjualan,
};
