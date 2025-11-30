// tests/dashboardController.test.js

jest.mock("../models", () => ({
  // mock object shape sesuai yang digunakan di controller
  Menu: {
    count: jest.fn(),
    create: jest.fn(),
  },
  sequelize: {
    query: jest.fn(),
  },
}));

const { Menu, sequelize } = require("../models");
const DashboardController = require("../controllers/dashboardController");

// helper untuk membuat response palsu mirip express.Response
function mkRes() {
  return {
    statusCode: 200,
    jsonData: null,
    renderView: null,
    renderData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.jsonData = payload;
      return this;
    },
    render(view, data) {
      this.renderView = view;
      this.renderData = data;
      return this;
    },
  };
}

function mkReq(body = {}, query = {}, params = {}) {
  return { body, query, params };
}

describe("DashboardController (Unit Test)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {}); // supress console.error in tests
  });

  // renderDashboard
  test("renderDashboard: harus render dashboardAdmin", () => {
    const req = mkReq();
    const res = mkRes();

    DashboardController.renderDashboard(req, res);

    expect(res.renderView).toBe("dashboardAdmin");
    expect(res.renderData).toEqual(expect.objectContaining({ title: "Dashboard" }));
  });

  // getSummary - success
  test("getSummary: sukses mengembalikan ringkasan", async () => {
    // controller calls sequelize.query three times (q2, qTotal, q3) in that order
    sequelize.query
      .mockResolvedValueOnce([{ revenue: 120000 }]) // revenueToday
      .mockResolvedValueOnce([{ total: 5 }])        // totalPesanan
      .mockResolvedValueOnce([{ cnt: 3 }]);         // customerAktif

    Menu.count.mockResolvedValue(10); // menuAktif

    const req = mkReq();
    const res = mkRes();

    await DashboardController.getSummary(req, res);

    expect(res.jsonData).not.toBeNull();
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data).toEqual(
      expect.objectContaining({
        revenueToday: 120000,
        totalPesanan: 5,
        menuAktif: 10,
        customerAktif: 3,
      })
    );
  });

  // getSummary - fallback Menu.count
  test("getSummary: fallback menuAktif when first count fails", async () => {
    sequelize.query
      .mockResolvedValueOnce([{ revenue: 0 }])
      .mockResolvedValueOnce([{ total: 0 }])
      .mockResolvedValueOnce([{ cnt: 0 }]);

    // first call (with where) fails, second call (fallback) returns 7
    Menu.count
      .mockRejectedValueOnce(new Error("filtered count fail"))
      .mockResolvedValueOnce(7);

    const req = mkReq();
    const res = mkRes();

    await DashboardController.getSummary(req, res);

    expect(res.jsonData.data.menuAktif).toBe(7);
  });

  // getSummary - error
  test("getSummary: jika terjadi error -> status 500", async () => {
    sequelize.query.mockRejectedValue(new Error("DB error"));

    const req = mkReq();
    const res = mkRes();

    await DashboardController.getSummary(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData).toEqual(
      expect.objectContaining({ success: false, message: "Server error" })
    );
  });

  // getSalesAnalytics - success
  test("getSalesAnalytics: sukses return series sesuai range", async () => {
    // controller builds 'days' array then calls sequelize.query once
    // Provide rows with date matching the days it will compute.
    // For simplicity: if range=2, days will be [yesterday, today]
    const today = new Date();
    const d1 = new Date(Date.now() - 24 * 60 * 60 * 1000); // yesterday
    const fmt = (dt) => dt.toISOString().slice(0, 10);

    sequelize.query.mockResolvedValue([
      { date: fmt(d1), revenue: 10000 },
      { date: fmt(today), revenue: 5000 },
    ]);

    const req = mkReq({}, { range: "2" });
    const res = mkRes();

    await DashboardController.getSalesAnalytics(req, res);

    expect(res.jsonData.success).toBe(true);
    expect(Array.isArray(res.jsonData.data.series)).toBe(true);
    expect(res.jsonData.data.series.length).toBe(2);
    // each series item has date and revenue
    res.jsonData.data.series.forEach(item => {
      expect(item).toHaveProperty("date");
      expect(item).toHaveProperty("revenue");
    });
  });

  // getSalesAnalytics - error
  test("getSalesAnalytics: error -> 500", async () => {
    sequelize.query.mockRejectedValue(new Error("fail"));

    const req = mkReq();
    const res = mkRes();

    await DashboardController.getSalesAnalytics(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
  });

  // getTopMenus - success
  test("getTopMenus: sukses mengembalikan top menu", async () => {
    sequelize.query.mockResolvedValue([
      { nama_menu: "Nasi Goreng", total_terjual: 20 },
      { nama_menu: "Ayam Bakar", total_terjual: 15 },
    ]);

    const req = mkReq({}, { days: "7" });
    const res = mkRes();

    await DashboardController.getTopMenus(req, res);

    expect(res.jsonData.success).toBe(true);
    expect(Array.isArray(res.jsonData.data)).toBe(true);
    expect(res.jsonData.data.length).toBe(2);
    expect(res.jsonData.data[0]).toEqual(
      expect.objectContaining({ nama_menu: "Nasi Goreng", total_terjual: 20 })
    );
  });

  // getTopMenus - error
  test("getTopMenus: error -> 500", async () => {
    sequelize.query.mockRejectedValue(new Error("fail"));

    const req = mkReq();
    const res = mkRes();

    await DashboardController.getTopMenus(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
  });

  // getRecentActivities - success
  test("getRecentActivities: sukses return activities and pagination", async () => {
    // first sequelize.query => countResult
    // second sequelize.query => rows
    sequelize.query
      .mockResolvedValueOnce([{ total: 10 }]) // count
      .mockResolvedValueOnce([
        {
          id_pesanan: "P1",
          tanggal_pesan: "2025-01-01",
          status_pesanan: "Selesai",
          total_amount: 15000,
          items: "Nasi x1, Teh x1",
        },
      ]); // rows

    const req = mkReq({}, { page: "1", limit: "5" });
    const res = mkRes();

    await DashboardController.getRecentActivities(req, res);

    expect(res.jsonData.success).toBe(true);
    expect(Array.isArray(res.jsonData.data)).toBe(true);
    expect(res.jsonData.data.length).toBe(1);
    expect(res.jsonData.pagination).toEqual(
      expect.objectContaining({ page: 1, totalPages: Math.ceil(10 / 5), totalData: 10 })
    );
  });

  // getRecentActivities - error
  test("getRecentActivities: error -> 500", async () => {
    sequelize.query.mockRejectedValue(new Error("fail"));

    const req = mkReq();
    const res = mkRes();

    await DashboardController.getRecentActivities(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData.success).toBe(false);
  });

  // createMenuQuick - success
  test("createMenuQuick: berhasil membuat menu", async () => {
    const fakeMenu = { id_menu: "M1", nama: "Sate", harga: 15000 };
    Menu.create.mockResolvedValue(fakeMenu);

    const req = mkReq({ nama: "Sate", harga: 15000, kategori: "makanan", deskripsi: "enak" });
    const res = mkRes();

    await DashboardController.createMenuQuick(req, res);

    expect(Menu.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nama: "Sate",
        harga: 15000,
        kategori: "makanan",
        deskripsi: "enak",
        status_menu: "aktif",
        foto: "",
      })
    );

    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data).toEqual(fakeMenu);
  });

  // createMenuQuick - missing nama/harga -> 400
  test("createMenuQuick: jika nama/harga kosong -> 400", async () => {
    const req = mkReq({ nama: "", harga: null });
    const res = mkRes();

    await DashboardController.createMenuQuick(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toEqual(expect.objectContaining({ success: false, message: "nama & harga wajib diisi" }));
  });

  // createMenuQuick - DB error -> 500
  test("createMenuQuick: DB error -> 500", async () => {
    Menu.create.mockRejectedValue(new Error("create fail"));

    const req = mkReq({ nama: "A", harga: 1000 });
    const res = mkRes();

    await DashboardController.createMenuQuick(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData).toEqual(expect.objectContaining({ success: false }));
  });
});
