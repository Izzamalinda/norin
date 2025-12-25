// __tests__/MejaController.test.js
const path = require("path");
const fs = require("fs");

// Mock models and utils before requiring controller
jest.mock("../models", () => {
  return {
    Meja: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      findByPk: jest.fn(),
    },
    Pesanan: {
      findOne: jest.fn(),
    },
  };
});

jest.mock("../utils/generateQrMeja", () => ({
  generateQrMeja: jest.fn(),
}));

const { Meja, Pesanan } = require("../models");
const { generateQrMeja } = require("../utils/generateQrMeja");

describe("MejaController initialization", () => {
  let existsSpy;
  let mkdirSpy;

  beforeEach(() => {
    jest.resetModules(); // penting: re-require module
    existsSpy = jest.spyOn(fs, "existsSync");
    mkdirSpy = jest.spyOn(fs, "mkdirSync").mockImplementation(() => {});
  });

  afterEach(() => {
    existsSpy.mockRestore();
    mkdirSpy.mockRestore();
  });

  test("creates qrDir when it does NOT exist", () => {
    existsSpy.mockReturnValue(false);

    // require ulang controller untuk trigger line 7
    const ctrl = require("../controllers/mejaController");

    expect(existsSpy).toHaveBeenCalled();
    expect(mkdirSpy).toHaveBeenCalled();
  });

  test("does NOT create qrDir when it already exists", () => {
    existsSpy.mockReturnValue(true);

    const ctrl = require("../controllers/mejaController");

    expect(existsSpy).toHaveBeenCalled();
    expect(mkdirSpy).not.toHaveBeenCalled();
  });
});

// Require controller after mocks
const mejaController = require("../controllers/mejaController"); // adjust path if needed

