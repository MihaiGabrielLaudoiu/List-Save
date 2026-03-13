// Middleware de autenticacion
const jwt = require("jsonwebtoken");
const { isSessionValid } = require("../utils/session-redis");

async function requireAuthAsync(req, res, next) {
  const token = req.cookies.auth_token;

  if (!token) {
    res.status(401).json({ message: "No autenticado" });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const ok = await isSessionValid(payload.user_id, payload.jti);
    if (!ok) {
      res.status(401).json({
        message: "Sesion invalidada. Vuelve a iniciar sesion.",
      });
      return;
    }
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ message: "Sesion invalida o caducada" });
  }
}

function requireAuth(req, res, next) {
  Promise.resolve(requireAuthAsync(req, res, next)).catch(next);
}

module.exports = {
  requireAuth,
};
