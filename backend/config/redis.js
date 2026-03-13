// Cliente Redis opcional (en Docker: REDIS_HOST=redis). Si no hay host, getRedis() devuelve null.
const Redis = require("ioredis");

let client = null;

function getRedis() {
  if (!process.env.REDIS_HOST) {
    return null;
  }
  if (!client) {
    client = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT || 6379),
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
    });
    client.on("error", function (err) {
      console.error("Redis:", err.message);
    });
  }
  return client;
}

module.exports = {
  getRedis,
};
