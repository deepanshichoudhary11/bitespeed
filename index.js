const express = require("express");
const cors = require("cors");
const sequelize = require("./config");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Import model AFTER sequelize
const Contact = require("./models/contact");

// Test DB connection
sequelize.authenticate()
  .then(() => console.log("Database connected"))
  .catch(err => console.log("DB error:", err));

// Sync tables
sequelize.sync()
  .then(() => console.log("Tables created"));

// Import route
const identifyRoute = require("./routes/identify");
app.use("/identify", identifyRoute);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});