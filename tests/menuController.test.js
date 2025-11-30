jest.mock('../models', () => ({
  Menu: { findAll: jest.fn(), create: jest.fn(), findByPk: jest.fn() },
}));

jest.mock('fs', () => ({ existsSync: jest.fn(), unlinkSync: jest.fn() }));

const { Menu } = require('../models');
const fs = require('fs');
const MenuController = require('../controllers/menuController');

function mkRes() {
  return {
    statusCode: 200,
    sent: null,
    view: null,
    data: null,
    redirectUrl: null,
    status(c) { this.statusCode = c; return this; },
    send(msg) { this.sent = msg; return this; },
    render(view, data) { this.view = view; this.data = data; return this; },
    redirect(url) { this.redirectUrl = url; return this; },
  };
}

function mkReq(body = {}, params = {}, file = null) {
  return { body, params, file };
}

describe('MenuController (Unit Test)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('getAll: berhasil render daftar menu', async () => {
    const fakeMenus = [{ id: 'M1', nama: 'Nasi' }];
    Menu.findAll.mockResolvedValue(fakeMenus);

    const req = mkReq();
    const res = mkRes();

    await MenuController.getAll(req, res);

    expect(res.view).toBe('kelolaMenu');
    expect(res.data).toEqual(expect.objectContaining({ menus: fakeMenus }));
  });

  test('getAll: error -> 500', async () => {
    Menu.findAll.mockRejectedValue(new Error('DB fail'));
    const req = mkReq();
    const res = mkRes();

    await MenuController.getAll(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.sent).toBe('Gagal mengambil data menu');
  });

  test('create: with file -> set foto and redirect', async () => {
    Menu.create.mockResolvedValue({});
    const req = mkReq({ nama: 'Nasi', harga: 10000, deskripsi: 'x', status_menu: 'ada', kategori: 'makanan' }, {}, { filename: 'img.jpg' });
    // In controller req.file is object with filename property
    req.file = { filename: 'img.jpg' };
    const res = mkRes();

    await MenuController.create(req, res);

    expect(Menu.create).toHaveBeenCalledWith(expect.objectContaining({ foto: '/uploads/menu/img.jpg' }));
    expect(res.redirectUrl).toBe('/admin/kelola-menu');
  });

  test('create: without file -> foto null', async () => {
    Menu.create.mockResolvedValue({});
    const req = mkReq({ nama: 'Teh', harga: 3000, deskripsi: 'minum', status_menu: 'ada', kategori: 'minuman' });
    const res = mkRes();

    await MenuController.create(req, res);

    expect(Menu.create).toHaveBeenCalledWith(expect.objectContaining({ foto: null }));
    expect(res.redirectUrl).toBe('/admin/kelola-menu');
  });

  test('create: DB error -> 500', async () => {
    Menu.create.mockRejectedValue(new Error('create fail'));
    const req = mkReq({ nama: 'X' });
    const res = mkRes();

    await MenuController.create(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.sent).toBe('Gagal menambahkan menu');
  });

  test('update: menu not found -> 404', async () => {
    Menu.findByPk.mockResolvedValue(null);
    const req = mkReq({ nama: 'A' }, { id: 'M1' });
    const res = mkRes();

    await MenuController.update(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.sent).toBe('Menu tidak ditemukan');
  });

  test('update: without new file keeps old foto and updates', async () => {
    const fakeMenu = { foto: '/uploads/menu/old.jpg', update: jest.fn().mockResolvedValue({}) };
    Menu.findByPk.mockResolvedValue(fakeMenu);

    const req = mkReq({ nama: 'Nasi Uduk', harga: 12000, deskripsi: 'delicious', status_menu: 'ada', kategori: 'makanan' }, { id: 'M1' });
    const res = mkRes();

    await MenuController.update(req, res);

    expect(fakeMenu.update).toHaveBeenCalledWith(expect.objectContaining({ foto: '/uploads/menu/old.jpg' }));
    expect(res.redirectUrl).toBe('/admin/kelola-menu');
  });

  test('update: with new file deletes old foto and sets new foto', async () => {
    const fakeMenu = { foto: '/uploads/menu/old.jpg', update: jest.fn().mockResolvedValue({}) };
    Menu.findByPk.mockResolvedValue(fakeMenu);
    fs.existsSync.mockReturnValue(true);

    const req = mkReq({ nama: 'Nasi Goreng' }, { id: 'M1' });
    req.file = { filename: 'new.jpg' };
    const res = mkRes();

    await MenuController.update(req, res);

    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalled();
    expect(fakeMenu.update).toHaveBeenCalledWith(expect.objectContaining({ foto: '/uploads/menu/new.jpg' }));
    expect(res.redirectUrl).toBe('/admin/kelola-menu');
  });

  test('update: with new file but old file missing -> does not unlink', async () => {
    const fakeMenu = { foto: '/uploads/menu/old.jpg', update: jest.fn().mockResolvedValue({}) };
    Menu.findByPk.mockResolvedValue(fakeMenu);
    fs.existsSync.mockReturnValue(false);

    const req = mkReq({ nama: 'Nasi Bakar' }, { id: 'M1' });
    req.file = { filename: 'new2.jpg' };
    const res = mkRes();

    await MenuController.update(req, res);

    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.unlinkSync).not.toHaveBeenCalled();
    expect(fakeMenu.update).toHaveBeenCalledWith(expect.objectContaining({ foto: '/uploads/menu/new2.jpg' }));
    expect(res.redirectUrl).toBe('/admin/kelola-menu');
  });

  test('update: menu has no foto and new file -> sets new foto without unlink', async () => {
    const fakeMenu = { foto: null, update: jest.fn().mockResolvedValue({}) };
    Menu.findByPk.mockResolvedValue(fakeMenu);
    fs.existsSync.mockClear();

    const req = mkReq({ nama: 'Nasi Telur' }, { id: 'M5' });
    req.file = { filename: 'new3.jpg' };
    const res = mkRes();

    await MenuController.update(req, res);

    expect(fs.existsSync).not.toHaveBeenCalled();
    expect(fakeMenu.update).toHaveBeenCalledWith(expect.objectContaining({ foto: '/uploads/menu/new3.jpg' }));
    expect(res.redirectUrl).toBe('/admin/kelola-menu');
  });

  test('update: error -> 500', async () => {
    Menu.findByPk.mockRejectedValue(new Error('find fail'));
    const req = mkReq({}, { id: 'M1' });
    const res = mkRes();

    await MenuController.update(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.sent).toBe('Gagal mengupdate menu');
  });

  test('delete: not found -> 404', async () => {
    Menu.findByPk.mockResolvedValue(null);
    const req = mkReq({}, { id: 'M1' });
    const res = mkRes();

    await MenuController.delete(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.sent).toBe('Menu tidak ditemukan');
  });

  test('delete: with foto -> unlink and destroy then redirect', async () => {
    const fakeMenu = { foto: '/uploads/menu/old.jpg', destroy: jest.fn().mockResolvedValue({}) };
    Menu.findByPk.mockResolvedValue(fakeMenu);
    fs.existsSync.mockReturnValue(true);

    const req = mkReq({}, { id: 'M1' });
    const res = mkRes();

    await MenuController.delete(req, res);

    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.unlinkSync).toHaveBeenCalled();
    expect(fakeMenu.destroy).toHaveBeenCalled();
    expect(res.redirectUrl).toBe('/admin/kelola-menu');
  });

  test('delete: foto present but file missing -> does not unlink and still destroy', async () => {
    const fakeMenu = { foto: '/uploads/menu/missing.jpg', destroy: jest.fn().mockResolvedValue({}) };
    Menu.findByPk.mockResolvedValue(fakeMenu);
    fs.existsSync.mockReturnValue(false);

    const req = mkReq({}, { id: 'M1' });
    const res = mkRes();

    await MenuController.delete(req, res);

    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.unlinkSync).not.toHaveBeenCalled();
    expect(fakeMenu.destroy).toHaveBeenCalled();
    expect(res.redirectUrl).toBe('/admin/kelola-menu');
  });

  test('delete: without foto -> destroy and redirect', async () => {
    const fakeMenu = { foto: null, destroy: jest.fn().mockResolvedValue({}) };
    Menu.findByPk.mockResolvedValue(fakeMenu);

    const req = mkReq({}, { id: 'M2' });
    const res = mkRes();

    await MenuController.delete(req, res);

    expect(fs.unlinkSync).not.toHaveBeenCalled();
    expect(fakeMenu.destroy).toHaveBeenCalled();
    expect(res.redirectUrl).toBe('/admin/kelola-menu');
  });

  test('delete: error -> 500', async () => {
    Menu.findByPk.mockRejectedValue(new Error('find fail'));
    const req = mkReq({}, { id: 'M3' });
    const res = mkRes();

    await MenuController.delete(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.sent).toBe('Gagal menghapus menu');
  });
});
