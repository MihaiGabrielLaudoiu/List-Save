// Enriquecimiento de productos via Open Food Facts (gratis, sin auth)
// Devuelve null si no hay datos o falla — nunca lanza excepcion
const https = require("https");

const TIMEOUT_MS = 6000;

function httpsGetJson(url) {
  return new Promise(function (resolve, reject) {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": "ListAndSave/2.3 (TFG DAW; contact: info@listandsave.com)"
        },
        timeout: TIMEOUT_MS
      },
      function (res) {
        let raw = "";
        res.on("data", function (chunk) { raw += chunk; });
        res.on("end", function () {
          try { resolve(JSON.parse(raw)); }
          catch (e) { reject(new Error("JSON parse error: " + e.message)); }
        });
      }
    );
    req.on("timeout", function () { req.destroy(); reject(new Error("Timeout")); });
    req.on("error", function (err) { reject(err); });
  });
}

async function enrichProductByEan(ean) {
  try {
    const url = "https://world.openfoodfacts.org/api/v2/product/" + String(ean).trim() + ".json";
    const json = await httpsGetJson(url);

    if (!json || json.status === 0 || !json.product) {
      return null;
    }

    const prod = json.product;

    // Nutricion por 100g — solo lo que nos interesa
    const nutri = prod.nutriments || {};
    const infoNutricional = {
      calorias: nutri["energy-kcal_100g"] || null,
      grasas: nutri["fat_100g"] || null,
      grasas_saturadas: nutri["saturated-fat_100g"] || null,
      hidratos: nutri["carbohydrates_100g"] || null,
      azucares: nutri["sugars_100g"] || null,
      proteinas: nutri["proteins_100g"] || null,
      sal: nutri["salt_100g"] || null
    };

    const tieneNutri = Object.values(infoNutricional).some(function (v) { return v !== null; });

    // Alergenos: OFF devuelve ["en:milk", "en:gluten"] — quitamos el prefijo de idioma
    const alergenosTags = prod.allergens_tags || [];
    const alergenos = alergenosTags.length > 0
      ? alergenosTags.map(function (a) { return a.replace(/^[a-z]+:/, ""); }).join(",")
      : null;

    return {
      imagen: prod.image_url || null,
      info_nutricional: tieneNutri ? JSON.stringify(infoNutricional) : null,
      alergenos: alergenos,
      marca: prod.brands ? String(prod.brands).split(",")[0].trim() : null
    };
  } catch (err) {
    console.error("[off] Error EAN", ean, ":", err.message);
    return null;
  }
}

module.exports = { enrichProductByEan };
