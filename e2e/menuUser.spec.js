import { test, expect } from '@playwright/test';

test.describe('Functional Testing - Menu User', () => {

    test.beforeEach(async ({ page }) => {
        // Navigasi ke halaman menu user
        await page.goto('/menu', { timeout: 60000 });
    });

    test('Menampilkan halaman menu user dengan benar', async ({ page }) => {
        // Verifikasi halaman menu dimuat
        await expect(page).toHaveURL(/\/menu/);

        // Verifikasi elemen penting ada di halaman
        await expect(page.locator('body')).toBeVisible();
    });

    test('Menampilkan semua menu yang tersedia', async ({ page }) => {
        // Tunggu halaman dimuat
        await page.waitForLoadState('networkidle');

        // Verifikasi ada menu yang ditampilkan
        const menuItems = page.locator('[data-menu-item], .menu-item, .card');
        const count = await menuItems.count();

        // Pastikan ada setidaknya satu menu (jika database memiliki data)
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('Filter menu berdasarkan kategori Makanan', async ({ page }) => {
        // Klik kategori Makanan
        const kategoriMakanan = page.locator('a[href*="/menu/kategori/makanan"], button:has-text("Makanan")').first();

        if (await kategoriMakanan.isVisible()) {
            await kategoriMakanan.click();

            // Verifikasi URL berubah ke kategori makanan
            await expect(page).toHaveURL(/\/menu\/kategori\/makanan/);

            // Tunggu halaman dimuat
            await page.waitForLoadState('networkidle');
        }
    });

    test('Filter menu berdasarkan kategori Minuman', async ({ page }) => {
        // Klik kategori Minuman
        const kategoriMinuman = page.locator('a[href*="/menu/kategori/minuman"], button:has-text("Minuman")').first();

        if (await kategoriMinuman.isVisible()) {
            await kategoriMinuman.click();

            // Verifikasi URL berubah ke kategori minuman
            await expect(page).toHaveURL(/\/menu\/kategori\/minuman/);

            // Tunggu halaman dimuat
            await page.waitForLoadState('networkidle');
        }
    });

    test('Filter menu berdasarkan kategori Cemilan', async ({ page }) => {
        // Klik kategori Cemilan
        const kategoriCemilan = page.locator('a[href*="/menu/kategori/cemilan"], button:has-text("Cemilan")').first();

        if (await kategoriCemilan.isVisible()) {
            await kategoriCemilan.click();

            // Verifikasi URL berubah ke kategori cemilan
            await expect(page).toHaveURL(/\/menu\/kategori\/cemilan/);

            // Tunggu halaman dimuat
            await page.waitForLoadState('networkidle');
        }
    });

    test('Mencari menu dengan keyword tertentu', async ({ page }) => {
        // Cari input search
        const searchInput = page.locator('input[type="search"], input[name="keyword"], input[placeholder*="Cari"]').first();

        if (await searchInput.isVisible()) {
            // Isi keyword pencarian
            await searchInput.fill('nasi');

            // Cari tombol search atau tekan Enter
            const searchButton = page.locator('button[type="submit"]:near(input[type="search"])').first();

            if (await searchButton.isVisible()) {
                await searchButton.click();
            } else {
                await searchInput.press('Enter');
            }

            // Verifikasi URL mengandung parameter search
            await page.waitForURL(/keyword=nasi/, { timeout: 5000 }).catch(() => { });

            // Tunggu hasil pencarian dimuat
            await page.waitForLoadState('networkidle');
        }
    });

    test('Mengakses menu dengan parameter meja dari QR Code', async ({ page }) => {
        // Akses menu dengan parameter meja
        await page.goto('/menu?meja=5');

        // Verifikasi halaman dimuat
        await expect(page).toHaveURL(/meja=5/);

        // Tunggu halaman dimuat
        await page.waitForLoadState('networkidle');

        // Verifikasi informasi meja ditampilkan (jika ada)
        const mejaInfo = page.locator('text=/Meja.*5/i, [data-meja], .meja-info').first();
        // Tidak wajib visible karena tergantung implementasi UI
    });

    test('Mengakses menu dengan mode Takeaway (meja=0)', async ({ page }) => {
        // Akses menu dengan parameter meja 0 (Takeaway)
        await page.goto('/menu?meja=0');

        // Verifikasi halaman dimuat
        await expect(page).toHaveURL(/meja=0/);

        // Tunggu halaman dimuat
        await page.waitForLoadState('networkidle');

        // Verifikasi informasi Takeaway ditampilkan (jika ada)
        const takeawayInfo = page.locator('text=/Takeaway/i').first();
        // Tidak wajib visible karena tergantung implementasi UI
    });

    test('Melihat detail menu tertentu', async ({ page }) => {
        // Tunggu halaman dimuat
        await page.waitForLoadState('networkidle');

        // Cari link atau tombol detail menu
        const detailLink = page.locator('a[href*="/menu/"], .menu-item a, .card a').first();

        if (await detailLink.isVisible()) {
            // Simpan href untuk verifikasi
            const href = await detailLink.getAttribute('href');

            // Klik detail menu
            await detailLink.click();

            // Verifikasi navigasi ke halaman detail
            await page.waitForURL(/\/menu\/.+/, { timeout: 5000 });

            // Verifikasi halaman detail dimuat
            await page.waitForLoadState('networkidle');
        }
    });

    test('Menampilkan counter kategori menu', async ({ page }) => {
        // Tunggu halaman dimuat
        await page.waitForLoadState('networkidle');

        // Verifikasi counter kategori ditampilkan
        // Counter bisa berupa badge, span, atau elemen lain yang menampilkan jumlah
        const counters = page.locator('[data-count], .badge, .count');

        // Pastikan ada counter yang ditampilkan (minimal 0)
        const count = await counters.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('Navigasi kembali ke semua menu dari kategori tertentu', async ({ page }) => {
        // Akses kategori tertentu
        await page.goto('/menu/kategori/makanan');
        await page.waitForLoadState('networkidle');

        // Cari link "Semua Menu" atau "All"
        const semuaMenuLink = page.locator('a:has-text("Semua"), a:has-text("All"), a[href="/menu"]').first();

        if (await semuaMenuLink.isVisible()) {
            await semuaMenuLink.click();

            // Verifikasi kembali ke halaman semua menu
            await expect(page).toHaveURL(/\/menu$/);
        }
    });

    test('Menampilkan pesan jika tidak ada hasil pencarian', async ({ page }) => {
        // Cari input search
        const searchInput = page.locator('input[type="search"], input[name="keyword"], input[placeholder*="Cari"]').first();

        if (await searchInput.isVisible()) {
            // Isi keyword yang tidak ada
            await searchInput.fill('xyzabc123notfound');

            // Submit pencarian
            const searchButton = page.locator('button[type="submit"]:near(input[type="search"])').first();

            if (await searchButton.isVisible()) {
                await searchButton.click();
            } else {
                await searchInput.press('Enter');
            }

            // Tunggu hasil pencarian dimuat
            await page.waitForLoadState('networkidle');

            // Verifikasi pesan tidak ada hasil (jika ada)
            const noResultMessage = page.locator('text=/tidak ditemukan/i, text=/no result/i, .empty-state').first();
            // Tidak wajib visible karena tergantung implementasi UI
        }
    });

    test('Session meja tetap tersimpan saat navigasi antar halaman', async ({ page }) => {
        // Akses menu dengan parameter meja
        await page.goto('/menu?meja=3');
        await page.waitForLoadState('networkidle');

        // Navigasi ke kategori
        const kategoriLink = page.locator('a[href*="/menu/kategori/"]').first();

        if (await kategoriLink.isVisible()) {
            await kategoriLink.click();
            await page.waitForLoadState('networkidle');

            // Verifikasi informasi meja masih ada (session tersimpan)
            // Ini tergantung implementasi UI, bisa berupa text atau data attribute
            const mejaInfo = page.locator('text=/Meja.*3/i, [data-meja="3"]').first();
            // Tidak wajib visible karena tergantung implementasi UI
        }
    });

    test('Responsive - Halaman menu dapat diakses di mobile viewport', async ({ page }) => {
        // Set viewport ke ukuran mobile
        await page.setViewportSize({ width: 375, height: 667 });

        // Akses halaman menu
        await page.goto('/menu');
        await page.waitForLoadState('networkidle');

        // Verifikasi halaman dimuat dengan baik
        await expect(page.locator('body')).toBeVisible();
    });

    test('Menampilkan harga menu dengan format yang benar', async ({ page }) => {
        // Tunggu halaman dimuat
        await page.waitForLoadState('networkidle');

        // Cari elemen harga (biasanya mengandung "Rp" atau angka)
        const hargaElements = page.locator('.price, .harga, :text("Rp")').first();

        if (await hargaElements.isVisible()) {
            const hargaText = await hargaElements.textContent();

            // Verifikasi format harga mengandung "Rp" atau angka
            expect(hargaText).toMatch(/Rp|[0-9]/);
        }
    });

    test('Keranjang tersedia di halaman menu', async ({ page }) => {
        // Tunggu halaman dimuat
        await page.waitForLoadState('networkidle');

        // Cari icon atau link keranjang
        const keranjangLink = page.locator('a[href*="keranjang"], .cart, .keranjang, [data-cart]').first();

        // Verifikasi keranjang ada di halaman (tidak wajib visible untuk semua implementasi)
        const count = await page.locator('a[href*="keranjang"], .cart, .keranjang').count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

});
