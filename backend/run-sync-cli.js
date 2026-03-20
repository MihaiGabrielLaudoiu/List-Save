// Sincronizacion de supermercados (API + scraping) sin HTTP /auth.
// Uso desde la raiz: node backend/run-sync-cli.js   o   npm run sync:mercados
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { syncSupermarketData } = require("./utils/supermarket-sync");

syncSupermarketData()
  .then(function (stats) {
    console.log("[run-sync] Terminado:", stats);
    process.exit(0);
  })
  .catch(function (err) {
    console.error("[run-sync] Error:", err);
    process.exit(1);
  });
