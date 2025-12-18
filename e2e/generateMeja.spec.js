import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.js';

// Functional tests for generate meja (admin)
// Assumptions:
// - Route to manage tables is /admin/daftar-meja or similar; adjust if different
// - The page contains a button to "Generate Meja" or an input to set jumlah meja
// - After generation, table rows with meja names/ids appear in a table

test.describe('Functional Testing - Generate Meja (Admin)', () => {
  const uid = Date.now();
  const nomorMeja = uid % 100000; // keep it reasonably small

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    // buka halaman generate meja
    await page.goto('/meja/generate');
    const header = page.locator('h1.header-title');
    await header.waitFor({ state: 'visible', timeout: 5000 });
    await expect(header).toBeVisible();
  });

  test('Admin dapat membuka halaman generate meja', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Generate QR Code|Generate/i })).toBeVisible();
  });

  test('Admin dapat generate meja baru dan melihat hasil QR', async ({ page }) => {
    const noInput = page.locator('input[name="no_meja"]');
    await noInput.waitFor({ state: 'visible', timeout: 5000 });
    await noInput.fill(String(nomorMeja));

    const btnGenerate = page.getByRole('button', { name: /Generate QR Code/i }).first();
    await btnGenerate.click();

    // setelah submit, halaman render ulang dengan elemen .qr-result dan img.qr-image
    const qrResult = page.locator('.qr-result');
    await qrResult.waitFor({ state: 'visible', timeout: 10000 });
    await expect(qrResult).toBeVisible();

    const qrImg = qrResult.locator('img.qr-image');
    await expect(qrImg).toBeVisible();
    const src = await qrImg.getAttribute('src');
    expect(src).toContain(`/uploads/qrcode/meja-${nomorMeja}.png`);

    // juga cek pesan sukses jika ada
    const successMsg = page.locator('.success-message');
    if (await successMsg.count() > 0) {
      await expect(successMsg).toBeVisible();
    }
  });
});
