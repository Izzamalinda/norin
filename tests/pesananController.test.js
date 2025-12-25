const { getAllPesanan } = require("../controllers/pesananController");
const pesananController = require("../controllers/pesananController");
const { Pesanan, Meja } = require("../models");

jest.mock("../models", () => ({
  Pesanan: {
    count: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  },
  Meja: { findByPk: jest.fn() },
  Keranjang: {},
  Menu: {}
}));

const originalError = console.error;
beforeAll(() => console.error = jest.fn());
afterAll(() => console.error = originalError);


describe("getAllPesanan", () => {
  let req, res;

  beforeEach(() => {
    req = {
      query: {},
      session: { user: { id: 1, name: "Test User" } }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      render: jest.fn(),
      send: jest.fn()
    };
  });

  test("should return correct response when data exists", async () => {
    Pesanan.count.mockResolvedValue(20);
    Pesanan.findAll.mockResolvedValue([
      { id_pesanan: "PS001", Meja: {}, Keranjang: [] }
    ]);


    await getAllPesanan(req, res);

    expect(Pesanan.findAll).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.any(Array),
      order: [["tanggal_pesan", "DESC"]],
      limit: 10,
      offset: 0
    }));

    expect(res.render).toHaveBeenCalledWith(
      "pesanan",
      expect.objectContaining({
        currentPage: 1,
        totalPages: 2,
        pesanan: expect.any(Array)
      })
    );

    expect(Array.isArray(res.render.mock.calls[0][1].pesanan)).toBe(true);

  });

  test("should redirect when page exceeds totalPages", async () => {
    Pesanan.count.mockResolvedValue(20); // 2 pages total
    Pesanan.findAll.mockResolvedValue([]);

    req.query.page = 5; // Request page 5 when only 2 pages exist
    res.redirect = jest.fn();

    await getAllPesanan(req, res);

    expect(res.redirect).toHaveBeenCalledWith("/admin/daftar-pesanan?page=2");
  });

  test("should handle error in getAllPesanan", async () => {
    Pesanan.count.mockRejectedValue(new Error("Database error"));

    await getAllPesanan(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Gagal memuat daftar pesanan");
  });
})

describe("updateStatus", () => {
  let req, res, mockPesanan, mockIO;

  beforeEach(() => {
    mockPesanan = {
      update: jest.fn(),
      Meja: { id_meja: "MJ001", no_meja: "1" },
      id_pesanan: "PS001"
    };

    mockIO = { emit: jest.fn() };

    req = {
      params: { id_pesanan: "PS001" },
      body: { status_pesanan: "Diproses" },
      app: { get: () => mockIO }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      redirect: jest.fn()
    };
  });

  test("should update status and emit websocket event", async () => {
    Pesanan.findByPk.mockResolvedValue(mockPesanan);

    await pesananController.updateStatus(req, res);

    expect(Pesanan.findByPk).toHaveBeenCalledWith("PS001", expect.any(Object));
    expect(mockPesanan.update).toHaveBeenCalledWith({ status_pesanan: "Diproses" });
    expect(mockIO.emit).toHaveBeenCalledWith(
      "statusPesananUpdate",
      expect.objectContaining({
        id_meja: "MJ001",
        no_meja: "1",
        id_pesanan: "PS001",
        status_pesanan: "Diproses"
      })
    );
    expect(res.redirect).toHaveBeenCalledWith("/admin/daftar-pesanan");
  });

  test("should return 404 if pesanan not found", async () => {
    Pesanan.findByPk.mockResolvedValue(null);

    await pesananController.updateStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Pesanan tidak ditemukan");
    expect(mockPesanan.update).not.toHaveBeenCalled();
    expect(mockIO.emit).not.toHaveBeenCalled();
  });

  test("should return 500 on error", async () => {
    Pesanan.findByPk.mockRejectedValue(new Error("DB error"));

    await pesananController.updateStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Gagal mengupdate status pesanan");

  });
})

