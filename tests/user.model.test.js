const { User, sequelize } = require("../models");

describe("Model User", () => {

  test("Harus memiliki field yang benar", () => {
    const attributes = User.rawAttributes;

    expect(attributes).toHaveProperty("id_user");
    expect(attributes).toHaveProperty("username");
    expect(attributes).toHaveProperty("password");
    expect(attributes).toHaveProperty("security_question");
    expect(attributes).toHaveProperty("security_answer");
  });

  test("Username tidak boleh null", async () => {
    try {
      await User.create({
        id_user: "U001",
        password: "1234",
        security_question: "Apa?",
        security_answer: "Ini"
      });
    } catch (error) {
      expect(error.name).toBe("SequelizeValidationError");
    }
  });

  test("Password tidak boleh null", async () => {
    try {
      await User.create({
        id_user: "U002",
        username: "testing",
        security_question: "apa?",
        security_answer: "ini"
      });
    } catch (error) {
      expect(error.name).toBe("SequelizeValidationError");
    }
  });

});
