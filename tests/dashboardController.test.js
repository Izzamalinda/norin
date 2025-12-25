// tests/dashboardController.test.js

// tests/dashboardController.test.js

const moment = require("moment");

jest.mock("../models", () => ({
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
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  test("renderDashboard: harus render dashboardAdmin", () => {
    const req = mkReq();
    const res = mkRes();

    DashboardController.renderDashboard(req, res);

    expect(res.renderView).toBe("dashboardAdmin");
    expect(res.renderData).toEqual(expect.objectContaining({ title: "Dashboard" }));
  });

  // getSummary - success
  test("getSummary: sukses mengembalikan ringkasan", async () => {
    sequelize.query
      .mockResolvedValueOnce([{ revenue: 120000 }])
      .mockResolvedValueOnce([{ total: 5 }])
      .mockResolvedValueOnce([{ cnt: 3 }]);

    Menu.count.mockResolvedValue(10);

    const req = mkReq();
    const res = mkRes();

    await DashboardController.getSummary(req, res);

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

  // NEW TEST: cover missing branch when revenueToday is null -> should fallback to 0
  test("getSummary: fallback revenueToday = 0 ketika revenue NULL", async () => {
    sequelize.query
      .mockResolvedValueOnce([{ revenue: null }]) // revenue missing
      .mockResolvedValueOnce([{ total: 5 }])
      .mockResolvedValueOnce([{ cnt: 3 }]);

    Menu.count.mockResolvedValue(8);

    const req = mkReq();
    const res = mkRes();

    await DashboardController.getSummary(req, res);

    expect(res.jsonData.data.revenueToday).toBe(0);
  });

  // NEW TEST: fallback totalPesanan = 0 ketika total NULL
  test("getSummary: fallback totalPesanan = 0 ketika total NULL", async () => {
    sequelize.query
      .mockResolvedValueOnce([{ revenue: 100 }])
      .mockResolvedValueOnce([{ total: null }]) // total missing
      .mockResolvedValueOnce([{ cnt: 1 }]);

    Menu.count.mockResolvedValue(5);

    const req = mkReq();
    const res = mkRes();

    await DashboardController.getSummary(req, res);

    expect(res.jsonData.data.totalPesanan).toBe(0);
  });

  // NEW TEST: fallback customerAktif = 0 ketika cnt NULL
  test("getSummary: fallback customerAktif = 0 ketika cnt NULL", async () => {
    sequelize.query
      .mockResolvedValueOnce([{ revenue: 100 }])
      .mockResolvedValueOnce([{ total: 5 }])
      .mockResolvedValueOnce([{ cnt: null }]); // cnt missing

    Menu.count.mockResolvedValue(12);

    const req = mkReq();
    const res = mkRes();

    await DashboardController.getSummary(req, res);

    expect(res.jsonData.data.customerAktif).toBe(0);
  });

  // getSummary - fallback Menu.count
  test("getSummary: fallback menuAktif when first count fails", async () => {
    sequelize.query
      .mockResolvedValueOnce([{ revenue: 0 }])
      .mockResolvedValueOnce([{ total: 0 }])
      .mockResolvedValueOnce([{ cnt: 0 }]);

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
    expect(res.jsonData.success).toBe(false);
  });

  // getSalesAnalytics - success
  test("getSalesAnalytics: sukses return series sesuai range", async () => {
    const today = new Date();
    const d1 = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const fmt = (dt) => dt.toISOString().slice(0, 10);

    sequelize.query.mockResolvedValue([
      { date: fmt(d1), revenue: 10000 },
      { date: fmt(today), revenue: 5000 },
    ]);

    const req = mkReq({}, { range: "2" });
    const res = mkRes();

    await DashboardController.getSalesAnalytics(req, res);

    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data.series.length).toBe(2);
  });

  test("getSalesAnalytics: tanggal tanpa data harus return revenue = 0", async () => {
  const today = moment().format("YYYY-MM-DD");
  const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

  // Hanya ada 1 row → hari kemarin TIDAK ADA di DB
  sequelize.query.mockResolvedValue([
    { date: today, revenue: 5000 },
  ]);

  const req = mkReq({}, { range: "2" });
  const res = mkRes();

  await DashboardController.getSalesAnalytics(req, res);

  const series = res.jsonData.data.series;

  // Pastikan panjang tetap 2 (range=2)
  expect(series.length).toBe(2);

  // Hari pertama (kemarin) tidak ada → revenue 0
  expect(series[0].revenue).toBe(0);

  // Hari kedua (hari ini) sesuai DB
  expect(series[1].revenue).toBe(5000);
});


  // getSalesAnalytics - error
  test("getSalesAnalytics: error -> 500", async () => {
    sequelize.query.mockRejectedValue(new Error("fail"));

    const req = mkReq();
    const res = mkRes();

    await DashboardController.getSalesAnalytics(req, res);

    expect(res.statusCode).toBe(500);
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
  });

  // getTopMenus - error
  test("getTopMenus: error -> 500", async () => {
    sequelize.query.mockRejectedValue(new Error("fail"));

    const req = mkReq();
    const res = mkRes();

    await DashboardController.getTopMenus(req, res);

    expect(res.statusCode).toBe(500);
  });

  // getRecentActivities - success
  test("getRecentActivities: sukses return activities and pagination", async () => {
    sequelize.query
      .mockResolvedValueOnce([{ total: 10 }])
      .mockResolvedValueOnce([
        {
          id_pesanan: "P1",
          tanggal_pesan: "2025-01-01",
          status_pesanan: "Selesai",
          total_amount: 15000,
          items: "Nasi x1, Teh x1",
        },
      ]);

    const req = mkReq({}, { page: "1", limit: "5" });
    const res = mkRes();

    await DashboardController.getRecentActivities(req, res);

    expect(res.jsonData.success).toBe(true);
  });

  // getRecentActivities - error
  test("getRecentActivities: error -> 500", async () => {
    sequelize.query.mockRejectedValue(new Error("fail"));

    const req = mkReq();
    const res = mkRes();

    await DashboardController.getRecentActivities(req, res);

    expect(res.statusCode).toBe(500);
  });

  // createMenuQuick - success
  test("createMenuQuick: berhasil membuat menu", async () => {
    const fakeMenu = { id_menu: "M1", nama: "Sate", harga: 15000 };
    Menu.create.mockResolvedValue(fakeMenu);

    const req = mkReq({
      nama: "Sate",
      harga: 15000,
      kategori: "makanan",
      deskripsi: "enak"
    });

    const res = mkRes();

    await DashboardController.createMenuQuick(req, res);

    expect(res.jsonData.success).toBe(true);
  });

  // createMenuQuick - invalid
  test("createMenuQuick: gagal karena nama/harga kosong", async () => {
    const req = mkReq({ nama: "", harga: null });
    const res = mkRes();

    await DashboardController.createMenuQuick(req, res);

    expect(res.statusCode).toBe(400);
  });

  // createMenuQuick - error DB
  test("createMenuQuick: error -> 500", async () => {
    Menu.create.mockRejectedValue(new Error("DB error"));

    const req = mkReq({ nama: "Ayam", harga: 20000 });
    const res = mkRes();

    await DashboardController.createMenuQuick(req, res);

    expect(res.statusCode).toBe(500);
  });
});
