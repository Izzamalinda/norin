import { test, expect } from '@playwright/test';

test.describe('Functional Test - Forgot Password Admin', () => {

  test.beforeEach(async ({ page }) => {
   await page.goto('http://localhost:3000/forgotpasswordAdmin', {
      waitUntil: 'domcontentloaded',
    });
  });

  test('Menampilkan halaman forgot password', async ({ page }) => {
    await expect(page).toHaveTitle(/Reset Password/i);

    await expect(
      page.getByRole('heading', { name: 'Reset Password' })
    ).toBeVisible();

    await expect(page.locator('#username')).toBeVisible();
  });

  test('Menampilkan security question ketika username valid', async ({ page }) => {
    await page.fill('#username', 'Admin');
    await page.waitForTimeout(800);

    const question = page.locator('#questionText');
    await expect(question).not.toContainText('Masukkan username');
  });

  test('Gagal reset password jika jawaban keamanan salah', async ({ page }) => {
    await page.fill('#username', 'Admin');
    await page.waitForTimeout(800);

    await page.fill('#answer', 'salah');
    await page.fill('#newPassword', 'Password123');
    await page.fill('#confirmPassword', 'Password123');

    await page.click('#submitBtn');

    await expect(page.locator('#message'))
      .toHaveText(/Jawaban keamanan salah/i);
  });

  test('Berhasil reset password dan redirect ke login', async ({ page }) => {
    await page.fill('#username', 'Admin');
    await page.waitForTimeout(800);

    await page.fill('#answer', 'Norin');
    await page.fill('#newPassword', 'Password123');
    await page.fill('#confirmPassword', 'Password123');

    await page.click('#submitBtn');

    await expect(page.locator('#message'))
      .toHaveText(/Password berhasil/i);

    await page.waitForURL('**/loginAdmin', {
      waitUntil: 'domcontentloaded',
    });
  });

});
