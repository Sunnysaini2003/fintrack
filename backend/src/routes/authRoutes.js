const express = require("express");
const router = express.Router();

const { register, login, getProfile, deleteUser } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getProfile);
router.delete("/me", authMiddleware, deleteUser);
// Admin-only user creation
router.post("/create-user", authMiddleware, adminMiddleware, register);

module.exports = router;
