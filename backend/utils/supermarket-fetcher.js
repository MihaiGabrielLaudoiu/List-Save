// Fetching de datos reales desde las APIs internas de supermercados espanoles
// Todas las llamadas se hacen server-side para evitar CORS
// Usa el modulo https nativo de Node.js — sin dependencias externas
const https = require("https");

const REQUEST_TIMEOUT_MS = 12000;

// Promesa que envuelve https.get con timeout y parseo JSON
// extraHeaders permite añadir cabeceras especificas por supermercado
function httpsGetJson(url, extraHeaders) {
  const headers = Object.assign(
    {
      "User-Agent": "Mozilla/5.0 (compatible; ListAndSave/1.0)",
      Accept: "application/json"
    },
    extraHeaders || {}
  );

  return new Promise(function (resolve, reject) {
    const req = https.get(
      url,
      {
        headers: headers,
        timeout: REQUEST_TIMEOUT_MS
      },
      function (res) {
        let raw = "";
        res.on("data", function (chunk) {
          raw += chunk;
        });
        res.on("end", function () {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error("HTTP " + res.statusCode + ": " + raw.slice(0, 160).replace(/\s+/g, " ")));
            return;
          }
          try {
            resolve(JSON.parse(raw));
          } catch (parseErr) {
            reject(new Error("JSON parse error: " + parseErr.message));
          }
        });
      }
    );

    req.on("timeout", function () {
      req.destroy();
      reject(new Error("Timeout despues de " + REQUEST_TIMEOUT_MS + "ms"));
    });

    req.on("error", function (err) {
      reject(err);
    });
  });
}

function inferMercadonaMarca(displayName) {
  const raw = String(displayName || "").trim();
  if (!raw) {
    return "Mercadona";
  }
  const lower = raw.toLowerCase();
  const multi = [
    ["bosque verde", "Bosque Verde"],
    ["deliplus", "Deliplus"],
    ["hacendado", "Hacendado"],
    ["compy", "Compy"],
    ["steinhoff", "Steinhoff"],
    ["pascual", "Pascual"],
    ["kaiku", "Kaiku"],
    ["danone", "Danone"],
    ["nestle", "Nestle"],
    ["nestlé", "Nestlé"],
    ["gallo", "Gallo"],
    ["colacao", "Colacao"],
    ["milbona", "Milbona"],
    ["campofrio", "Campofrío"],
    ["campofrío", "Campofrío"],
    ["el pozo", "El Pozo"],
    ["yoplait", "Yoplait"],
    ["activia", "Activia"]
  ];
  for (let i = 0; i < multi.length; i++) {
    if (lower.includes(multi[i][0])) {
      return multi[i][1];
    }
  }
  const parts = raw.split(/\s+/);
  const last = parts[parts.length - 1];
  if (last && last.length > 2 && /^[A-Za-zÁÉÍÓÚÑáéíóúñ]+$/.test(last)) {
    return last.charAt(0).toUpperCase() + last.slice(1).toLowerCase();
  }
  return "Mercadona";
}

function buildMercadonaFormato(priceInstr) {
  if (!priceInstr || typeof priceInstr !== "object") {
    return null;
  }
  const parts = [];
  if (priceInstr.is_pack && priceInstr.total_units) {
    parts.push("pack " + String(priceInstr.total_units));
  }
  if (priceInstr.unit_name && priceInstr.unit_size) {
    parts.push(String(priceInstr.unit_size) + " " + String(priceInstr.unit_name));
  }
  if (priceInstr.size_format) {
    parts.push(String(priceInstr.size_format));
  }
  if (parts.length === 0 && priceInstr.packaging) {
    return String(priceInstr.packaging);
  }
  return parts.length ? parts.join(" · ") : null;
}

