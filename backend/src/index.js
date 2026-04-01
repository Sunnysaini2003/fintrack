const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./config/db");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
dotenv.config();
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const app = express(); 
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: "fintrack_secret",
    resave: false,
    saveUninitialized: false,

    cookie: {
      maxAge: 1000 * 60 * 60, 
      httpOnly: true,
    },
  })
);

app.use((req, res, next) => {
  if (req.session.admin) {
    req.session.touch(); 
  }
  next();
});

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.set("view engine", "ejs");
app.set("views", "./src/views");
app.use(expressLayouts);
app.set("layout", "layout");

// app.use(express.static("public"));

app.get("/", (req, res) => {
  res.json({ message: "FinTrack API is running ✅" });
});

app.get("/db", (req, res) => {
  res.json({ message: "Connected" });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/admin", adminRoutes); 

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`FinTrack backend running on port ${PORT}`);
});

// ================= DB CHECK =================

(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("MySQL Connected ✅");
  } catch (err) {
    console.error("Startup Error:", err);
  }
})();

console.log("Auth routes loaded");