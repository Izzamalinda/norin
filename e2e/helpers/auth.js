// helpers/auth.js
export async function loginAsAdmin(page) {
  await page.goto('/loginAdmin', { timeout: 60000 });
  await page.fill('#username', 'Admin');
  await page.fill('#password', 'Password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin/dashboard', { timeout: 10000 });
}