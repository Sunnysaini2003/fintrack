// ================= IMPORTS =================
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");

const pool = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const adminRoutes = require("./routes/adminRoutes");

// ================= CONFIG =================
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ================= MIDDLEWARE =================

// Core middleware
app.use(
  cors({
    origin: "http://localhost:5000",
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.use(
  session({
    secret: "fintrack_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    },
  })
);
// app.use((req, res, next) => {
//   console.log("SESSION:", req.session);
//   next();
// });


// Auto extend session
app.use((req, res, next) => {
  if (req.session.admin) {
    req.session.touch();
  }
  next();
});

// Make session available in EJS
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// ================= VIEW ENGINE =================
app.set("view engine", "ejs");
app.set("views", "./src/views");

app.use(expressLayouts);
app.set("layout", "layout");

// Static files
app.use(express.static("public"));

// ================= ROUTES =================

// Health routes
app.get("/", (req, res) => {
  res.json({ message: "FinTrack API is running ✅" });
});

app.get("/db", (req, res) => {
  res.json({ message: "DB Connected ✅" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);

// Admin panel
app.use("/admin", adminRoutes);

// ================= SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ================= DATABASE CHECK =================
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("MySQL Connected ✅");
  } catch (err) {
    console.error("Startup Error:", err);
  }
})();

console.log("Auth Routes Loaded");


