const { Keranjang, Menu } = require("../models");

class KeranjangViewController {

  async viewKeranjang(req, res) {
    try {
      const keranjangSession = req.session.keranjang || [];

      const menuIds = keranjangSession.map(i => i.id_menu);
      const menus = await Menu.findAll({
        where: { id_menu: menuIds }
      });

      const keranjang = keranjangSession.map(item => {
        const menuData = menus.find(m => m.id_menu === item.id_menu);
        return {
          ...item,
          Menu: menuData ? menuData.toJSON() : null
        };
      });

      const totalHarga = keranjang.reduce((sum, i) => sum + i.total_harga, 0);

      res.render("user/keranjang", {
        keranjang,
        totalHarga
      });

    } catch (err) {
      console.error("❌ viewKeranjang:", err);
      res.status(500).send("Gagal memuat halaman keranjang");
    }
  }

}

module.exports = new KeranjangViewController();
