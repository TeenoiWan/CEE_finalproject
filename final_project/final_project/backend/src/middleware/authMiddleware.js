const jwt = require("jsonwebtoken");

function authMiddleware(secret) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Missing authorization token." });
    }

    try {
      req.user = jwt.verify(token, secret);
      return next();
    } catch (_error) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
  };
}

module.exports = { authMiddleware };
