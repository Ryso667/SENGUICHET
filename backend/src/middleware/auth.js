const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token manquant" });
    }

    try {
      const token = header.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Accès interdit" });
      }

      req.user = decoded;
      next();
    } catch {
      return res.status(401).json({ message: "Token invalide" });
    }
  };
};

module.exports = authMiddleware;
