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
      password: process.env.REDIS_PASSWORD || undefined,
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
