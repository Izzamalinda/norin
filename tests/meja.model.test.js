const { Meja, Pesanan } = require("../models");

describe("Model Meja", () => {

  test("Harus memiliki atribut yang benar", () => {
    const attrs = Meja.rawAttributes;

    expect(attrs).toHaveProperty("id_meja");
    expect(attrs).toHaveProperty("no_meja");
    expect(attrs).toHaveProperty("qr_code");
  });

  test("id_meja harus menjadi primary key", () => {
    const attrs = Meja.rawAttributes;

    expect(attrs.id_meja.primaryKey).toBe(true);
  });

  test("id_meja harus bertipe INTEGER dengan autoIncrement", () => {
    const attrs = Meja.rawAttributes;

    expect(attrs.id_meja.type.key).toBe("INTEGER");
    expect(attrs.id_meja.autoIncrement).toBe(true);
  });

  test("no_meja tidak boleh null", () => {
    const attrs = Meja.rawAttributes;

    expect(attrs.no_meja.allowNull).toBe(false);
  });

  test("no_meja harus bertipe STRING", () => {
    const attrs = Meja.rawAttributes;

    expect(attrs.no_meja.type.key).toBe("STRING");
  });

  test("qr_code tidak boleh null", () => {
    const attrs = Meja.rawAttributes;

    expect(attrs.qr_code.allowNull).toBe(false);
  });

  test("qr_code harus bertipe STRING", () => {
    const attrs = Meja.rawAttributes;

    expect(attrs.qr_code.type.key).toBe("STRING");
  });

  test("qr_code harus unique", () => {
    const attrs = Meja.rawAttributes;

    expect(attrs.qr_code.unique).toBe(true);
  });

  test("Harus memiliki asosiasi hasMany dengan Pesanan", () => {
    const associations = Meja.associations;

    expect(associations).toHaveProperty("Pesanans");
    expect(associations.Pesanans.foreignKey).toBe("id_meja");
  });

});