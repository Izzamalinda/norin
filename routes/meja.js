const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const { Meja } = require('../models');

// Folder QR
const qrDir = path.join(__dirname, '../uploads/qrcode');
if (!fs.existsSync(qrDir)) fs.mkdirSync(qrDir, { recursive: true });

// 🧭 Daftar meja
router.get('/list', async (req, res) => {
  try {
    const mejaList = await Meja.findAll({ order: [['no_meja', 'ASC']] });
    res.render('daftar-meja', { title: 'Daftar Meja', mejaList });
  } catch (err) {
    console.error(err);
    res.status(500).send('Gagal memuat daftar meja.');
  }
});

// 🆕 Halaman generate
router.get('/generate', (req, res) => {
  res.render('generate-meja', { title: 'Generate QR Meja', qr: null, message: null });
});

// 🧩 Generate QR + tulisan "Scan Me"
router.post('/generate', async (req, res) => {
  try {
    const { no_meja } = req.body;

    const existing = await Meja.findOne({ where: { no_meja } });
    if (existing) {
      return res.render('generate-meja', { 
        title: 'Generate QR Meja',
        qr: null,
        message: `⚠️ Nomor meja ${no_meja} sudah ada! Gunakan nomor lain.`
      });
    }

    const menuUrl = `http://192.168.11.101:3000/menu?meja=${no_meja}`;
    const qrFile = `meja-${no_meja}.png`;
    const qrPath = path.join(qrDir, qrFile);
    const qrRelativePath = `/uploads/qrcode/${qrFile}`;

    // Generate QR code buffer dulu
    const qrBuffer = await QRCode.toBuffer(menuUrl, { width: 300 });

    // Buat canvas baru (lebih tinggi biar bisa tambah teks di atas)
    const canvas = createCanvas(300, 350);
    const ctx = canvas.getContext('2d');

    // Background putih
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 300, 350);

    // Tambahkan teks “Scan Me”
    ctx.fillStyle = '#333';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan Menu Disini', 150, 40);

    // Load QR image ke canvas
    const qrImg = await loadImage(qrBuffer);
    ctx.drawImage(qrImg, 0, 60, 300, 300);

    // Simpan jadi PNG file
    const out = fs.createWriteStream(qrPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    await new Promise(resolve => out.on('finish', resolve));

    // Simpan ke database
    await Meja.create({ no_meja, qr_code: qrRelativePath });

    // Redirect ke daftar meja
    res.redirect('/meja/list');

  } catch (err) {
    console.error('❌ Error saat generate QR:', err);
    res.status(500).send('Gagal membuat QR Code.');
  }
});

// 🗑️ Hapus QR Code Meja
router.post('/delete/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const meja = await Meja.findByPk(id);

    if (!meja) {
      return res.status(404).send('Data meja tidak ditemukan.');
    }

    // Hapus file QR Code dari folder /uploads/qrcode/
    const qrPath = path.join(__dirname, `../${meja.qr_code}`);
    if (fs.existsSync(qrPath)) {
      fs.unlinkSync(qrPath);
    }

    // Hapus dari database
    await meja.destroy();

    res.redirect('/meja/list');
  } catch (err) {
    console.error('❌ Gagal menghapus meja:', err);
    res.status(500).send('Gagal menghapus data meja.');
  }
});

module.exports = router;
