
const { Menu } = require("../models");
const path = require("path");
const fs = require("fs");

module.exports = {
  // GET semua menu
  async getAll(req, res) {
    try {
      const menus = await Menu.findAll();
      res.render("kelolaMenu", { title: "Kelola Menu", menus });
    } catch (err) {
      console.error(err);
      res.status(500).send("Gagal mengambil data menu");
    }
  },

  // CREATE menu baru
  async create(req, res) {
    try {
      const { nama, harga, deskripsi, status_menu, kategori } = req.body;
      let foto = null;

      if (req.file) {
        foto = "/uploads/menu/" + req.file.filename;
      }

      await Menu.create({
        nama,
        harga,
        deskripsi,
        status_menu,
        foto,
        kategori,
      });

      res.redirect("/admin/kelola-menu");
    } catch (err) {
      console.error(err);
      res.status(500).send("Gagal menambahkan menu");
    }
  },

  // UPDATE menu
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nama, harga, deskripsi, status_menu, kategori } = req.body;

      const menu = await Menu.findByPk(id);
      if (!menu) return res.status(404).send("Menu tidak ditemukan");

      let foto = menu.foto;
      if (req.file) {
        if (menu.foto) {
          const oldPath = path.join(__dirname, "..", "public", menu.foto);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        foto = "/uploads/menu/" + req.file.filename;
      }

      await menu.update({ nama, harga, deskripsi, status_menu,kategori, foto });
      res.redirect("/admin/kelola-menu");
    } catch (err) {
      console.error(err);
      res.status(500).send("Gagal mengupdate menu");
    }
  },

  // DELETE menu
  async delete(req, res) {
    try {
      const { id } = req.params;
      const menu = await Menu.findByPk(id);
      if (!menu) return res.status(404).send("Menu tidak ditemukan");

      if (menu.foto) {
        const oldPath = path.join(__dirname, "..", "public", menu.foto);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await menu.destroy();
      res.redirect("/admin/kelola-menu");
    } catch (err) {
      console.error(err);
      res.status(500).send("Gagal menghapus menu");
    }
  },
};
