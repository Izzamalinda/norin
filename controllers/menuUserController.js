const { Menu, Meja } = require("../models");
const { Op } = require("sequelize");

class MenuUserController {

  async getKategoriCount() {
    return {
      makananCount: await Menu.count({ where: { kategori: { [Op.like]: "%Makanan%" } } }),
      minumanCount: await Menu.count({ where: { kategori: { [Op.like]: "%Minuman%" } } }),
      cemilanCount: await Menu.count({ where: { kategori: { [Op.like]: "%Cemilan%" } } }),
    };
  }

  async getAllMenu(req, res) {
    try {
      const mejaQuery = req.query.meja;

      if (mejaQuery) {
        let meja = await Meja.findOne({ where: { no_meja: mejaQuery } });
        if (!meja) {
          const id_meja = "M" + String(mejaQuery).padStart(3, "0");
          const qr_path = `/uploads/qrcode/meja-${mejaQuery}.png`;
          meja = await Meja.create({ id_meja, no_meja: mejaQuery, qr_code: qr_path });
        }

        req.session.id_meja = meja.id_meja;
        req.session.no_meja = meja.no_meja;
      }

      const menus = await Menu.findAll({
        where: { status_menu: "available" },
        order: [["nama", "ASC"]],
      });

      const counts = await this.getKategoriCount();

      res.render("user/menuUser", {
        menus,
        no_meja: req.session.no_meja || null,
        keranjang: req.session.keranjang || [],
        ...counts,
        keyword: null,
      });
    } catch (error) {
      console.error("❌ getAllMenu:", error);
      res.status(500).send("Terjadi kesalahan: " + error.message);
    }
  }

  async getMenuByCategory(req, res) {
    try {
      const { kategori } = req.params;
      const no_meja = req.query.meja || req.session.id_meja || null;

      const menus = await Menu.findAll({
        where: {
          kategori: { [Op.substring]: kategori.charAt(0).toUpperCase() + kategori.slice(1).toLowerCase() },
          status_menu: "available",
        },
        order: [["nama", "ASC"]],
      });

      const counts = await this.getKategoriCount();

      res.render("user/menuUser", {
        menus,
        keyword: null,
        no_meja,
        keranjang: req.session.keranjang || [],
        ...counts,
      });
    } catch (error) {
      console.error("❌ getMenuByCategory:", error);
      res.status(500).send("Terjadi kesalahan: " + error.message);
    }
  }

  async searchMenu(req, res) {
    try {
      const { keyword } = req.query;
      const no_meja = req.query.meja || req.session.id_meja || null;

      const menus = await Menu.findAll({
        where: {
          nama: { [Op.like]: `%${keyword}%` },
          status_menu: "available",
        },
        order: [["nama", "ASC"]],
      });

      const counts = await this.getKategoriCount();

      res.render("user/menuUser", {
        menus,
        keyword,
        no_meja,
        keranjang: req.session.keranjang || [],
        ...counts,
      });
    } catch (error) {
      console.error("❌ searchMenu:", error);
      res.status(500).send("Terjadi kesalahan: " + error.message);
    }
  }

  async getMenuById(req, res) {
    try {
      const { id } = req.params;
      const no_meja = req.query.meja || req.session.id_meja || null;

      const menu = await Menu.findOne({ where: { id_menu: id } });
      if (!menu) return res.status(404).send("Menu tidak ditemukan");

      res.render("user/menuDetail", { menu, no_meja });
    } catch (error) {
      res.status(500).send("Terjadi kesalahan: " + error.message);
    }
  }

  async getMenuPage(req) {
    const mejaQuery = req.query.meja;

    // Jika user akses /menu?meja=0 → Takeaway
    if (mejaQuery !== undefined) {
      req.session.id_meja = mejaQuery;
      req.session.no_meja = mejaQuery === "0"
        ? "Takeaway"
        : `Meja ${mejaQuery}`;
      return;
    }

    // Fallback → Takeaway
    if (!req.session.id_meja) {
      req.session.id_meja = 0;
      req.session.no_meja = "Takeaway";
    }
  }
}


module.exports = new MenuUserController();
