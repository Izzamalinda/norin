import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.js';

test.describe.serial('Daftar Meja', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/meja/list');
    const header = page.locator('h1.text-3xl');
    await header.waitFor({ state: 'visible', timeout: 5000 });
    await expect(header).toHaveText(/Daftar QR Code Meja/i);
  });

  test('Menampilkan header dan tombol Generate', async ({ page }) => {
    const generateLink = page.locator('a:has-text("Generate QR")').first();
    await expect(generateLink).toBeVisible();
    const href = await generateLink.getAttribute('href');
    expect(href).toBe('/meja/generate');

    // jika ada daftar meja, pastikan setidaknya satu kartu muncul
    const cards = page.locator('.card-meja');
    const count = await cards.count();
    if (count > 0) {
      await expect(cards.first()).toBeVisible();
      await expect(cards.first().locator('img.qr-image')).toBeVisible();
    }
  });

  test('Admin dapat generate meja', async ({ page }) => {
    // buat nomor meja unik
    const nomor = String(Date.now() % 100000);

    // ke halaman generate dan buat meja
    await page.goto('/meja/generate');
    await expect(page.locator('h1.header-title')).toBeVisible();

    const noInput = page.locator('input[name="no_meja"]');
    await noInput.fill(nomor);
    await page.getByRole('button', { name: /Generate QR Code/i }).click();

    // tunggu hasil QR
    const qrResult = page.locator('.qr-result');
    await qrResult.waitFor({ state: 'visible', timeout: 10000 });
    await expect(qrResult.locator('img.qr-image')).toBeVisible();

    // kembali ke daftar meja dan cari kartu dengan nama file qr yang sesuai
    await page.goto('/meja/list');
    const card = page.locator(`.card-meja:has(img[src*="meja-${nomor}.png"])`).first();
    await card.waitFor({ state: 'visible', timeout: 5000 });
    await expect(card).toBeVisible();
  });

  test('Admin dapat menghapus meja', async ({ page }) => {
    // buat meja terlebih dahulu agar bisa dihapus
    const nomor = String((Date.now() + 1) % 100000);
    await page.goto('/meja/generate');
    await expect(page.locator('h1.header-title')).toBeVisible();
    await page.locator('input[name="no_meja"]').fill(nomor);
    await page.getByRole('button', { name: /Generate QR Code/i }).click();
    const qrResult = page.locator('.qr-result');
    await qrResult.waitFor({ state: 'visible', timeout: 10000 });

    // kembali ke daftar meja dan hapus yang baru dibuat
    await page.goto('/meja/list');
    const targetSelector = `.card-meja:has(img[src*="meja-${nomor}.png"])`;
    const card = page.locator(targetSelector).first();
    await card.waitFor({ state: 'visible', timeout: 5000 });

    // terima dialog confirm
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    const deleteBtn = card.locator('button:has-text("Hapus")').first();
    await deleteBtn.click();

    // tunggu dan verifikasi bahwa kartu spesifik hilang (lebih stabil daripada mengandalkan count)
    await page.waitForLoadState('networkidle');
    const target = page.locator(targetSelector);
    await expect(target).toHaveCount(0, { timeout: 10000 });
  });
});
