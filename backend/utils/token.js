// Utilidades para crear y gestionar los tokens JWT de autenticacion
// El token se guarda en una cookie HttpOnly para que el JS del navegador no pueda leerlo
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { ttlSecondsFromJwtEnv } = require("./session-redis");

function ttlMsFromJwtEnv() {
  return ttlSecondsFromJwtEnv() * 1000;
}

// Devuelve token JWT y jti (id de sesion) para guardar en Redis
function createAuthToken(payload) {
  const secret = process.env.JWT_SECRET;
  const expiracion = process.env.JWT_EXPIRES_IN || "24h";
  const jti = crypto.randomUUID();
  const body = Object.assign({}, payload, { jti: jti });
  const token = jwt.sign(body, secret, { expiresIn: expiracion });
  return { token: token, jti: jti };
}

function cookieOptions() {
  const esProduccion = process.env.NODE_ENV === "production";
  const secure =
    process.env.COOKIE_SECURE === "true" ||
    (process.env.COOKIE_SECURE !== "false" && esProduccion);
  const sameSiteRaw = process.env.COOKIE_SAMESITE || "lax";
  const sameSite =
    sameSiteRaw.toLowerCase() === "none"
      ? "none"
      : sameSiteRaw.toLowerCase() === "strict"
        ? "strict"
        : "lax";

  const secureFinal = sameSite === "none" ? true : secure;

  return {
    httpOnly: true,
    sameSite: sameSite,
    secure: secureFinal,
    path: "/",
    maxAge: ttlMsFromJwtEnv(),
  };
}

function setAuthCookie(res, token) {
  res.cookie("auth_token", token, cookieOptions());
}

function clearAuthCookie(res) {
  const o = cookieOptions();
  res.clearCookie("auth_token", {
    httpOnly: o.httpOnly,
    sameSite: o.sameSite,
    secure: o.secure,
    path: o.path,
  });
}

module.exports = {
  createAuthToken,
  setAuthCookie,
  clearAuthCookie,
};
