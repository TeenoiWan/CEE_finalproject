const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./route/auth");
const scanRoutes = require("./route/scan");

const app = express();

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://54.158.23.156:3221"; // Frontend server default port is 3221


// Connect to MongoDB
connectDB();

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Secure doc scanner API is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api", scanRoutes);

app.listen(PORT, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://54.158.23.156:${PORT}`);
});