function mercadonaCantidadUnidad(priceInstr) {
  if (!priceInstr || typeof priceInstr !== "object") {
    return null;
  }
  const fmt = String(priceInstr.size_format || "").toLowerCase();
  const total = parseFloat(priceInstr.total_units || 0);
  const unitSize = parseFloat(priceInstr.unit_size || 0);
  if (fmt === "l" || fmt === "kg" || fmt === "g" || fmt === "ml") {
    if (total && unitSize) {
      return total * unitSize;
    }
    if (unitSize) {
      return unitSize;
    }
  }
  if (unitSize) {
    return unitSize;
  }
  return parseFloat(priceInstr.pack_size || 0) || null;
}

function mercadonaUnidadMedida(priceInstr) {
  if (!priceInstr) {
    return null;
  }
  const fmt = String(priceInstr.size_format || "").toLowerCase();
  if (fmt === "l" || fmt === "kg" || fmt === "g" || fmt === "ml" || fmt === "cl") {
    return fmt === "cl" ? "ml" : fmt;
  }
  const un = String(priceInstr.unit_name || "").toLowerCase();
  if (un.indexOf("brik") >= 0 || un.indexOf("litro") >= 0) {
    return "l";
  }
  if (un.indexOf("kilo") >= 0 || un === "kg") {
    return "kg";
  }
  return fmt || null;
}

// Parsea la respuesta de una subcategoria de la API v1_1 de Mercadona
// Estructura: { name, categories: [{ name, products: [{ id, display_name, thumbnail, price_instructions, categories, share_url }] }] }
function parseMercadona(json) {
  const productos = [];
  const subcats = json.categories || [];
  const categoriaPasillo = String(json.name || "").trim() || null;

  subcats.forEach(function (subcat) {
    const subcategoria = String(subcat.name || "").trim() || null;
    const items = subcat.products || [];

    items.forEach(function (item) {
      const priceInstr = item.price_instructions || {};
      const precioActual = parseFloat(priceInstr.unit_price || 0);

      if (!precioActual || !item.display_name) {
        return;
      }

      const precioRef = parseFloat(priceInstr.reference_price || 0) || null;
      const unidadRef = priceInstr.reference_format || null;
      const catApi = (item.categories && item.categories[0] && item.categories[0].name) || null;
      const categoriaBlob = [categoriaPasillo, catApi].filter(Boolean).join(" · ");
      const marca = inferMercadonaMarca(item.display_name);
      const urlProducto = item.share_url
        ? String(item.share_url).trim()
        : item.id
          ? "https://tienda.mercadona.es/product/" + encodeURIComponent(String(item.id))
          : null;

      let infoNutricional = null;
      if (item.nutrition && typeof item.nutrition === "object") {
        try {
          infoNutricional = JSON.stringify(item.nutrition);
        } catch (e) {
          infoNutricional = null;
        }
      }

      productos.push({
        id_externo: String(item.id || "").trim() || null,
        nombre: String(item.display_name).trim(),
        marca: marca,
        ean: item.ean ? String(item.ean).trim() : null,
        imagen: item.thumbnail || null,
        descripcion: item.packaging ? String(item.packaging) : null,
        categoria: categoriaBlob ? categoriaBlob.toLowerCase() : null,
        subcategoria: subcategoria ? subcategoria.toLowerCase() : null,
        unidad_medida: mercadonaUnidadMedida(priceInstr),
        cantidad_unidad: mercadonaCantidadUnidad(priceInstr),
        formato: buildMercadonaFormato(priceInstr),
        alergenos: item.allergens ? String(item.allergens) : null,
        ingredientes: item.ingredients ? String(item.ingredients) : null,
        info_nutricional: infoNutricional,
        origen: item.origin ? String(item.origin) : null,
        url: urlProducto,
        stock: item.availability && item.availability.is_available === false ? 0 : null,
        precio_actual: precioActual,
        precio_oferta: null,
        precio_referencia: precioRef,
        unidad_referencia: unidadRef,
        es_precio_tarjeta: 0
      });
    });
  });

  return productos;
}

