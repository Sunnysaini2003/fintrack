const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// const register = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const [existing] = await pool.query(
//       "SELECT id FROM users WHERE email = ?",
//       [email]
//     );

//     if (existing.length > 0) {
//       return res.status(400).json({ message: "Email already registered" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const [result] = await pool.query(
//       "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
//       [name, email, hashedPassword]
//     );

//     const userId = result.insertId;

//     const token = jwt.sign(
//       { id: userId, email, role: "user" },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.status(201).json({
//       message: "User registered successfully",
//       user: { id: userId, name, email, role: "user" },
//       token,
//     });
//   } catch (err) {
//     console.error("Register error:", err.message);
//     res.status(500).json({ message: "Server error" });
//   }
// };

const register = async (req, res) => {
  try {

    const { name, email, password } = req.body;

    // Default role
    let role = "user";

    // Admin can override role
    if (
      req.user &&
      req.user.role === "admin" &&
      req.body.role
    ) {
      role = req.body.role;
    }

    // Validation
    if (!name || !email || !password) {

      await pool.query(
        "INSERT INTO logs (action, email, ip_address) VALUES (?, ?, ?)",
        [
          "REGISTER_FAILED",
          email || "NO_EMAIL",
          req.ip,
        ]
      );

      return res.status(400).json({
        message: "All fields required",
      });
    }

    // Check existing email
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {

      await pool.query(
        "INSERT INTO logs (action, email, ip_address) VALUES (?, ?, ?)",
        [
          "REGISTER_DUPLICATE_EMAIL",
          email,
          req.ip,
        ]
      );

      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role]
    );

    // Store log
    let ip = req.ip;
    ip = ip.replace(/^.*:/, ''); 
    await pool.query(
      "INSERT INTO logs (user_id, action, email, ip_address) VALUES (?, ?, ?, ?)",
      [
        result.insertId,
        "REGISTER_SUCCESS",
        email,
        req.ip,
      ]
    );

    console.log("✅ User Registered");

    console.log({
      id: result.insertId,
      name,
      email,
      role,
      ip: req.ip,
      time: new Date(),
    });

    res.status(201).json({
      message: "User created successfully",
      role,
      id: result.insertId,
    });

  } catch (err) {

    console.error("REGISTER ERROR:", err);

    // Error log
    await pool.query(
      "INSERT INTO logs (action, email, ip_address) VALUES (?, ?, ?)",
      [
        "REGISTER_SERVER_ERROR",
        req.body.email || "UNKNOWN",
        req.ip,
      ]
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: rows[0] });
  } catch (err) {
    console.error("Get profile error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};


const deleteUser = async (req, res) => {
  try {
    const userId = req.user.id; // from JWT

    await pool.query("DELETE FROM users WHERE id = ?", [userId]);

    res.json({ message: "Your account deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  register,
  login,
  getProfile,
  deleteUser
};
