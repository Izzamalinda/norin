jest.spyOn(console, "error").mockImplementation(() => {});

const keranjangViewController = require("../controllers/keranjangViewController");
const { Menu } = require("../models");

jest.mock("../models", () => ({
  Menu: {
    findAll: jest.fn()
  }
}));

describe("KeranjangViewController - viewKeranjang", () => {

  let req, res;

  beforeEach(() => {
    req = {
      session: {
        keranjang: [
          { id_menu: 1, total_harga: 20000 },
          { id_menu: 2, total_harga: 15000 }
        ]
      }
    };

    res = {
      render: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
  });

  test("Berhasil menampilkan halaman keranjang dengan data lengkap", async () => {
    Menu.findAll.mockResolvedValue([
      { id_menu: 1, toJSON: () => ({ id_menu: 1, nama: "Menu A" }) },
      { id_menu: 2, toJSON: () => ({ id_menu: 2, nama: "Menu B" }) }
    ]);

    await keranjangViewController.viewKeranjang(req, res);

    expect(Menu.findAll).toHaveBeenCalledWith({
      where: { id_menu: [1, 2] }
    });

    expect(res.render).toHaveBeenCalledWith("user/keranjang", {
      keranjang: [
        {
          id_menu: 1,
          total_harga: 20000,
          Menu: { id_menu: 1, nama: "Menu A" }
        },
        {
          id_menu: 2,
          total_harga: 15000,
          Menu: { id_menu: 2, nama: "Menu B" }
        }
      ],
      totalHarga: 35000
    });
  });

  test("Mengembalikan status 500 jika terjadi error", async () => {
    Menu.findAll.mockRejectedValue(new Error("DB error"));

    await keranjangViewController.viewKeranjang(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Gagal memuat halaman keranjang");
  });

  // ✅ TEST: Menu tidak ditemukan → Menu = null
  test("Mengatur Menu = null jika menu tidak ditemukan", async () => {
    req.session.keranjang = [
      { id_menu: 99, total_harga: 10000 }
    ];

    Menu.findAll.mockResolvedValue([]); // tidak ada menu cocok

    await keranjangViewController.viewKeranjang(req, res);

    expect(res.render).toHaveBeenCalledWith("user/keranjang", {
      keranjang: [
        {
          id_menu: 99,
          total_harga: 10000,
          Menu: null
        }
      ],
      totalHarga: 10000
    });
  });

  // ✅ TEST BARU: Menangani session tanpa keranjang
  test("Menangani keranjang kosong ketika session tidak ada", async () => {
    req.session = {}; // tidak ada keranjang
    Menu.findAll.mockResolvedValue([]); // aman karena tidak dipanggil jika keranjang = []

    await keranjangViewController.viewKeranjang(req, res);

    expect(res.render).toHaveBeenCalledWith("user/keranjang", {
      keranjang: [],
      totalHarga: 0
    });
  });

});
