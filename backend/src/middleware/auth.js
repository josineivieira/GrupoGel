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

    // payload esperado: { id, role }
    // Normalize role to uppercase and enrich user info from DB (attach contractorId)
    req.user = { id: decoded.id, role: String(decoded.role || '').toUpperCase() };

    try {
      // req.mockdb is provided by city middleware (applied earlier)
      if (req.mockdb) {
        const db = req.mockdb;
        const user = await db.findById('drivers', decoded.id);
        if (user) {
          // attach contractorId when available and normalize role from DB if present
          req.user.contractorId = user.contractorId || user._id || null;
          req.user.username = user.username || user.email || null;
          if (user.role) req.user.role = String(user.role).toUpperCase();
        }
      }
    } catch (e) {
      // ignore enrichment failures; keep token data
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Token inválido" });
  }
};
