// utils/generateQrMeja.js
const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

async function generateQrMeja(no_meja, outputDir) {
  const menuUrl = `http://192.168.1.19:3000/menu?meja=${no_meja}`;
  const qrFile = `meja-${no_meja}.png`;
  const qrPath = path.join(outputDir, qrFile);
  const qrRelativePath = `/uploads/qrcode/${qrFile}`;

  const qrBuffer = await QRCode.toBuffer(menuUrl, { width: 300 });

  const canvas = createCanvas(300, 350);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 300, 350);
  ctx.fillStyle = '#333';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Scan Menu Disini', 150, 40);

  const qrImg = await loadImage(qrBuffer);
  ctx.drawImage(qrImg, 0, 60, 300, 300);

  const out = fs.createWriteStream(qrPath);
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  await new Promise(resolve => out.on('finish', resolve));

  return qrRelativePath;
}

module.exports = { generateQrMeja };
