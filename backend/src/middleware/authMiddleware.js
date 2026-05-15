const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, iat, exp }
    next();
  } catch (err) {
    console.error("JWT error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const adminAuth = (req, res, next) => {

  console.log("AUTH CHECK:", req.session.admin);

  if (!req.session.admin) {

    console.log("❌ Not logged in → redirect");

    req.session.redirectTo = req.originalUrl;

    return res.redirect("/admin/login");
  }

  console.log("✅ Allowed");

  next();
};


module.exports = authMiddleware;
module.exports = adminAuth;

