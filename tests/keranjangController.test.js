jest.mock('../models', () => ({
	Menu: { findByPk: jest.fn() },
	Pesanan: { findOne: jest.fn(), create: jest.fn() },
	Keranjang: { update: jest.fn(), findOne: jest.fn(), create: jest.fn() }
}));

jest.mock('../controllers/mejaController', () => ({
	ensureMejaExists: jest.fn(),
	hasActivePesanan: jest.fn()
}));

const { Menu, Pesanan, Keranjang } = require('../models');
const mejaController = require('../controllers/mejaController');
const KeranjangController = require('../controllers/keranjangController');

function mkRes() {
	return {
		statusCode: 200,
		jsonBody: null,
		redirectUrl: null,
		status(c) { this.statusCode = c; return this; },
		json(obj) { this.jsonBody = obj; return this; },
		redirect(url) { this.redirectUrl = url; return this; }
	};
}

function mkReq(body = {}, params = {}, session = {}) {
	return { body, params, session };
}

describe('KeranjangController (Unit Test)', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	test('addToKeranjang: menu tidak ditemukan -> 404', async () => {
		Menu.findByPk.mockResolvedValue(null);
		const req = mkReq({ id_menu: 'M1' }, {}, {});
		const res = mkRes();

		await KeranjangController.addToKeranjang(req, res);

		expect(res.statusCode).toBe(404);
		expect(res.jsonBody).toEqual({ message: 'Menu tidak ditemukan' });
	});

	test('addToKeranjang: menambahkan item baru ke session', async () => {
		Menu.findByPk.mockResolvedValue({ nama: 'Nasi', harga: 10000, id: 'M1' });
		const req = mkReq({ id_menu: 'M1' }, {}, {});
		const res = mkRes();

		await KeranjangController.addToKeranjang(req, res);

		expect(res.jsonBody).toEqual(expect.objectContaining({ success: true }));
		expect(req.session.keranjang).toHaveLength(1);
		expect(req.session.keranjang[0]).toMatchObject({ id_menu: 'M1', nama: 'Nasi', harga: 10000, jumlah: 1, total_harga: 10000 });
	});

	test('addToKeranjang: increment jumlah jika sudah ada', async () => {
		Menu.findByPk.mockResolvedValue({ nama: 'Nasi', harga: 10000, id: 'M1' });
		const req = mkReq({}, {}, { keranjang: [{ id_menu: 'M1', nama: 'Nasi', harga: 10000, jumlah: 1, total_harga: 10000 }] });
		const res = mkRes();
		req.body = { id_menu: 'M1' };

		await KeranjangController.addToKeranjang(req, res);

		expect(req.session.keranjang[0].jumlah).toBe(2);
		expect(req.session.keranjang[0].total_harga).toBe(20000);
	});

	test('updateJumlah: item tidak ada -> success false', async () => {
		const req = mkReq({ id_menu: 'M2', action: 'tambah' }, {}, { keranjang: [{ id_menu: 'M1' }] });
		const res = mkRes();

		await KeranjangController.updateJumlah(req, res);

		expect(res.jsonBody).toEqual({ success: false });
	});

	test('updateJumlah: tambah dan hitung ulang total_harga', async () => {
		const req = mkReq({ id_menu: 'M1', action: 'tambah' }, {}, { keranjang: [{ id_menu: 'M1', jumlah: 1, harga: 5000, total_harga: 5000 }] });
		const res = mkRes();

		await KeranjangController.updateJumlah(req, res);

		expect(req.session.keranjang[0].jumlah).toBe(2);
		expect(req.session.keranjang[0].total_harga).toBe(10000);
		expect(res.jsonBody).toEqual({ success: true, keranjang: req.session.keranjang });
	});

	test('updateJumlah: kurang sampai 0 -> hapus item', async () => {
		const req = mkReq({ id_menu: 'M1', action: 'kurang' }, {}, { keranjang: [{ id_menu: 'M1', jumlah: 1, harga: 5000, total_harga: 5000 }] });
		const res = mkRes();

		await KeranjangController.updateJumlah(req, res);

		expect(req.session.keranjang).toEqual([]);
		expect(res.jsonBody).toEqual({ success: true, keranjang: req.session.keranjang });
	});

	test('updateJumlah: kurang tapi tidak sampai 0 -> update jumlah dan total_harga', async () => {
		const req = mkReq({ id_menu: 'M1', action: 'kurang' }, {}, { keranjang: [{ id_menu: 'M1', jumlah: 3, harga: 5000, total_harga: 15000 }] });
		const res = mkRes();

		await KeranjangController.updateJumlah(req, res);

		expect(req.session.keranjang[0].jumlah).toBe(2);
		expect(req.session.keranjang[0].total_harga).toBe(10000);
		expect(res.jsonBody).toEqual({ success: true, keranjang: req.session.keranjang });
	});

	test('updateJumlah: invalid action -> no change', async () => {
		const req = mkReq({ id_menu: 'M1', action: 'invalid' }, {}, { keranjang: [{ id_menu: 'M1', jumlah: 2, harga: 5000, total_harga: 10000 }] });
		const res = mkRes();

		await KeranjangController.updateJumlah(req, res);

		expect(req.session.keranjang[0].jumlah).toBe(2); // should remain unchanged
		expect(req.session.keranjang[0].total_harga).toBe(10000); // should remain unchanged
		expect(res.jsonBody).toEqual({ success: true, keranjang: req.session.keranjang });
	});

	test('deleteItem: tidak ada keranjang -> success false', async () => {
		const req = mkReq({}, { id_menu: 'M1' }, {});
		const res = mkRes();

		await KeranjangController.deleteItem(req, res);

		expect(res.jsonBody).toEqual({ success: false });
	});

	test('deleteItem: menghapus item tertentu', async () => {
		const req = mkReq({}, { id_menu: 'M1' }, { keranjang: [{ id_menu: 'M1' }, { id_menu: 'M2' }] });
		const res = mkRes();

		await KeranjangController.deleteItem(req, res);

		expect(req.session.keranjang).toEqual([{ id_menu: 'M2' }]);
		expect(res.jsonBody).toEqual({ success: true });
	});

	test('updateCatatan: update session dan panggil Keranjang.update', async () => {
		Keranjang.update.mockResolvedValue([1]);
		const req = mkReq({ id_menu: 'M1', catatan: { spicy: true } }, {}, { keranjang: [{ id_menu: 'M1' }] });
		const res = mkRes();

		await KeranjangController.updateCatatan(req, res);

		expect(Keranjang.update).toHaveBeenCalledWith({ catatan: JSON.stringify({ spicy: true }) }, { where: { id_menu: 'M1' } });
		expect(req.session.keranjang[0].catatan).toEqual({ spicy: true });
		expect(res.jsonBody).toEqual({ success: true, message: 'Catatan diperbarui' });
	});

	test('checkout: tanpa id_meja -> 400', async () => {
		const req = mkReq({}, {}, { keranjang: [{ id_menu: 'M1', jumlah: 1, total_harga: 5000 }] });
		const res = mkRes();

		await KeranjangController.checkout(req, res);

		expect(res.statusCode).toBe(400);
		expect(res.jsonBody).toEqual({ message: 'Belum scan QR meja' });
	});

	test('checkout: keranjang kosong -> 400', async () => {
		const req = mkReq({}, {}, { id_meja: 'MEJA1', keranjang: [] });
		const res = mkRes();

		await KeranjangController.checkout(req, res);

		expect(res.statusCode).toBe(400);
		expect(res.jsonBody).toEqual({ message: 'Keranjang kosong' });
	});

	test('checkout: meja tidak ditemukan -> 404', async () => {
		mejaController.ensureMejaExists.mockResolvedValue(null);
		const req = mkReq({}, {}, { id_meja: 'MEJA1', keranjang: [{ id_menu: 'M1', jumlah: 1, total_harga: 5000 }] });
		const res = mkRes();

		await KeranjangController.checkout(req, res);

		expect(res.statusCode).toBe(404);
		expect(res.jsonBody).toEqual({ message: 'Data meja tidak ditemukan' });
	});

	test('checkout: redirect jika ada pesanan aktif', async () => {
		mejaController.ensureMejaExists.mockResolvedValue({ id_meja: 'MEJA1' });
		mejaController.hasActivePesanan.mockResolvedValue(true);
		const req = mkReq({}, {}, { id_meja: 'MEJA1', keranjang: [{ id_menu: 'M1', jumlah: 1, total_harga: 5000 }] });
		const res = mkRes();

		await KeranjangController.checkout(req, res);

		expect(res.redirectUrl).toBe('/pesanan/status/MEJA1');
	});

	test('checkout: sukses membuat pesanan dan keranjang entries', async () => {
		mejaController.ensureMejaExists.mockResolvedValue({ id_meja: 'MEJA1' });
		mejaController.hasActivePesanan.mockResolvedValue(false);

		Pesanan.findOne.mockResolvedValue({ id_pesanan: 'PSN0001' });
		Pesanan.create.mockResolvedValue({});
		Keranjang.findOne.mockResolvedValue({ id_keranjang: 'KRJ0001' });
		Keranjang.create.mockResolvedValue({});

		const req = mkReq({}, {}, { id_meja: 'MEJA1', keranjang: [{ id_menu: 'M1', jumlah: 2, total_harga: 10000 }] });
		const res = mkRes();

		await KeranjangController.checkout(req, res);

		expect(Pesanan.create).toHaveBeenCalled();
		expect(Keranjang.create).toHaveBeenCalled();
		expect(req.session.keranjang).toEqual([]);
		expect(res.jsonBody).toEqual({ success: true, id_meja: 'MEJA1' });
	});

	test('checkout: session.keranjang undefined is treated as empty -> 400', async () => {
		const req = mkReq({}, {}, { id_meja: 'MEJA1' }); // no keranjang property
		const res = mkRes();

		await KeranjangController.checkout(req, res);

		expect(res.statusCode).toBe(400);
		expect(res.jsonBody).toEqual({ message: 'Keranjang kosong' });
	});

	test('addToKeranjang: server error -> 500', async () => {
		Menu.findByPk.mockRejectedValue(new Error('DB failure'));
		const req = mkReq({ id_menu: 'M1' }, {}, {});
		const res = mkRes();

		await KeranjangController.addToKeranjang(req, res);

		expect(res.statusCode).toBe(500);
		expect(res.jsonBody).toHaveProperty('error');
	});

	test('updateJumlah: internal error -> 500', async () => {
		// make find throw
		const badKeranjang = { find: () => { throw new Error('boom'); } };
		const req = mkReq({ id_menu: 'M1', action: 'tambah' }, {}, { keranjang: badKeranjang });
		const res = mkRes();

		await KeranjangController.updateJumlah(req, res);

		expect(res.statusCode).toBe(500);
		expect(res.jsonBody).toHaveProperty('error');
	});

	test('deleteItem: internal error -> 500', async () => {
		const badKeranjang = { filter: () => { throw new Error('fail filter'); } };
		const req = mkReq({}, { id_menu: 'M1' }, { keranjang: badKeranjang });
		const res = mkRes();

		await KeranjangController.deleteItem(req, res);

		expect(res.statusCode).toBe(500);
		expect(res.jsonBody).toHaveProperty('error');
	});

	test('updateCatatan: Keranjang.update throws -> 500', async () => {
		Keranjang.update.mockRejectedValue(new Error('DB update failed'));
		const req = mkReq({ id_menu: 'M1', catatan: { note: 'x' } }, {}, { keranjang: [{ id_menu: 'M1' }] });
		const res = mkRes();

		await KeranjangController.updateCatatan(req, res);

		expect(res.statusCode).toBe(500);
		expect(res.jsonBody).toEqual({ success: false, message: 'Terjadi kesalahan server' });
	});

	test('updateCatatan: session has keranjang but item not found -> still calls update', async () => {
		Keranjang.update.mockResolvedValue([1]);
		const req = mkReq({ id_menu: 'M1', catatan: { k: 'v' } }, {}, { keranjang: [{ id_menu: 'OTHER' }] });
		const res = mkRes();

		await KeranjangController.updateCatatan(req, res);

		expect(Keranjang.update).toHaveBeenCalledWith({ catatan: JSON.stringify({ k: 'v' }) }, { where: { id_menu: 'M1' } });
		// session unchanged (item not found)
		expect(req.session.keranjang[0].catatan).toBeUndefined();
		expect(res.jsonBody).toEqual({ success: true, message: 'Catatan diperbarui' });
	});

	test('updateCatatan: catatan null -> JSON.stringify(null) passed to update', async () => {
		Keranjang.update.mockResolvedValue([1]);
		const req = mkReq({ id_menu: 'M1', catatan: null }, {}, { keranjang: [{ id_menu: 'M1' }] });
		const res = mkRes();

		await KeranjangController.updateCatatan(req, res);

		expect(Keranjang.update).toHaveBeenCalledWith({ catatan: JSON.stringify(null) }, { where: { id_menu: 'M1' } });
		expect(req.session.keranjang[0].catatan).toBeNull();
		expect(res.jsonBody).toEqual({ success: true, message: 'Catatan diperbarui' });
	});

	test('checkout: Pesanan.create throws -> 500', async () => {
		mejaController.ensureMejaExists.mockResolvedValue({ id_meja: 'MEJA1' });
		mejaController.hasActivePesanan.mockResolvedValue(false);
		Pesanan.findOne.mockResolvedValue(null); // exercise branch where lastOrder is null
		Pesanan.create.mockRejectedValue(new Error('create fail'));
		Keranjang.findOne.mockResolvedValue(null);

		const req = mkReq({}, {}, { id_meja: 'MEJA1', keranjang: [{ id_menu: 'M1', jumlah: 1, total_harga: 5000 }] });
		const res = mkRes();

		await KeranjangController.checkout(req, res);

		expect(res.statusCode).toBe(500);
		expect(res.jsonBody).toHaveProperty('error');
	});

	test('updateJumlah: initialize empty keranjang when missing', async () => {
		const req = mkReq({ id_menu: 'M1', action: 'tambah' }, {}, {}); // session has no keranjang
		const res = mkRes();

		await KeranjangController.updateJumlah(req, res);

		expect(req.session.keranjang).toEqual([]);
		expect(res.jsonBody).toEqual({ success: false });
	});

	test('updateCatatan: session.keranjang missing still calls Keranjang.update', async () => {
		Keranjang.update.mockResolvedValue([1]);
		const req = mkReq({ id_menu: 'M1', catatan: { note: 'x' } }, {}, {}); // no session.keranjang
		const res = mkRes();

		await KeranjangController.updateCatatan(req, res);

		expect(Keranjang.update).toHaveBeenCalled();
		expect(res.jsonBody).toEqual({ success: true, message: 'Catatan diperbarui' });
	});

	test('checkout: lastOrder present but id_pesanan not matching PSN\d+', async () => {
		mejaController.ensureMejaExists.mockResolvedValue({ id_meja: 'MEJA1' });
		mejaController.hasActivePesanan.mockResolvedValue(false);
		Pesanan.findOne.mockResolvedValue({ id_pesanan: 'OTHER123' }); // non-matching
		Pesanan.create.mockResolvedValue({});
		Keranjang.findOne.mockResolvedValue(null);
		Keranjang.create.mockResolvedValue({});

		const req = mkReq({}, {}, { id_meja: 'MEJA1', keranjang: [{ id_menu: 'M1', jumlah: 1, total_harga: 5000 }] });
		const res = mkRes();

		await KeranjangController.checkout(req, res);

		expect(Pesanan.create).toHaveBeenCalled();
		expect(res.jsonBody).toEqual({ success: true, id_meja: 'MEJA1' });
	});

	test('checkout: sukses membuat pesanan dan multiple keranjang entries', async () => {
		mejaController.ensureMejaExists.mockResolvedValue({ id_meja: 'MEJA1' });
		mejaController.hasActivePesanan.mockResolvedValue(false);

		Pesanan.findOne.mockResolvedValue({ id_pesanan: 'PSN0001' });
		Pesanan.create.mockResolvedValue({ id_pesanan: 'PSN0002' });
		Keranjang.findOne.mockResolvedValue({ id_keranjang: 'KRJ0001' });
		Keranjang.create.mockResolvedValue({});

		const req = mkReq({}, {}, {
			id_meja: 'MEJA1',
			keranjang: [
				{ id_menu: 'M1', jumlah: 2, total_harga: 10000 },
				{ id_menu: 'M2', jumlah: 1, total_harga: 5000 }
			]
		});
		const res = mkRes();

		await KeranjangController.checkout(req, res);

		expect(Pesanan.create).toHaveBeenCalled();
		expect(Keranjang.create).toHaveBeenCalledTimes(2); // Should create 2 keranjang entries
		expect(req.session.keranjang).toEqual([]);
		expect(res.jsonBody).toEqual({ success: true, id_meja: 'MEJA1' });
	});

	test('checkout: lastCart present but id_keranjang not matching KRJ\d+', async () => {
		mejaController.ensureMejaExists.mockResolvedValue({ id_meja: 'MEJA1' });
		mejaController.hasActivePesanan.mockResolvedValue(false);
		Pesanan.findOne.mockResolvedValue(null);
		Pesanan.create.mockResolvedValue({});
		Keranjang.findOne.mockResolvedValue({ id_keranjang: 'BADID' }); // non-matching
		Keranjang.create.mockResolvedValue({});

		const req = mkReq({}, {}, { id_meja: 'MEJA1', keranjang: [{ id_menu: 'M1', jumlah: 1, total_harga: 5000 }] });
		const res = mkRes();

		await KeranjangController.checkout(req, res);

		expect(Keranjang.create).toHaveBeenCalled();
		expect(res.jsonBody).toEqual({ success: true, id_meja: 'MEJA1' });
	});

	test('checkout: Keranjang.create throws error -> 500', async () => {
		mejaController.ensureMejaExists.mockResolvedValue({ id_meja: 'MEJA1' });
		mejaController.hasActivePesanan.mockResolvedValue(false);
		Pesanan.findOne.mockResolvedValue(null);
		Pesanan.create.mockResolvedValue({});
		Keranjang.findOne.mockResolvedValue(null);
		Keranjang.create.mockRejectedValue(new Error('DB error'));

		const req = mkReq({}, {}, { id_meja: 'MEJA1', keranjang: [{ id_menu: 'M1', jumlah: 1, total_harga: 5000 }] });
		const res = mkRes();

		await KeranjangController.checkout(req, res);

		expect(res.statusCode).toBe(500);
		expect(res.jsonBody).toHaveProperty('error');
	});

});
