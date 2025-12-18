import { test, expect } from '@playwright/test';

test.describe('Functional Test - Login Admin', () => {

  test('Login admin berhasil dengan credential valid', async ({ page }) => {
    // buka halaman login
    await page.goto('/loginAdmin', { timeout: 60000 });

    // pastikan halaman login tampil
    await expect(page).toHaveTitle(/Login Admin/i);

    // isi form
    await page.fill('#username', 'Admin');
    await page.fill('#password', 'Password123');

    // submit form
    await page.click('button[type="submit"]');

    // pastikan redirect ke dashboard admin
    await expect(page).toHaveURL('/admin/dashboard');

    // opsional: cek elemen khas dashboard
    // await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('Login admin gagal - username tidak ditemukan', async ({ page }) => {
    await page.goto('/loginAdmin');

    await page.fill('#username', 'user_salah');
    await page.fill('#password', 'Password123');

    await page.click('button[type="submit"]');

    // tetap di halaman login
    await expect(page).toHaveURL('/loginAdmin');

    // cek pesan error
    await expect(
      page.locator('text=User tidak ditemukan!')
    ).toBeVisible();
  });

  test('Login admin gagal - password salah', async ({ page }) => {
    await page.goto('/loginAdmin');

    await page.fill('#username', 'Admin');
    await page.fill('#password', 'password_salah');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/loginAdmin');

    await expect(
      page.locator('text=Password salah!')
    ).toBeVisible();
  });

});
