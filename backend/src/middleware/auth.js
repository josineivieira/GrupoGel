const jwt = require("jsonwebtoken");

module.exports = function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Token ausente" });
    }

    const secret = process.env.JWT_SECRET || "dev_secret_change_me";
    const decoded = jwt.verify(token, secret);

    // payload esperado: { id, name, email, role }
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
};
