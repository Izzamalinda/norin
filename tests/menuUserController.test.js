jest.mock('../models', () => ({
  Menu: { count: jest.fn(), findAll: jest.fn(), findOne: jest.fn() },
  Meja: { findOne: jest.fn(), create: jest.fn() },
}));

const { Menu, Meja } = require('../models');
const MenuUserController = require('../controllers/menuUserController');

function mkRes() {
  return {
    statusCode: 200,
    sent: null,
    view: null,
    data: null,
    status(c) { this.statusCode = c; return this; },
    send(msg) { this.sent = msg; return this; },
    render(view, data) { this.view = view; this.data = data; return this; },
  };
}

function mkReq(query = {}, params = {}, session = {}) {
  return { query, params, session };
}

describe('MenuUserController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('getKategoriCount: returns counts from Menu.count', async () => {
    Menu.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2);

    const counts = await MenuUserController.getKategoriCount();

    expect(counts).toEqual({ makananCount: 5, minumanCount: 3, cemilanCount: 2 });
    expect(Menu.count).toHaveBeenCalledTimes(3);
  });

  test('getAllMenu: with meja query creates meja when not found and renders menuUser', async () => {
    const fakeMenus = [{ id_menu: 'M1', nama: 'Nasi' }];
    Menu.findAll.mockResolvedValue(fakeMenus);

    // meja not found -> create
    Meja.findOne.mockResolvedValue(null);
    Meja.create.mockResolvedValue({ id_meja: 'M005', no_meja: '5', qr_code: '/uploads/qrcode/meja-5.png' });

    // counts used by controller.getKategoriCount
    Menu.count.mockResolvedValue(1);

    const req = mkReq({ meja: '5' }, {}, {});
    req.session = {};
    const res = mkRes();

    await MenuUserController.getAllMenu(req, res);

    expect(Meja.findOne).toHaveBeenCalledWith({ where: { no_meja: '5' } });
    expect(Meja.create).toHaveBeenCalledWith({ id_meja: 'M005', no_meja: '5', qr_code: '/uploads/qrcode/meja-5.png' });
    expect(req.session.id_meja).toBe('M005');
    expect(req.session.no_meja).toBe('5');
    expect(res.view).toBe('user/menuUser');
    expect(res.data).toEqual(expect.objectContaining({ menus: fakeMenus }));
  });

  test('getAllMenu: with meja query and meja exists -> does not create and sets session', async () => {
    const fakeMenus = [{ id_menu: 'M9', nama: 'Sate' }];
    Menu.findAll.mockResolvedValue(fakeMenus);

    // meja exists
    Meja.findOne.mockResolvedValue({ id_meja: 'M009', no_meja: '9' });
    Meja.create.mockResolvedValue(null);

    Menu.count.mockResolvedValue(0);

    const req = mkReq({ meja: '9' }, {}, {});
    req.session = {};
    const res = mkRes();

    await MenuUserController.getAllMenu(req, res);

    expect(Meja.findOne).toHaveBeenCalledWith({ where: { no_meja: '9' } });
    expect(Meja.create).not.toHaveBeenCalled();
    expect(req.session.id_meja).toBe('M009');
    expect(req.session.no_meja).toBe('9');
    expect(res.view).toBe('user/menuUser');
  });

  test('getAllMenu: without meja query uses existing session values and renders', async () => {
    const fakeMenus = [{ id_menu: 'M10', nama: 'Pempek' }];
    Menu.findAll.mockResolvedValue(fakeMenus);
    Menu.count.mockResolvedValue(2);

    const req = mkReq({}, {}, {});
    req.session = { id_meja: 'M010', no_meja: '10', keranjang: [{ id_menu: 'M10' }] };
    const res = mkRes();

    await MenuUserController.getAllMenu(req, res);

    expect(Meja.findOne).not.toHaveBeenCalled();
    expect(res.view).toBe('user/menuUser');
    expect(res.data.no_meja).toBe('10');
    expect(res.data.keranjang).toEqual(req.session.keranjang);
  });

  test('getAllMenu: no session no_meja -> renders with no_meja null', async () => {
    const fakeMenus = [{ id_menu: 'M11', nama: 'Rendang' }];
    Menu.findAll.mockResolvedValue(fakeMenus);
    Menu.count.mockResolvedValue(0);

    const req = mkReq({}, {}, {});
    req.session = {}; // no no_meja
    const res = mkRes();

    await MenuUserController.getAllMenu(req, res);

    expect(res.view).toBe('user/menuUser');
    expect(res.data.no_meja).toBeNull();
  });

  test('getMenuByCategory: no no_meja present -> renders with no_meja null', async () => {
    const fakeMenus = [{ id_menu: 'M12', nama: 'Bakwan' }];
    Menu.findAll.mockResolvedValue(fakeMenus);
    Menu.count.mockResolvedValue(0);

    const req = mkReq({}, { kategori: 'cemilan' }, {});
    req.params = { kategori: 'cemilan' };
    req.session = {};
    const res = mkRes();

    await MenuUserController.getMenuByCategory(req, res);

    expect(res.view).toBe('user/menuUser');
    expect(res.data.no_meja).toBeNull();
  });

  test('searchMenu: no no_meja present -> renders with no_meja null', async () => {
    const fakeMenus = [{ id_menu: 'M13', nama: 'Kue' }];
    Menu.findAll.mockResolvedValue(fakeMenus);
    Menu.count.mockResolvedValue(0);

    const req = mkReq({ keyword: 'Ku' }, {}, {});
    req.session = {};
    const res = mkRes();

    await MenuUserController.searchMenu(req, res);

    expect(res.view).toBe('user/menuUser');
    expect(res.data.no_meja).toBeNull();
  });

  test('getAllMenu: error from Menu.findAll -> 500', async () => {
    Menu.findAll.mockRejectedValue(new Error('DB fail'));
    const req = mkReq({}, {}, {});
    req.session = {};
    const res = mkRes();

    await MenuUserController.getAllMenu(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.sent).toContain('Terjadi kesalahan');
  });

  test('getMenuByCategory: calls Menu.findAll with capitalized kategori and renders', async () => {
    const fakeMenus = [{ id_menu: 'M2', nama: 'Teh' }];
    Menu.findAll.mockResolvedValue(fakeMenus);
    Menu.count.mockResolvedValue(0);

    const req = mkReq({}, { }, { });
    req.params = { kategori: 'makanan' };
    req.session = { id_meja: 'X', keranjang: [] };
    const res = mkRes();

    await MenuUserController.getMenuByCategory(req, res);

    expect(Menu.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: expect.any(Object), order: [['nama', 'ASC']] }));
    expect(res.view).toBe('user/menuUser');
    expect(res.data).toEqual(expect.objectContaining({ menus: fakeMenus }));
  });

  test('getMenuByCategory: error -> 500', async () => {
    Menu.findAll.mockRejectedValue(new Error('fail'));
    const req = mkReq(); req.params = { kategori: 'minuman' }; req.session = {};
    const res = mkRes();

    await MenuUserController.getMenuByCategory(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.sent).toContain('Terjadi kesalahan');
  });

  test('searchMenu: finds by keyword and renders', async () => {
    const fakeMenus = [{ id_menu: 'M3', nama: 'Soto' }];
    Menu.findAll.mockResolvedValue(fakeMenus);
    Menu.count.mockResolvedValue(0);

    const req = mkReq({ keyword: 'So' }, {}, { keranjang: [] });
    const res = mkRes();

    await MenuUserController.searchMenu(req, res);

    expect(Menu.findAll).toHaveBeenCalledWith(expect.objectContaining({ where: expect.any(Object), order: [['nama', 'ASC']] }));
    expect(res.view).toBe('user/menuUser');
    expect(res.data.keyword).toBe('So');
  });

  test('searchMenu: error -> 500', async () => {
    Menu.findAll.mockRejectedValue(new Error('fail'));
    const req = mkReq({ keyword: 'x' }, {}, {});
    req.session = {};
    const res = mkRes();

    await MenuUserController.searchMenu(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.sent).toContain('Terjadi kesalahan');
  });

  test('getMenuById: not found -> 404', async () => {
    Menu.findOne.mockResolvedValue(null);
    const req = mkReq({}, { id: 'ID1' }, {});
    req.params = { id: 'ID1' };
    req.session = {};
    const res = mkRes();

    await MenuUserController.getMenuById(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.sent).toBe('Menu tidak ditemukan');
  });

  test('getMenuById: found -> renders menuDetail', async () => {
    const fakeMenu = { id_menu: 'ID2', nama: 'Bakso' };
    Menu.findOne.mockResolvedValue(fakeMenu);
    const req = mkReq({}, { id: 'ID2' }, {});
    req.params = { id: 'ID2' };
    req.session = { id_meja: 'M001' };
    const res = mkRes();

    await MenuUserController.getMenuById(req, res);

    expect(res.view).toBe('user/menuDetail');
    expect(res.data).toEqual({ menu: fakeMenu, no_meja: req.session.id_meja || null });
  });

  test('getMenuById: error -> 500', async () => {
    Menu.findOne.mockRejectedValue(new Error('fail'));
    const req = mkReq(); req.params = { id: 'X' }; req.session = {};
    const res = mkRes();

    await MenuUserController.getMenuById(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.sent).toContain('Terjadi kesalahan');
  });

  test('getMenuPage: query meja present -> sets session for 0 (Takeaway) and non-zero', async () => {
    const req0 = mkReq({ meja: '0' }, {}, {});
    req0.session = {};
    await MenuUserController.getMenuPage(req0);
    expect(req0.session.id_meja).toBe('0');
    expect(req0.session.no_meja).toBe('Takeaway');

    const req5 = mkReq({ meja: '5' }, {}, {});
    req5.session = {};
    await MenuUserController.getMenuPage(req5);
    expect(req5.session.id_meja).toBe('5');
    expect(req5.session.no_meja).toBe('Meja 5');
  });

  test('getMenuPage: no query and no session -> sets Takeaway defaults', async () => {
    const req = mkReq({}, {}, {});
    req.session = {};
    await MenuUserController.getMenuPage(req);
    expect(req.session.id_meja).toBe(0);
    expect(req.session.no_meja).toBe('Takeaway');
  });

  test('getMenuPage: no query but session.id_meja exists -> does not override', async () => {
    const req = mkReq({}, {}, {});
    req.session = { id_meja: 'M100', no_meja: '100' };
    await MenuUserController.getMenuPage(req);
    expect(req.session.id_meja).toBe('M100');
    expect(req.session.no_meja).toBe('100');
  });
});
