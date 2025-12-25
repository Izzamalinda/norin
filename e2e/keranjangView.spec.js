import { test, expect } from '@playwright/test';

test.describe('Functional Test - Keranjang', () => {

  test('Menampilkan halaman keranjang', async ({ page }) => {
    // Buka halaman keranjang
    await page.goto('/keranjang/view', { timeout: 60000 });

    // Pastikan halaman keranjang tampil
    await expect(page).toHaveTitle(/Keranjang - Norin Cafe/i);

    // Cek apakah ada item keranjang atau pesan kosong
    const keranjangContainer = page.locator('section.w-full.lg\\:w-2\\/3');
    await expect(keranjangContainer).toBeVisible();

    // Karena tidak ada session, seharusnya kosong
    await expect(page.locator('text=Keranjang kamu masih kosong 😢')).toBeVisible();
  });

});
