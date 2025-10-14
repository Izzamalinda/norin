// controllers/mejaController.js
const path = require('path');
const fs = require('fs');
const { Meja, Pesanan } = require('../models');
const { generateQrMeja } = require('../utils/generateQrMeja');

const qrDir = path.join(__dirname, '../uploads/qrcode');
if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

// 📋 Daftar semua meja
exports.listMeja = async (req, res) => {
  try {
    const mejaList = await Meja.findAll({ order: [['no_meja', 'ASC']] });
    res.render('daftar-meja', { title: 'Daftar Meja', mejaList });
  } catch (err) {
    console.error(err);
    res.status(500).send('Gagal memuat daftar meja.');
  }
};

// 🆕 Halaman generate QR
exports.renderGeneratePage = (req, res) => {
  res.render('generate-meja', { title: 'Generate QR Meja', qr: null, message: null });
};

// 🧩 Generate QR dan simpan ke DB
exports.generateMeja = async (req, res) => {
  try {
    const { no_meja } = req.body;
    const existing = await Meja.findOne({ where: { no_meja } });

    if (existing) {
      return res.render('generate-meja', {
        title: 'Generate QR Meja',
        qr: null,
        message: `⚠️ Nomor meja ${no_meja} sudah ada! Gunakan nomor lain.`,
      });
    }

    const qrRelativePath = await generateQrMeja(no_meja, qrDir);
    const id_meja = 'M' + String(no_meja).padStart(3, '0');

    await Meja.create({ id_meja, no_meja, qr_code: qrRelativePath });

    // Render ulang halaman dengan QR hasil generate (agar sesuai view)
    res.render('generate-meja', {
      title: 'Generate QR Meja',
      qr: qrRelativePath,
      message: `✅ QR Code untuk meja ${no_meja} berhasil dibuat!`,
    });
  } catch (err) {
    console.error('❌ Error saat generate QR:', err);
    res.status(500).send('Gagal membuat QR Code.');
  }
};

// 🗑️ Hapus meja dan file QR
exports.deleteMeja = async (req, res) => {
  try {
    const id = req.params.id;
    const meja = await Meja.findByPk(id);

    if (!meja) return res.status(404).send('Data meja tidak ditemukan.');

    const qrPath = path.join(__dirname, `../${meja.qr_code}`);
    if (fs.existsSync(qrPath)) fs.unlinkSync(qrPath);

    await meja.destroy();
    res.redirect('/meja/list');
  } catch (err) {
    console.error('❌ Gagal menghapus meja:', err);
    res.status(500).send('Gagal menghapus data meja.');
  }
};

exports.hasActivePesanan = async (id_meja) => {
  const aktif = await Pesanan.findOne({
    where: { id_meja, status_pesanan: ["Menunggu Pembayaran", "Diproses"] },
  });
  return !!aktif;
};

// ✅ Pastikan meja ada di database (kalau belum, buat otomatis)
exports.ensureMejaExists = async (id_meja, no_meja = null) => {
  let meja = await Meja.findByPk(id_meja);
  if (!meja && no_meja) {
    // Buat baru jika belum ada (opsional, untuk testing)
    meja = await Meja.create({
      id_meja,
      no_meja,
      qr_code: `/uploads/qrcode/meja-${no_meja}.png`,
    });
  }
  return meja;
};