describe("createPesanan", () => {

  let req, res;

  beforeEach(() => {
    req = {
      body: {
        id_meja: "MJ001",
        total_harga: 50000,
        status_pesanan: "Menunggu Pembayaran",
      },
      app: {
        get: jest.fn().mockReturnValue({ emit: jest.fn() }), // mock socket.io if needed later
      },
    };

    res = {
      status: jest.fn().mockReturnValue({
        json: jest.fn(),
        send: jest.fn()
      }),
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  test("should create pesanan if meja exists", async () => {
    const mockMeja = { id_meja: "MJ001" };
    const mockPesanan = { id_pesanan: "PS001", id_meja: "MJ001" };

    Meja.findByPk.mockResolvedValue(mockMeja);
    Pesanan.create.mockResolvedValue(mockPesanan);

    await pesananController.createPesanan(req, res);

    expect(Meja.findByPk).toHaveBeenCalledWith("MJ001");
    expect(Pesanan.create).toHaveBeenCalledWith(expect.objectContaining({
      id_meja: "MJ001",
      total_harga: 50000,
      status_pesanan: "Menunggu Pembayaran",
    }));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status().json).toHaveBeenCalledWith(expect.objectContaining({
      message: "Pesanan berhasil dibuat",
      pesananBaru: mockPesanan,
    }));
  });

  test("should return 404 if meja not found", async () => {
    Meja.findByPk.mockResolvedValue(null);

    await pesananController.createPesanan(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.status().json).toHaveBeenCalledWith({
      message: "Meja tidak ditemukan",
    });
  });

  test("should use default status when status_pesanan not provided", async () => {
    const mockMeja = { id_meja: "MJ001" };
    const mockPesanan = { id_pesanan: "PS002", id_meja: "MJ001", status_pesanan: "Menunggu Pembayaran" };

    // Remove status_pesanan from req.body
    req.body = {
      id_meja: "MJ001",
      total_harga: 50000
      // status_pesanan is NOT provided
    };

    Meja.findByPk.mockResolvedValue(mockMeja);
    Pesanan.create.mockResolvedValue(mockPesanan);

    await pesananController.createPesanan(req, res);

    expect(Pesanan.create).toHaveBeenCalledWith(expect.objectContaining({
      id_meja: "MJ001",
      total_harga: 50000,
      status_pesanan: "Menunggu Pembayaran", // Should default to this
    }));

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test("should return 500 if database error occurs", async () => {
    Meja.findByPk.mockRejectedValue(new Error("DB error"));

    await pesananController.createPesanan(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status().send).toHaveBeenCalledWith("Gagal membuat pesanan baru");
  });

});

describe("getPesananByMeja", () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id_meja: "MJ001" },
    };

    res = {
      render: jest.fn(),
      status: jest.fn().mockReturnValue({
        send: jest.fn(),
      }),
    };

    jest.clearAllMocks();
  });

  it("should fetch pesanan and render the view with data", async () => {
    const mockPesanan = [
      {
        id_pesanan: "PS001",
        Keranjang: [],
      },
    ];

    Pesanan.findAll.mockResolvedValue(mockPesanan);

    await pesananController.getPesananByMeja(req, res);

    expect(Pesanan.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id_meja: "MJ001",
        }),
        include: expect.any(Array),
        order: [["tanggal_pesan", "DESC"]],
      })
    );

    expect(res.render).toHaveBeenCalledWith("statusPesanan", {
      title: "Status Pesanan Anda",
      pesanan: mockPesanan,
    });
  });

  it("should still render the view when no pesanan found", async () => {
    Pesanan.findAll.mockResolvedValue([]);

    await pesananController.getPesananByMeja(req, res);

    expect(res.render).toHaveBeenCalledWith(
      "statusPesanan",
      expect.objectContaining({
        pesanan: [],
      })
    );
  });

  it("should return 500 on error", async () => {
    Pesanan.findAll.mockRejectedValue(new Error("DB error"));

    await pesananController.getPesananByMeja(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status().send).toHaveBeenCalledWith("Gagal memuat status pesanan");
  });
});

describe("getJumlahPesanan", () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnValue({
        json: jest.fn()
      })
    };
    jest.clearAllMocks();
  });

  test("should return total pesanan count", async () => {
    Pesanan.count.mockResolvedValue(15);

    await pesananController.getJumlahPesanan(req, res);

    expect(Pesanan.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        status_pesanan: expect.any(Object)
      })
    });
    expect(res.json).toHaveBeenCalledWith({ total: 15 });
  });

  test("should return 0 on error", async () => {
    Pesanan.count.mockRejectedValue(new Error("DB error"));

    await pesananController.getJumlahPesanan(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.status().json).toHaveBeenCalledWith({ total: 0 });
  });
});
