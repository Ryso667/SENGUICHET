const express = require("express");
const cors = require("cors");
require("dotenv").config();

const routes = require("./routes");
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use("/api", routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Erreur serveur" });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 SenGuichet API sur http://localhost:${PORT}`);
  });
}

module.exports = app;