describe("MejaController", () => {
  let req;
  let res;
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    console.error = jest.fn();

    req = {
      body: {},
      params: {},
    };

    res = {
      render: jest.fn(),
      redirect: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  describe("listMeja", () => {
    test("renders daftar-meja with data on success", async () => {
      const fakeRows = [{ id_meja: "MJ001", no_meja: 1 }];
      Meja.findAll.mockResolvedValue(fakeRows);

      await mejaController.listMeja(req, res);

      expect(Meja.findAll).toHaveBeenCalledWith({ order: [["no_meja", "ASC"]] });
      expect(res.render).toHaveBeenCalledWith("daftar-meja", expect.objectContaining({
        title: "Daftar Meja",
        mejaList: fakeRows,
      }));
    });

    test("returns 500 when findAll throws", async () => {
      Meja.findAll.mockRejectedValue(new Error("DB fail"));

      await mejaController.listMeja(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith("Gagal memuat daftar meja.");
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("renderGeneratePage", () => {
    test("renders generate-meja with null qr and message", () => {
      mejaController.renderGeneratePage(req, res);

      expect(res.render).toHaveBeenCalledWith("generate-meja", {
        title: "Generate QR Meja",
        qr: null,
        message: null,
      });
    });
  });

  describe("generateMeja", () => {
    test("renders warning when meja exists", async () => {
      req.body.no_meja = 5;
      Meja.findOne.mockResolvedValue({ id_meja: "MJ005", no_meja: 5 });

      await mejaController.generateMeja(req, res);

      expect(Meja.findOne).toHaveBeenCalledWith({ where: { no_meja: 5 } });
      expect(res.render).toHaveBeenCalledWith("generate-meja", {
        title: "Generate QR Meja",
        qr: null,
        message: expect.stringContaining("Nomor meja 5 sudah ada"),
      });
      expect(generateQrMeja).not.toHaveBeenCalled();
    });

    test("creates meja and renders qr on success", async () => {
      req.body.no_meja = 7;
      Meja.findOne.mockResolvedValue(null);
      generateQrMeja.mockResolvedValue("/uploads/qrcode/meja-7.png");
      Meja.create.mockResolvedValue({ id_meja: "MJ007", no_meja: 7, qr_code: "/uploads/qrcode/meja-7.png" });

      await mejaController.generateMeja(req, res);

      expect(Meja.findOne).toHaveBeenCalledWith({ where: { no_meja: 7 } });
      expect(generateQrMeja).toHaveBeenCalledWith(7, expect.any(String));
      expect(Meja.create).toHaveBeenCalledWith({
        id_meja: "MJ" + String(7).padStart(3, "0"),
        no_meja: 7,
        qr_code: "/uploads/qrcode/meja-7.png",
      });
      expect(res.render).toHaveBeenCalledWith("generate-meja", {
        title: "Generate QR Meja",
        qr: "/uploads/qrcode/meja-7.png",
        message: expect.stringContaining("QR Code untuk meja 7 berhasil dibuat"),
      });
    });

    test("returns 500 on error", async () => {
      req.body.no_meja = 9;
      Meja.findOne.mockRejectedValue(new Error("boom"));

      await mejaController.generateMeja(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith("Gagal membuat QR Code.");
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("deleteMeja", () => {
    test("returns 404 when meja not found", async () => {
      req.params.id = "nonexistent";
      Meja.findByPk.mockResolvedValue(null);

      await mejaController.deleteMeja(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith("Data meja tidak ditemukan.");
    });

    test("deletes file when exists and destroys meja then redirects", async () => {
      req.params.id = "MJ010";
      const fakeMeja = {
        id_meja: "MJ010",
        no_meja: 10,
        qr_code: "uploads/qrcode/meja-10.png",
        destroy: jest.fn().mockResolvedValue(),
      };
      Meja.findByPk.mockResolvedValue(fakeMeja);

      // mock fs.existsSync and unlinkSync
      const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);
      const unlinkSpy = jest.spyOn(fs, "unlinkSync").mockImplementation(() => {});

      await mejaController.deleteMeja(req, res);

      // expected path should include the stored qr_code
      expect(existsSpy).toHaveBeenCalled();
      expect(unlinkSpy).toHaveBeenCalled();
      expect(fakeMeja.destroy).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith("/meja/list");

      existsSpy.mockRestore();
      unlinkSpy.mockRestore();
    });

    test("destroys meja and redirects when file missing", async () => {
      req.params.id = "MJ011";
      const fakeMeja = {
        id_meja: "MJ011",
        no_meja: 11,
        qr_code: "uploads/qrcode/meja-11.png",
        destroy: jest.fn().mockResolvedValue(),
      };
      Meja.findByPk.mockResolvedValue(fakeMeja);

      const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(false);
      const unlinkSpy = jest.spyOn(fs, "unlinkSync").mockImplementation(() => {});

      await mejaController.deleteMeja(req, res);

      expect(existsSpy).toHaveBeenCalled();
      expect(unlinkSpy).not.toHaveBeenCalled(); // because file doesn't exist
      expect(fakeMeja.destroy).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith("/meja/list");

      existsSpy.mockRestore();
      unlinkSpy.mockRestore();
    });
    
    test("returns 500 on error", async () => {
      req.params.id = "MJ012";
      Meja.findByPk.mockRejectedValue(new Error("fail"));

      await mejaController.deleteMeja(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith("Gagal menghapus data meja.");
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("hasActivePesanan", () => {
    test("returns true if Pesanan.findOne returns a record", async () => {
      Pesanan.findOne.mockResolvedValue({ id: 1 });

      const result = await mejaController.hasActivePesanan("MJ001");

      expect(Pesanan.findOne).toHaveBeenCalledWith({
        where: {
          id_meja: "MJ001",
          status_pesanan: ["Menunggu Pembayaran", "Diproses"],
        },
      });
      expect(result).toBe(true);
    });

    test("returns false if Pesanan.findOne returns null", async () => {
      Pesanan.findOne.mockResolvedValue(null);

      const result = await mejaController.hasActivePesanan("MJ002");

      expect(result).toBe(false);
    });
  });

  describe("ensureMejaExists", () => {
    test("returns existing meja when found", async () => {
      const found = { id_meja: "MJ020", no_meja: 20 };
      Meja.findByPk.mockResolvedValue(found);

      const result = await mejaController.ensureMejaExists("MJ020", 20);

      expect(Meja.findByPk).toHaveBeenCalledWith("MJ020");
      expect(result).toBe(found);
    });
    test("returns existing meja even when no_meja is null", async () => {
  const found = { id_meja: "MJ050", no_meja: 50 };
  Meja.findByPk.mockResolvedValue(found);

  const result = await mejaController.ensureMejaExists("MJ050", null);

  expect(Meja.findByPk).toHaveBeenCalledWith("MJ050");
  expect(Meja.create).not.toHaveBeenCalled();
  expect(result).toBe(found);
});


    test("creates meja when not found and no_meja provided", async () => {
      Meja.findByPk.mockResolvedValue(null);
      Meja.create.mockResolvedValue({ id_meja: "MJ030", no_meja: 30, qr_code: "/uploads/qrcode/meja-30.png" });

      const result = await mejaController.ensureMejaExists("MJ030", 30);

      expect(Meja.findByPk).toHaveBeenCalledWith("MJ030");
      expect(Meja.create).toHaveBeenCalledWith({
        id_meja: "MJ030",
        no_meja: 30,
        qr_code: `/uploads/qrcode/meja-30.png`,
      });
      expect(result).toEqual(expect.objectContaining({ id_meja: "MJ030" }));
    });

    test("returns null when not found and no no_meja provided", async () => {
      Meja.findByPk.mockResolvedValue(null);

      const result = await mejaController.ensureMejaExists("MJ040", null);

      expect(result).toBeNull();
    });

    test("triggers default parameter for no_meja", async () => {
      Meja.findByPk.mockResolvedValue(null);

      // Call with only one argument to trigger no_meja = null default
      const result = await mejaController.ensureMejaExists("MJ099");

      expect(Meja.findByPk).toHaveBeenCalledWith("MJ099");
      expect(result).toBeNull();
    });
  });
});
