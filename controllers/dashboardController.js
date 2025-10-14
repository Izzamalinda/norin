const { QueryTypes } = require("sequelize");
const { sequelize, Menu, Pesanan, Keranjang, User } = require("../models");
const moment = require("moment");

// === Render Dashboard ===
function renderDashboard(req, res) {
  res.render("dashboardAdmin", { title: "Dashboard" });
}

// === Summary (Card Atas Dashboard) ===
async function getSummary(req, res) {
  try {
    const today = moment().format("YYYY-MM-DD");

    const q2 = await sequelize.query(
      `SELECT COALESCE(SUM(k.jumlah * m.harga),0) AS revenue
       FROM pesanan p
       JOIN keranjang k ON p.id_pesanan = k.id_pesanan
       JOIN menu m ON k.id_menu = m.id_menu
       WHERE DATE(p.tanggal_pesan) = :today
         AND p.status_pesanan IN ('Selesai','Completed','completed')`,
      { replacements: { today }, type: QueryTypes.SELECT }
    );
    const revenueToday = q2[0].revenue || 0;

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
      WHERE status_pesanan IN ('Menunggu Pembayaran', 'Diproses')`,
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

// === Sales Analytics (Penjualan 7 Hari) ===
async function getSalesAnalytics(req, res) {
  try {
    const range = parseInt(req.query.range) || 7;
    const days = [];
    for (let i = range - 1; i >= 0; i--) {
      days.push(moment().subtract(i, "days").format("YYYY-MM-DD"));
    }

    const rows = await sequelize.query(
      `SELECT DATE(p.tanggal_pesan) as date, COALESCE(SUM(k.jumlah * m.harga),0) as revenue
       FROM pesanan p
       JOIN keranjang k ON p.id_pesanan = k.id_pesanan
       JOIN menu m ON k.id_menu = m.id_menu
       WHERE p.tanggal_pesan BETWEEN :start AND DATE_ADD(:end, INTERVAL 1 DAY)
       GROUP BY DATE(p.tanggal_pesan)`,
      {
        replacements: { start: days[0], end: days[days.length - 1] },
        type: QueryTypes.SELECT,
      }
    );

    console.log('📊 SALES ANALYTICS RAW:', rows);

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

// === Top Menus (Menu Terlaris) ===
async function getTopMenus(req, res) {
  try {
    const days = parseInt(req.query.days) || 30;
    const start = moment().subtract(days, "days").format("YYYY-MM-DD");

    const rows = await sequelize.query(
      `SELECT m.nama AS nama_menu, COALESCE(SUM(k.jumlah), 0) AS total_terjual
       FROM pesanan p
       JOIN keranjang k ON p.id_pesanan = k.id_pesanan
       JOIN menu m ON k.id_menu = m.id_menu
       WHERE p.tanggal_pesan BETWEEN :start AND DATE_ADD(:end, INTERVAL 1 DAY)
         AND p.status_pesanan IN ('Selesai', 'Completed', 'completed')
       GROUP BY m.nama
       ORDER BY total_terjual DESC
       LIMIT 5`,
      {
        replacements: { start, end: moment().format("YYYY-MM-DD") },
        type: QueryTypes.SELECT,
      }
    );

    console.log("🍰 TOP MENUS RAW:", rows);

    const result = rows.map(r => ({
      nama_menu: r.nama_menu,
      total_terjual: Number(r.total_terjual),
    }));

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error("getTopMenus", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}


// === Recent Activities (Pesanan Terbaru dengan Pagination) ===
async function getRecentActivities(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;   // halaman aktif
    const limit = parseInt(req.query.limit) || 5; // jumlah per halaman
    const offset = (page - 1) * limit;

    // Hitung total pesanan
    const countResult = await sequelize.query(
      `SELECT COUNT(DISTINCT id_pesanan) AS total FROM pesanan`,
      { type: QueryTypes.SELECT }
    );
    const totalData = countResult[0].total;
    const totalPages = Math.ceil(totalData / limit);

    // Ambil data per halaman
    const rows = await sequelize.query(
      `SELECT p.id_pesanan,
              p.tanggal_pesan,
              p.status_pesanan,
              COALESCE(SUM(k.jumlah * m.harga),0) AS total_amount,
              GROUP_CONCAT(CONCAT(m.nama, ' x', k.jumlah) SEPARATOR ', ') AS items
       FROM pesanan p
       LEFT JOIN keranjang k ON p.id_pesanan = k.id_pesanan
       LEFT JOIN menu m ON k.id_menu = m.id_menu
       GROUP BY p.id_pesanan, p.tanggal_pesan, p.status_pesanan
       ORDER BY p.tanggal_pesan DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { limit, offset }, type: QueryTypes.SELECT }
    );

    const activities = rows.map((r) => ({
      id_pesanan: r.id_pesanan,
      tanggal: r.tanggal_pesan,
      status: r.status_pesanan,
      total_amount: Number(r.total_amount),
      items: r.items,
    }));

    return res.json({
      success: true,
      data: activities,
      pagination: { page, totalPages, totalData }
    });
  } catch (err) {
    console.error("getRecentActivities", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

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

// ✅ Ekspor semua fungsi
module.exports = {
  renderDashboard,
  getSummary,
  getSalesAnalytics,
  getTopMenus,
  getRecentActivities,
  createMenuQuick,
};

