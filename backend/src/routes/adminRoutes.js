const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../config/db"); // ✅ ADD THIS

// ================= LOGIN =================

// Show login page
router.get("/login", (req, res) => {
  res.render("admin-login", { layout: false });
});

// Handle login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [users] = await pool.query(
    "SELECT * FROM users WHERE email = ? AND role = 'admin'",
    [email]
  );

  if (users.length === 0) {
    return res.send("Admin not found");
  }

  const admin = users[0];

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    return res.send("Invalid password");
  }

  // ✅ Save session
  req.session.admin = {
    id: admin.id,
    email: admin.email,
  };

  res.redirect("/admin");
});

// ================= PROTECTION =================

const adminAuth = require("../middleware/adminAuth");

// Protect everything AFTER login
router.use(adminAuth);

// ================= DASHBOARD =================

router.get("/", async (req, res) => {
  const [[userCount]] = await pool.query("SELECT COUNT(*) as count FROM users");
  const [[txnCount]] = await pool.query("SELECT COUNT(*) as count FROM transactions");

  res.render("dashboard", {
    users: userCount.count,
    transactions: txnCount.count,
  });
});


router.get("/users", async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    );

    res.render("users", { users });

  } catch (err) {
    console.error("Users fetch error:", err.message);
    res.send("Error loading users");
  }
});

router.post("/users/delete/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    await pool.query("DELETE FROM users WHERE id = ?", [userId]);

    res.redirect("/admin/users");

  } catch (err) {
    console.error("Delete user error:", err.message);
    res.send("Error deleting user");
  }
});


router.get("/transactions", async (req, res) => {
  try {
    const [transactions] = await pool.query(`
      SELECT t.*, u.name AS user_name 
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.txn_date DESC
    `);

    res.render("transactions", { transactions });

  } catch (err) {
    console.error("Transactions fetch error:", err.message);
    res.send("Error loading transactions");
  }
});

router.post("/transactions/delete/:id", async (req, res) => {
  await pool.query("DELETE FROM transactions WHERE id = ?", [req.params.id]);
  res.redirect("/admin/transactions");
});


// ================= LOGOUT =================

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
});

module.exports = router;