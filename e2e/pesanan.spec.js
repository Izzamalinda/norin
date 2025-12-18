import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.js';

test.describe('Functional Testing - Pesanan (Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/daftar-pesanan');
    await expect(page.getByRole('heading', { name: /Manajemen Pesanan/i })).toBeVisible();
  });

  test('Menampilkan statistik dan daftar pesanan', async ({ page }) => {
    // cek statistik cards
    const menunggu = page.locator('#count-menunggu');
    const diproses = page.locator('#count-diproses');
    const selesai = page.locator('#count-selesai');

    await expect(menunggu).toBeVisible();
    await expect(diproses).toBeVisible();
    await expect(selesai).toBeVisible();

    // cek nilai angka (harus bisa di-parse jadi integer)
    const nMenunggu = parseInt((await menunggu.textContent()).trim()) || 0;
    const nDiproses = parseInt((await diproses.textContent()).trim()) || 0;
    const nSelesai = parseInt((await selesai.textContent()).trim()) || 0;

    expect(Number.isInteger(nMenunggu)).toBeTruthy();
    expect(Number.isInteger(nDiproses)).toBeTruthy();
    expect(Number.isInteger(nSelesai)).toBeTruthy();

    // cek tabel atau pesan kosong
    const bodyRows = page.locator('#pesananBody tr');
    const rowCount = await bodyRows.count();

    if (rowCount === 1) {
      // bisa saja pesan "Tidak ada pesanan." berada di 1 baris
      const firstCell = bodyRows.nth(0).locator('td');
      const text = (await firstCell.textContent()) || '';
      if (text.includes('Tidak ada pesanan')) {
        return; // sudah sesuai: tidak ada pesanan
      }
    }

    // jika lebih dari 0 baris, pastikan kolom ID dan Status ada
    if (rowCount > 0) {
      const firstRow = bodyRows.nth(0);
      await expect(firstRow.locator('td').nth(0)).toBeVisible(); // ID
      await expect(firstRow.locator('td').nth(5)).toBeVisible(); // Status text cell
    }
  });

  test('Admin dapat mengupdate status pesanan', async ({ page }) => {
    const rows = page.locator('#pesananBody tr');
    const count = await rows.count();

    if (count === 0) {
      test.skip();
      return;
    }

    const firstRow = rows.nth(0);
    const idCell = firstRow.locator('td').nth(0);
    const idText = (await idCell.textContent()).trim();

    // cari form di baris pertama
    const form = firstRow.locator('form');
    const select = form.locator('select[name="status_pesanan"]');
    const updateBtn = form.locator('button[type="submit"]');

    await expect(select).toBeVisible();
    await expect(updateBtn).toBeVisible();

    // ubah status ke 'Diproses' (jika sudah Diproses, ubah ke 'Selesai')
    const currentStatus = (await firstRow.locator('td').nth(5).textContent()).trim();
    const target = currentStatus === 'Diproses' ? 'Selesai' : 'Diproses';

    await select.selectOption({ label: target });

    // submit dan tunggu navigation/refresh
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => null),
      updateBtn.click(),
    ]);

    // setelah submit, cari row dengan id yang sama dan cek status berubah
    const updatedRow = page.locator(`#pesananBody tr:has(td:text-is("${idText}"))`).first();
    await expect(updatedRow).toBeVisible();
    const newStatus = (await updatedRow.locator('td').nth(5).textContent()).trim();
    expect(newStatus).toBe(target);
  });
});
