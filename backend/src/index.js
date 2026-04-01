const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./config/db")
dotenv.config();

//ejs setup
app.use(express.static("public"));

const expressLayouts = require("express-ejs-layouts");

app.set("view engine", "ejs");
app.set("views", "./src/views");

app.use(expressLayouts);
app.set("layout", "layout"); // default layout

// require("./config/db");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "FinTrack API is running ✅" });
});

app.get("/db", (req, res) => {
    res.json({ message: 'Connected' })
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`FinTrack backend running on port ${PORT}`);
});

(async () => {
    try {
        // SQl Check
        await pool.query('SELECT 1');
        console.log('MySQL Connected✅');

    }
    catch (err) {
        console.error('Startup Error:', err);

    }

})();

// console.log(process.env.DB_HOST);
console.log("Auth routes loaded");