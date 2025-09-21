const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("norincafe", "root", "", {
  host: "localhost",
  dialect: "mysql"
});

sequelize.authenticate()
  .then(() => console.log("✅ Database connected"))
  .catch(err => console.error("❌ DB connection error:", err));

module.exports = sequelize;
