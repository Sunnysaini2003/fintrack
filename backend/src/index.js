// src/index.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

require("./config/db"); 

const app = express();

app.use(cors());
app.use(express.json());

// Simple test route
app.get("/", (req, res) => {
  res.json({ message: "FinTrack API is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌐 FinTrack backend running on port ${PORT}`);
});
