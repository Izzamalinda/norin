const { Menu } = require("../models");

describe("Model Menu", () => {

  test("Harus memiliki atribut yang benar", () => {
    const attrs = Menu.rawAttributes;

    expect(attrs).toHaveProperty("id_menu");
    expect(attrs).toHaveProperty("nama");
    expect(attrs).toHaveProperty("harga");
    expect(attrs).toHaveProperty("deskripsi");
    expect(attrs).toHaveProperty("foto");
    expect(attrs).toHaveProperty("status_menu");
    expect(attrs).toHaveProperty("kategori");
  });

  test("Status menu default harus 'available'", () => {
    expect(Menu.rawAttributes.status_menu.defaultValue).toBe("available");
  });

  test("Kategori default harus 'Makanan'", () => {
    expect(Menu.rawAttributes.kategori.defaultValue).toBe("Makanan");
  });

  test("Hook beforeCreate harus generate id_menu baru", async () => {
    jest.spyOn(Menu, "findOne").mockResolvedValue({
      id_menu: "M005"
    });

    const instance = Menu.build({
      nama: "Ayam Bakar",
      harga: 20000
    });

    await Menu.runHooks("beforeCreate", instance);

    expect(instance.id_menu).toBe("M006");
  });

  test("Hook beforeCreate harus generate M001 jika belum ada menu", async () => {
    jest.spyOn(Menu, "findOne").mockResolvedValue(null);

    const instance = Menu.build({
      nama: "Nasi Goreng",
      harga: 15000
    });

    await Menu.runHooks("beforeCreate", instance);

    expect(instance.id_menu).toBe("M001");
  });

});
