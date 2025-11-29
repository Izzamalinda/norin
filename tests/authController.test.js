jest.mock("bcrypt", () => ({
  compare: jest.fn()
}));

jest.mock("../models", () => ({
  User: {
    findOne: jest.fn()
  }
}));

const bcrypt = require("bcrypt");
const { User } = require("../models");
const AuthController = require("../controllers/authController");

function mkRes() {
  return {
    statusCode: 200,
    view: null,
    redirectUrl: null,
    jsonBody: null,
    render(view, data) { this.view = view; this.jsonBody = data; return this; },
    json(obj) { this.jsonBody = obj; return this; },
    status(c) { this.statusCode = c; return this; },
    send(msg) { this.jsonBody = msg; return this; },
    redirect(url) { this.redirectUrl = url; return this; },
    clearCookie: jest.fn()
  };
}

function mkReq(body = {}, query = {}, session = {}) {
  return { body, query, session };
}

describe("AuthController (Unit Test)", () => {

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(console, "log").mockImplementation(() => {});
      jest.spyOn(console, "error").mockImplementation(() => {});
  });

  test("getLoginAdmin: render login page", () => {
    const res = mkRes();
    AuthController.getLoginAdmin({}, res);
    expect(res.view).toBe("loginAdmin");
    expect(res.jsonBody.error).toBe(null);
  });

  test("postLoginAdmin: user tidak ditemukan", async () => {
    User.findOne.mockResolvedValue(null);

    const req = mkReq({ username: "admin", password: "123" });
    const res = mkRes();

    await AuthController.postLoginAdmin(req, res);

    expect(res.view).toBe("loginAdmin");
    expect(res.jsonBody.error).toBe("User tidak ditemukan!");
  });

  test("postLoginAdmin: password bcrypt cocok → redirect", async () => {
    User.findOne.mockResolvedValue({ id: 1, username: "admin", password: "$2b$xxx" });
    bcrypt.compare.mockResolvedValue(true);

    const req = mkReq({ username: "admin", password: "123", remember: "yes" }, {}, { cookie: {} });
    const res = mkRes();

    await AuthController.postLoginAdmin(req, res);

    expect(res.redirectUrl).toBe("/admin");
    expect(req.session.user.username).toBe("admin");
    expect(req.session.cookie.maxAge).toBeDefined();
  });

  test("postLoginAdmin: password plain cocok → redirect", async () => {
    User.findOne.mockResolvedValue({ id: 1, username: "admin", password: "123" });

    const req = mkReq({ username: "admin", password: "123" }, {}, { cookie: {} });
    const res = mkRes();

    await AuthController.postLoginAdmin(req, res);

    expect(res.redirectUrl).toBe("/admin");
  });

  test("postLoginAdmin: password salah", async () => {
    User.findOne.mockResolvedValue({ username: "admin", password: "$2b$xxx" });
    bcrypt.compare.mockResolvedValue(false);

    const req = mkReq({ username: "admin", password: "xxx" });
    const res = mkRes();

    await AuthController.postLoginAdmin(req, res);

    expect(res.view).toBe("loginAdmin");
    expect(res.jsonBody.error).toBe("Password salah!");
  });

  test("postLoginAdmin: server error 500", async () => {
    User.findOne.mockRejectedValue(new Error("DB error"));

    const req = mkReq({ username: "admin", password: "123" });
    const res = mkRes();

    await AuthController.postLoginAdmin(req, res);

    expect(res.statusCode).toBe(500);
  });

  test('postLoginAdmin → catch error', async () => {
    User.findOne.mockRejectedValue(new Error('DB Error'));
    const res = mkRes();
    await AuthController.postLoginAdmin({ body:{} }, res);
    expect(res.statusCode).toBe(500);
  });

  test("getSecurityQuestion: username tidak ada → 400", async () => {
    const res = mkRes();
    await AuthController.getSecurityQuestion({ query: {} }, res);
    expect(res.statusCode).toBe(400);
  });

  test("getSecurityQuestion: user ada → kirim security question", async () => {
    User.findOne.mockResolvedValue({ security_question: "Siapa kamu?" });

    const req = { query: { username: "admin" } };
    const res = mkRes();

    await AuthController.getSecurityQuestion(req, res);

    expect(res.jsonBody.securityQuestion).toBe("Siapa kamu?");
  });

  test('getSecurityQuestion → tanpa username', async () => {
    const res = mkRes();
    await AuthController.getSecurityQuestion({ query: {} }, res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toEqual({ error: "Username wajib diisi!" });
  });

  test('getSecurityQuestion → catch error', async () => {
    User.findOne.mockRejectedValue(new Error('DB Error'));
    const res = mkRes();
    await AuthController.getSecurityQuestion({ query:{ username:'admin' } }, res);
    expect(res.statusCode).toBe(500);
  });

  test("postForgotPasswordAdmin: jawaban salah → 400", async () => {
    User.findOne.mockResolvedValue({ security_answer: "kucing" });

    const req = mkReq({ username: "admin", answer: "anjing", newPassword: "baru" });
    const res = mkRes();

    await AuthController.postForgotPasswordAdmin(req, res);
    expect(res.statusCode).toBe(400);
  });

  test("postForgotPasswordAdmin: sukses → password updated", async () => {
    const save = jest.fn().mockResolvedValue();
    User.findOne.mockResolvedValue({ security_answer: "kucing", password: "", save });

    const req = mkReq({ username: "admin", answer: "Kucing", newPassword: "baru" });
    const res = mkRes();

    await AuthController.postForgotPasswordAdmin(req, res);

    expect(save).toHaveBeenCalled();
    expect(res.jsonBody.message).toContain("berhasil");
  });

  test('postForgotPasswordAdmin → jawaban salah', async () => {
    User.findOne.mockResolvedValue({
      security_answer: "benar"
    });

    const res = mkRes();
    await AuthController.postForgotPasswordAdmin({
      body: { username: 'admin', answer: 'salah', newPassword: 'aaa' }
    }, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toEqual({ error: "Jawaban keamanan salah!" });
  });

  test('postForgotPasswordAdmin → catch error', async () => {
    User.findOne.mockRejectedValue(new Error('DB Error'));

    const res = mkRes();
    await AuthController.postForgotPasswordAdmin({
      body: { username:'a', answer:'b', newPassword:'c' }
    }, res);

    expect(res.statusCode).toBe(500);
  });

  test("logout: sukses → redirect", () => {
    const destroy = jest.fn((cb) => cb());
    const req = { session: { destroy }, };
    const res = mkRes();

    AuthController.logout(req, res);

    expect(res.redirectUrl).toBe("/loginAdmin");
  });

  test('logout: error → 500', () => {
    const destroy = jest.fn((cb) => cb(new Error('oops')));
    const req = { session: { destroy }, };
    const res = mkRes();

    AuthController.logout(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.jsonBody).toBe("Gagal logout!");
  });

  test('getForgotPasswordAdmin: render forgot password page', () => {
    const res = mkRes();
    AuthController.getForgotPasswordAdmin({}, res);
    expect(res.view).toBe("forgotpasswordAdmin");
  });

  test('postLoginAdmin: remember not set → session cookie expires false', async () => {
    User.findOne.mockResolvedValue({ id: 2, username: 'u', password: 'plain' });

    const req = mkReq({ username: 'u', password: 'plain' }, {}, { cookie: {} });
    const res = mkRes();

    await AuthController.postLoginAdmin(req, res);

    expect(res.redirectUrl).toBe('/admin');
    expect(req.session.cookie.expires).toBe(false);
  });

  test('getSecurityQuestion: user tidak ditemukan → 404', async () => {
    User.findOne.mockResolvedValue(null);
    const req = { query: { username: 'nope' } };
    const res = mkRes();

    await AuthController.getSecurityQuestion(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonBody).toEqual({ error: "User tidak ditemukan!" });
  });

  test('postForgotPasswordAdmin: missing fields → 400', async () => {
    const res = mkRes();
    await AuthController.postForgotPasswordAdmin({ body: {} }, res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonBody).toEqual({ error: "Semua field wajib diisi!" });
  });

  test('postForgotPasswordAdmin: user tidak ditemukan → 404', async () => {
    User.findOne.mockResolvedValue(null);
    const req = { body: { username: 'a', answer: 'b', newPassword: 'c' } };
    const res = mkRes();

    await AuthController.postForgotPasswordAdmin(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.jsonBody).toEqual({ error: "User tidak ditemukan!" });
  });

});
