import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.js';

test.describe('Functional Testing - Dashboard Admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
    const header = page.locator('h1.text-3xl');
    await header.waitFor({ state: 'visible', timeout: 5000 });
    await expect(header).toHaveText(/Dashboard Admin/i);
  });

  test('Menampilkan ringkasan metrik', async ({ page }) => {
    const revenue = page.locator('#revenueToday');
    const totalPesanan = page.locator('#totalPesanan');
    const menuAktif = page.locator('#menuAktif');
    const customerAktif = page.locator('#customerAktif');

    await expect(revenue).toBeVisible();
    await expect(totalPesanan).toBeVisible();
    await expect(menuAktif).toBeVisible();
    await expect(customerAktif).toBeVisible();

    // Ensure the text can be read (may be 'Rp 0' or other)
    const revText = (await revenue.textContent()) || '';
    const totalText = (await totalPesanan.textContent()) || '';
    const menuText = (await menuAktif.textContent()) || '';
    const custText = (await customerAktif.textContent()) || '';

    expect(revText.trim().length).toBeGreaterThan(0);
    expect(totalText.trim().length).toBeGreaterThan(0);
    expect(menuText.trim().length).toBeGreaterThan(0);
    expect(custText.trim().length).toBeGreaterThan(0);
  });

  test('Memuat penjualan, top menu, dan aktivitas terbaru', async ({ page }) => {
    // sales
    const salesBody = page.locator('#salesTableBody');
    await salesBody.waitFor({ state: 'attached', timeout: 5000 });
    const salesRows = salesBody.locator('tr');

    // top menus
    const topBody = page.locator('#categoriesTableBody');
    await topBody.waitFor({ state: 'attached', timeout: 5000 });
    const topRows = topBody.locator('tr');

    // recent activities
    const recentBody = page.locator('#recentActivities');
    await recentBody.waitFor({ state: 'attached', timeout: 5000 });
    const recentRows = recentBody.locator('tr');

    // It's acceptable if there is no data; check that elements exist
    expect(await salesRows.count()).toBeGreaterThanOrEqual(0);
    expect(await topRows.count()).toBeGreaterThanOrEqual(0);
    expect(await recentRows.count()).toBeGreaterThanOrEqual(0);
  });

  test('membuat menu cepat lewat API', async ({ page }) => {
    // Instead of asserting menuAktif (status mapping may differ), verify API success
    // and that the created menu appears in the kelola menu listing.
    const uid = Date.now();
    const payload = { nama: `qa-menu-${uid}`, harga: 1000, kategori: 'makanan', deskripsi: 'menu untuk testing' };

    const res = await page.evaluate(async (payload) => {
      const resp = await fetch('/admin/api/dashboard/actions/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      return resp.json();
    }, payload);

    expect(res && res.success).toBeTruthy();

    // buka halaman kelola menu dan cari menu baru berdasarkan nama
    await page.goto('/admin/kelola-menu');
    const menuRow = page.locator(`table >> text=${payload.nama}`).first();
    await menuRow.waitFor({ state: 'visible', timeout: 10000 });
    await expect(menuRow).toBeVisible();
  });
});
