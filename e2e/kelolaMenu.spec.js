import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth.js';

test.describe.serial('Functional Testing - Kelola Menu (Admin)', () => {
  const uid = Date.now();
  const menuName = `Menu Test ${uid}`;
  const menuEditName = `Menu Test Edit ${uid}`;

  test.beforeEach(async ({ page }) => {
    // login admin
    await loginAsAdmin(page);

    // buka halaman kelola menu
    await page.goto('/admin/kelola-menu');

    // cek heading H1 "Kelola Menu" supaya tidak ketemu multiple element
    await expect(page.locator('h1', { hasText: 'Kelola Menu' })).toBeVisible();
  });

  test('Menampilkan halaman kelola menu', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Kelola Menu/i })).toBeVisible();
  });

  test('Admin dapat menambahkan menu baru', async ({ page }) => {
    const btnTambah = page.getByRole('button', { name: /Tambah Menu/i }).first();
    await btnTambah.waitFor({ state: 'visible', timeout: 5000 });
    await btnTambah.click();

    // tunggu modal tambah muncul
    const addModal = page.locator('#addModal');
    await addModal.waitFor({ state: 'visible', timeout: 5000 });

    // isi form di dalam modal
    await addModal.locator('input[name="nama"]').fill(menuName);
    await addModal.locator('input[name="harga"]').fill('50000');
    await addModal.locator('select[name="kategori"]').selectOption('makanan');
    await addModal.locator('textarea[name="deskripsi"]').fill('Deskripsi menu test');

    // klik tombol Simpan Menu di modal
    await addModal.getByRole('button', { name: /Simpan Menu/i }).click();

    // cek menu baru muncul di list
    const menuBaru = page.locator(`table >> td:has-text("${menuName}")`).first();
    await menuBaru.waitFor({ state: 'visible', timeout: 5000 });
    await expect(menuBaru).toBeVisible();
  });

  test('Admin dapat mengedit menu', async ({ page }) => {
    // temukan baris yang mengandung menu target lalu klik tombol Edit di baris itu
    const rowToEdit = page.locator(`table >> tr:has(td:has-text("${menuName}"))`).first();
    const btnEdit = rowToEdit.locator('button[title="Edit Menu"]');
    await btnEdit.waitFor({ state: 'visible', timeout: 5000 });
    await btnEdit.click();

    const editModal = page.locator('#editModal');
    await editModal.waitFor({ state: 'visible', timeout: 5000 });

    await editModal.locator('input[name="nama"]').fill(menuEditName);
    await editModal.getByRole('button', { name: /Update Menu/i }).click();

    const menuEdit = page.locator(`table >> td:has-text("${menuEditName}")`).first();
    await menuEdit.waitFor({ state: 'visible', timeout: 5000 });
    await expect(menuEdit).toBeVisible();
  });

  test('Admin dapat menghapus menu', async ({ page }) => {
    // temukan baris yang berisi item yang ingin dihapus lalu klik tombol Hapus di baris tersebut
    const rowToDelete = page.locator(`table >> tr:has(td:has-text("${menuEditName}"))`).first();
    const btnHapus = rowToDelete.locator('button[title="Hapus Menu"]');
    await btnHapus.waitFor({ state: 'visible', timeout: 10000 });
    await btnHapus.scrollIntoViewIfNeeded();
    await btnHapus.click();

    const deleteModal = page.locator('#deleteModal');
    await deleteModal.waitFor({ state: 'visible', timeout: 5000 });

    await page.locator('#confirmDeleteBtn').click();

    const menuHapus = page.locator(`table >> td:has-text("${menuEditName}")`).first();
    await expect(menuHapus).not.toBeVisible({ timeout: 10000 });
  });

});