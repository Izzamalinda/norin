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


router.post('/generate', async (req, res) => {
  try {
    const { no_meja } = req.body;

    // cek duplikasi nomor meja
    const existing = await Meja.findOne({ where: { no_meja } });
    if (existing) {
      return res.render('generate-meja', { 
        title: 'Generate QR Meja',
        qr: null,
        message: `⚠️ Nomor meja ${no_meja} sudah ada! Gunakan nomor lain.`
      });
    }

    // 1️⃣ buat record meja dulu biar dapat id_meja dari database
    const newMeja = await Meja.create({ no_meja, qr_code: '' });
    const id_meja = newMeja.id_meja; // ini id integer dari DB

    // 2️⃣ buat URL QR pakai id_meja asli
    const menuUrl = `https://lousily-skiagraphic-amee.ngrok-free.dev/menu?meja=${id_meja}`;
    const qrFile = `meja-${no_meja}.png`;
    const qrPath = path.join(qrDir, qrFile);
    const qrRelativePath = `/uploads/qrcode/${qrFile}`;

    // 3️⃣ generate QR ke buffer
    const qrBuffer = await QRCode.toBuffer(menuUrl, { width: 300 });

    // 4️⃣ canvas dengan teks
    const canvas = createCanvas(300, 400);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 300, 400);
    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Meja ${no_meja}`, 150, 40);
    ctx.fillStyle = '#333';
    ctx.font = '18px sans-serif';
    ctx.fillText('Scan Menu Disini', 150, 70);

    const qrImg = await loadImage(qrBuffer);
    ctx.drawImage(qrImg, 0, 90, 300, 300);

    const out = fs.createWriteStream(qrPath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    await new Promise(resolve => out.on('finish', resolve));

    // 5️⃣ update kolom qr_code setelah QR selesai dibuat
    newMeja.qr_code = qrRelativePath;
    await newMeja.save();

    // 6️⃣ redirect ke daftar meja
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
