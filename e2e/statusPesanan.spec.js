import { test, expect } from '@playwright/test';

test.describe('Functional Test - Status Pesanan', () => {

  test('Menampilkan halaman status pesanan untuk meja tertentu', async ({ page }) => {
    // Asumsi id_meja=1 ada, atau gunakan id_meja yang valid
    const idMeja = 1; // Ganti dengan id_meja yang memiliki pesanan jika perlu

    // Buka halaman status pesanan
    await page.goto(`/pesanan/status/${idMeja}`, { timeout: 60000 });

    // Pastikan halaman status pesanan tampil
    await expect(page).toHaveTitle(/Status Pesanan Anda/i);

    // Cek apakah ada pesanan atau pesan kosong
    const pesananContainer = page.locator('#pesananContainer');
    await expect(pesananContainer).toBeVisible();

    // Jika ada pesanan, cek elemen pesanan
    const pesananCards = page.locator('.bg-white.shadow-2xl');
    const count = await pesananCards.count();

    if (count > 0) {
      // Ada pesanan, cek elemen pertama
      const firstCard = pesananCards.nth(0);
      await expect(firstCard.locator('text=Pesanan ID:')).toBeVisible();
      await expect(firstCard.locator('text=Status Saat Ini:')).toBeVisible();
    } else {
      // Tidak ada pesanan, cek pesan kosong
      await expect(page.locator('text=Tidak Ada Pesanan')).toBeVisible();
    }
  });

  test('Menampilkan pesan tidak ada pesanan untuk meja tanpa pesanan aktif', async ({ page }) => {
    // Gunakan id_meja yang tidak memiliki pesanan aktif (misalnya id besar)
    const idMeja = 999; // Asumsi tidak ada pesanan untuk meja ini

    await page.goto(`/pesanan/status/${idMeja}`, { timeout: 60000 });

    await expect(page).toHaveTitle(/Status Pesanan Anda/i);

    // Cek pesan tidak ada pesanan
    await expect(page.locator('text=Tidak Ada Pesanan')).toBeVisible();
    await expect(page.locator('text=Meja ini belum memiliki riwayat pesanan aktif. Silakan mulai memesan!')).toBeVisible();
  });

});