// Mapea la respuesta de Carrefour a nuestro modelo enriquecido
function parseCarrefour(json) {
  const docs = ((json.content || {}).docs) || [];
  const productos = [];

  docs.forEach(function (item) {
    const precio = parseFloat(((item.price || {}).value) || 0);

    if (!precio || !item.display_name) {
      return;
    }

    const precioTarjeta = parseFloat(((item.price || {}).club_price) || 0) || null;
    const precioRef = parseFloat(((item.price || {}).price_for_reference_unit) || 0) || null;
    const unidadRef = ((item.price || {}).reference_unit) || null;

    // Alérgenos como string separado por comas
    const allergenArr = item.allergens || [];
    const alergenos = allergenArr.length > 0
      ? allergenArr.map(function (a) { return String(a).toLowerCase().trim(); }).join(",")
      : null;

    // Nutrición
    let infoNutricional = null;
    const nutri = item.nutritional_information;
    if (nutri && typeof nutri === "object") {
      infoNutricional = JSON.stringify(nutri);
    }

    productos.push({
      id_externo: String(item.id || "").trim() || null,
      nombre: String(item.display_name).trim(),
      marca: String(item.brand || "Carrefour").trim(),
      ean: String(item.ean || item.id || "").trim() || null,
      imagen: ((item.image || {}).url) || null,
      descripcion: String(item.description || item.long_description || "").trim() || null,
      categoria: String(((item.breadcrumb || [])[0] || {}).name || "").toLowerCase().trim() || null,
      subcategoria: String(((item.breadcrumb || [])[1] || {}).name || "").toLowerCase().trim() || null,
      unidad_medida: String(item.unit || "").trim() || null,
      cantidad_unidad: parseFloat(item.quantity || 0) || null,
      formato: String(item.format || "").trim() || null,
      alergenos: alergenos,
      ingredientes: String(item.ingredients || "").trim() || null,
      info_nutricional: infoNutricional,
      origen: String(item.origin || "").trim() || null,
      url: String(item.url || item.product_url || "").trim() || null,
      stock: null,
      precio_actual: precio,
      precio_oferta: precioTarjeta && precioTarjeta < precio ? precioTarjeta : null,
      precio_referencia: precioRef,
      unidad_referencia: unidadRef,
      es_precio_tarjeta: precioTarjeta && precioTarjeta < precio ? 1 : 0
    });
  });

  return productos;
}

async function tryCarrefourHttps(term) {
  const url =
    "https://www.carrefour.es/api/app/segment/search?q=" +
    encodeURIComponent(term) +
    "&lang=es&rows=20";
  try {
    const json = await httpsGetJson(url, {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      Referer: "https://www.carrefour.es/",
      Origin: "https://www.carrefour.es",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin"
    });
    return parseCarrefour(json);
  } catch (e) {
    return [];
  }
}

// Funcion publica: dado un source y un termino de busqueda, devuelve productos normalizados
// Devuelve [] si falla (no rompe la sync completa)
async function fetchProductsFromSupermarket(source, term) {
  try {
    if (source.slug === "carrefour") {
      const apiRows = await tryCarrefourHttps(term);
      if (apiRows.length > 0) {
        return apiRows;
      }
      const { scrapeCarrefourSearch } = require("./supermarket-scraper");
      return await scrapeCarrefourSearch(term);
    }

    // Los supermercados con scraping se delegan al modulo de Playwright
    if (source.estrategia === "scraping") {
      const { scrapeProductsFromSupermarket } = require("./supermarket-scraper");
      return await scrapeProductsFromSupermarket(source, term);
    }

    if (source.slug === "mercadona") {
      // term es el ID de subcategoria (ej. "72" para leche)
      const url =
        "https://tienda.mercadona.es/api/v1_1/categories/" + term + "/?lang=es&wh=mad1";
      const json = await httpsGetJson(url, {
        "x-customer-device-id": "e8a9f1b2-3c4d-5e6f-7a8b-9c0d1e2f3a4b"
      });
      return parseMercadona(json);
    }

    return [];
  } catch (err) {
    console.error(
      "[fetcher] Error en " + source.slug + " / '" + term + "':",
      err.message
    );
    return [];
  }
}

module.exports = { fetchProductsFromSupermarket, parseCarrefour };
