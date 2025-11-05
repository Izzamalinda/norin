const express = require('express');
const router = express.Router();
const mejaController = require('../controllers/mejaController');

router.get('/list', mejaController.listMeja);
router.get('/generate', mejaController.renderGeneratePage);
router.post('/generate', mejaController.generateMeja);
router.post('/delete/:id', mejaController.deleteMeja);

module.exports = router;
