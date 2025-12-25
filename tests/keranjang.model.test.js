const { Keranjang, Menu, Pesanan } = require("../models");

describe("Model Keranjang", () => {

  test("Harus memiliki atribut yang benar", () => {
    const attrs = Keranjang.rawAttributes;

    expect(attrs).toHaveProperty("id_keranjang");
    expect(attrs).toHaveProperty("id_menu");
    expect(attrs).toHaveProperty("jumlah");
    expect(attrs).toHaveProperty("catatan");
    expect(attrs).toHaveProperty("total_harga");
    expect(attrs).toHaveProperty("id_pesanan");
  });

  test("id_keranjang harus menjadi primary key", () => {
    const attrs = Keranjang.rawAttributes;

    expect(attrs.id_keranjang.primaryKey).toBe(true);
  });

  test("id_keranjang harus bertipe STRING dengan panjang 50", () => {
    const attrs = Keranjang.rawAttributes;

    expect(attrs.id_keranjang.type.key).toBe("STRING");
    expect(attrs.id_keranjang.type._length).toBe(50);
  });

  test("id_menu tidak boleh null", () => {
    const attrs = Keranjang.rawAttributes;

    expect(attrs.id_menu.allowNull).toBe(false);
  });

  test("id_menu harus bertipe STRING dengan panjang 50", () => {
    const attrs = Keranjang.rawAttributes;

    expect(attrs.id_menu.type.key).toBe("STRING");
    expect(attrs.id_menu.type._length).toBe(50);
  });

  test("jumlah tidak boleh null", () => {
    const attrs = Keranjang.rawAttributes;

    expect(attrs.jumlah.allowNull).toBe(false);
  });

  test("jumlah harus bertipe INTEGER", () => {
    const attrs = Keranjang.rawAttributes;

    expect(attrs.jumlah.type.key).toBe("INTEGER");
  });

  test("catatan boleh null", () => {
    const attrs = Keranjang.rawAttributes;

    expect(attrs.catatan.allowNull).toBe(true);
  });

  test("catatan harus bertipe STRING", () => {
    const attrs = Keranjang.rawAttributes;

    expect(attrs.catatan.type.key).toBe("STRING");
  });

  test("total_harga tidak boleh null", () => {
    const attrs = Keranjang.rawAttributes;

    expect(attrs.total_harga.allowNull).toBe(false);
  });

  test("total_harga harus bertipe INTEGER", () => {
    const attrs = Keranjang.rawAttributes;

    expect(attrs.total_harga.type.key).toBe("INTEGER");
  });

  test("total_harga default value harus 0", () => {
    const attrs = Keranjang.rawAttributes;

    expect(attrs.total_harga.defaultValue).toBe(0);
  });

  test("id_pesanan boleh null", () => {
    const attrs = Keranjang.rawAttributes;

    expect(attrs.id_pesanan.allowNull).toBe(true);
  });

  test("id_pesanan harus bertipe STRING dengan panjang 50", () => {
    const attrs = Keranjang.rawAttributes;

    expect(attrs.id_pesanan.type.key).toBe("STRING");
    expect(attrs.id_pesanan.type._length).toBe(50);
  });

  test("Harus memiliki asosiasi belongsTo dengan Menu", () => {
    const associations = Keranjang.associations;

    expect(associations).toHaveProperty("Menu");
    expect(associations.Menu.foreignKey).toBe("id_menu");
  });

  test("Harus memiliki asosiasi belongsTo dengan Pesanan", () => {
    const associations = Keranjang.associations;

    expect(associations).toHaveProperty("Pesanan");
    expect(associations.Pesanan.foreignKey).toBe("id_pesanan");
  });

});
