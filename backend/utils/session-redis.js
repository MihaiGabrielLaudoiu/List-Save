const { getRedis } = require("../config/redis");

function ttlSecondsFromJwtEnv() {
  const raw = process.env.JWT_EXPIRES_IN || "24h";
  const h = /^(\d+)h$/i.exec(raw);
  if (h) {
    return parseInt(h[1], 10) * 3600;
  }
  const d = /^(\d+)d$/i.exec(raw);
  if (d) {
    return parseInt(d[1], 10) * 86400;
  }
  return 86400;
}

async function saveUserSession(userId, jti) {
  const r = getRedis();
  if (!r) {
    return;
  }
  const ttl = ttlSecondsFromJwtEnv();
  await r.setex("sess:" + userId, ttl, jti);
}

async function isSessionValid(userId, jti) {
  if (!jti) {
    return true;
  }
  const r = getRedis();
  if (!r) {
    return true;
  }
  try {
    const stored = await r.get("sess:" + userId);
    return stored === jti;
  } catch (e) {
    console.error("Redis get sesion:", e.message);
    return true;
  }
}

async function destroyUserSession(userId) {
  const r = getRedis();
  if (!r) {
    return;
  }
  try {
    await r.del("sess:" + userId);
  } catch (e) {
    console.error("Redis del sesion:", e.message);
  }
}

module.exports = {
  saveUserSession,
  isSessionValid,
  destroyUserSession,
  ttlSecondsFromJwtEnv,
};
