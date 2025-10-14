// routes/meja.js
const express = require('express');
const router = express.Router();
const mejaController = require('../controllers/mejaController');

// Daftar meja
router.get('/list', mejaController.listMeja);

// Halaman generate QR
router.get('/generate', mejaController.renderGeneratePage);

// Proses generate QR
router.post('/generate', mejaController.generateMeja);

// Hapus QR meja
router.post('/delete/:id', mejaController.deleteMeja);

module.exports = router;
