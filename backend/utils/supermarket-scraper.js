// Scraping de supermercados que no tienen API publica: Eroski
// Usa Playwright headless para renderizar las paginas y extraer productos
const { chromium } = require("playwright");

const PAGE_TIMEOUT_MS = 15000;
let browser = null;

async function getBrowser() {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-blink-features=AutomationControlled", "--disable-dev-shm-usage", "--no-sandbox"]
    });
  }
  return browser;
}

async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

// Intenta extraer cantidad y unidad del nombre del producto
// Ej: "leche entera 1l" → { cantidad: 1, unidad: "l" }
// Ej: "arroz largo 500g" → { cantidad: 500, unidad: "g" }
function parseQuantityFromName(nombre) {
  if (!nombre) return { cantidad: null, unidad: null, formato: null };

  var text = nombre.toLowerCase();

  // Buscar patrones como "1,5l", "500g", "750ml", "6x1l", "pack 6"
  var packMatch = text.match(/(\d+)\s*x\s*(\d+[\.,]?\d*)\s*(kg|g|ml|l|cl)/i);
  if (packMatch) {
    var totalUnits = parseFloat(packMatch[1]);
    var unitSize = parseFloat(packMatch[2].replace(",", "."));
    var unit = packMatch[3].toLowerCase();
    return {
      cantidad: totalUnits * unitSize,
      unidad: unit,
      formato: packMatch[0].trim()
    };
  }

  var singleMatch = text.match(/(\d+[\.,]?\d*)\s*(kg|g|ml|l|cl)\b/i);
  if (singleMatch) {
    return {
      cantidad: parseFloat(singleMatch[1].replace(",", ".")),
      unidad: singleMatch[2].toLowerCase(),
      formato: singleMatch[0].trim()
    };
  }

  // Buscar "pack X" sin unidad
  var packOnly = text.match(/pack\s*(\d+)/i);
  if (packOnly) {
    return {
      cantidad: parseFloat(packOnly[1]),
      unidad: "ud",
      formato: packOnly[0].trim()
    };
  }

  return { cantidad: null, unidad: null, formato: null };
}

// Calcula precio de referencia (por kg o por litro) a partir de precio y cantidad
function calcPrecioReferencia(precio, cantidad, unidad) {
  if (!precio || !cantidad || !unidad) return { precioRef: null, unidadRef: null };

  var u = unidad.toLowerCase();
  if (u === "kg") return { precioRef: +(precio / cantidad).toFixed(4), unidadRef: "kg" };
  if (u === "g") return { precioRef: +(precio / (cantidad / 1000)).toFixed(4), unidadRef: "kg" };
  if (u === "l") return { precioRef: +(precio / cantidad).toFixed(4), unidadRef: "L" };
  if (u === "ml") return { precioRef: +(precio / (cantidad / 1000)).toFixed(4), unidadRef: "L" };
  if (u === "cl") return { precioRef: +(precio / (cantidad / 100)).toFixed(4), unidadRef: "L" };
  if (u === "ud") return { precioRef: +(precio / cantidad).toFixed(4), unidadRef: "ud" };

  return { precioRef: null, unidadRef: null };
}

async function scrapePage(url, extractFn) {
  let page = null;
  try {
    const b = await getBrowser();
    page = await b.newPage();
    await page.addInitScript(function () {
      Object.defineProperty(navigator, "webdriver", { get: function () { return undefined; } });
    });
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept-Language": "es-ES,es;q=0.9"
    });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: PAGE_TIMEOUT_MS });
    return await extractFn(page);
  } catch (err) {
    console.error("[scraper] Error en", url, ":", err.message);
    return [];
  } finally {
    if (page) await page.close().catch(function () {});
  }
}

// Enriquece los productos crudos con cantidad y precio de referencia
function enrichScrapedProducts(rawProducts, superName) {
  return rawProducts.map(function (p) {
    if (!p) return null;

    var parsed = parseQuantityFromName(p.nombre);
    var ref = calcPrecioReferencia(p.precio_actual, parsed.cantidad, parsed.unidad);

    // Intentar extraer precio referencia del scraping si viene
    var finalPrecioRef = p.precio_referencia || ref.precioRef;
    var finalUnidadRef = p.unidad_referencia || ref.unidadRef;

    var marcaFinal = p.marca || superName || "Tienda";

    return {
      id_externo: p.id_externo || null,
      nombre: p.nombre,
      marca: marcaFinal,
      ean: null,
      imagen: p.imagen,
      descripcion: null,
      categoria: p.categoria || null,
      subcategoria: p.subcategoria || null,
      unidad_medida: parsed.unidad,
      cantidad_unidad: parsed.cantidad,
      formato: parsed.formato || p.formato || null,
      alergenos: null,
      ingredientes: null,
      info_nutricional: null,
      origen: null,
      url: p.url || null,
      stock: p.stock != null ? p.stock : null,
      precio_actual: p.precio_actual,
      precio_oferta: null,
      precio_referencia: finalPrecioRef,
      unidad_referencia: finalUnidadRef,
      es_precio_tarjeta: 0
    };
  }).filter(function (p) { return p !== null; });
}

async function scrapeProductsEroski(term) {
  const url =
    "https://supermercado.eroski.es/es/search/results/?q=" +
    encodeURIComponent(term) +
    "&suggestionsFilter=true";
  const raw = await scrapePage(url, async function (page) {
    await page
      .waitForSelector(".product-item.big-item a[href*='productdetail']", {
        timeout: PAGE_TIMEOUT_MS
      })
      .catch(function () {});

    return page.$$eval(".product-item.big-item", function (items) {
      function parseMetricsJson(el) {
        const m = el.querySelector("[data-metrics]");
        if (!m) {
          return null;
        }
        const rawAttr = m.getAttribute("data-metrics");
        if (!rawAttr) {
          return null;
        }
        try {
          return JSON.parse(rawAttr);
        } catch (e) {
          return null;
        }
      }

      function pickPriceEuros(text) {
        if (!text) {
          return 0;
        }
        const matches = text.match(/([\d]{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})\s*€/g);
        if (!matches || matches.length === 0) {
          return 0;
        }
        const nums = matches.map(function (mch) {
          const n = mch
            .replace("€", "")
            .replace(/\s/g, "")
            .replace(/\./g, "")
            .replace(",", ".");
          return parseFloat(n) || 0;
        });
        return Math.min.apply(null, nums.filter(function (x) {
          return x > 0;
        })) || nums[nums.length - 1] || 0;
      }

      const out = [];
      items.forEach(function (el) {
        const link =
          el.querySelector("a.product-title-link[href*='productdetail']") ||
          el.querySelector("a[href*='productdetail']");
        if (!link) {
          return;
        }
        const href = link.getAttribute("href") || "";
        const idMatch = href.match(/productdetail\/(\d+)-/i);
        const idExterno = idMatch ? idMatch[1] : null;

        const titleEl = el.querySelector(".product-title-link, h2.product-title a, .product-title");
        let nombre = (titleEl && titleEl.textContent ? titleEl.textContent : link.textContent || "").trim();
        if (!nombre) {
          const img = el.querySelector("img[alt]");
          nombre = (img && img.getAttribute("alt")) || "";
        }
        nombre = nombre.replace(/\s+/g, " ").trim();
        if (!nombre) {
          return;
        }

        const imgEl = el.querySelector("img.product-img, img[src*='eroski']");
        const imagen = imgEl ? imgEl.getAttribute("src") : null;

        const metrics = parseMetricsJson(el);
        let precio = 0;
        let marca = "Eroski";
        if (metrics && metrics.ecommerce && metrics.ecommerce.items && metrics.ecommerce.items[0]) {
          const it = metrics.ecommerce.items[0];
          precio = parseFloat(it.price) || 0;
          if (it.item_brand) {
            marca = String(it.item_brand);
          }
        }
        if (!precio) {
          precio = pickPriceEuros(el.innerText || "");
        }
        if (!precio) {
          return;
        }

        out.push({
          nombre: nombre,
          imagen: imagen,
          precio_actual: precio,
          precio_referencia: null,
          unidad_referencia: null,
          formato: null,
          id_externo: idExterno,
          categoria: "supermercado eroski",
          subcategoria: null,
          url: href.split(":").length > 2 ? href.replace(":443", "") : href,
          marca: marca
        });
      });
      return out;
    });
  });

  return enrichScrapedProducts(raw, null);
}

function deepFindCarrefourDocs(root) {
  const stack = [root];
  const seen = new Set();
  while (stack.length) {
    const o = stack.pop();
    if (!o || typeof o !== "object") {
      continue;
    }
    if (seen.has(o)) {
      continue;
    }
    seen.add(o);
    if (o.content && Array.isArray(o.content.docs) && o.content.docs.length > 0) {
      return o.content.docs;
    }
    const keys = Object.keys(o);
    for (let i = 0; i < keys.length; i++) {
      const v = o[keys[i]];
      if (v && typeof v === "object") {
        stack.push(v);
      }
    }
  }
  return null;
}

async function scrapeCarrefourSearch(term) {
  const url =
    "https://www.carrefour.es/buscar?searchTerm=" + encodeURIComponent(term);
  const rows = await scrapePage(url, async function (page) {
    await page.waitForTimeout(4000);
    const nextJson = await page.evaluate(function () {
      const scr = document.querySelector("script#__NEXT_DATA__");
      if (!scr || !scr.textContent) {
        return null;
      }
      try {
        return JSON.parse(scr.textContent);
      } catch (e) {
        return null;
      }
    });
    if (!nextJson) {
      return [];
    }
    const { parseCarrefour } = require("./supermarket-fetcher");
    const found = deepFindCarrefourDocs(nextJson);
    if (found && found.length) {
      return parseCarrefour({ content: { docs: found } });
    }
    return await page.evaluate(function () {
      const out = [];
      const seen = {};
      document.querySelectorAll('a[href*="/p/"]').forEach(function (a) {
        const href = a.href || "";
        if (!href || seen[href]) {
          return;
        }
        const card = a.closest("article, li, div[class*='product'], div[class*='card']") || a.parentElement;
        const text = (card ? card.innerText : a.innerText) || "";
        const prices = text.match(/(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})\s*€/g);
        if (!prices || !prices.length) {
          return;
        }
        const nums = prices.map(function (m) {
          return parseFloat(
            m
              .replace("€", "")
              .replace(/\s/g, "")
              .replace(/\./g, "")
              .replace(",", ".")
          );
        });
        const precio = Math.min.apply(null, nums.filter(function (x) {
          return x > 0;
        }));
        if (!precio) {
          return;
        }
        let nombre = (a.getAttribute("title") || a.innerText || "").trim().split("\n")[0];
        if (!nombre || nombre.length < 3) {
          return;
        }
        nombre = nombre.replace(/\s+/g, " ");
        seen[href] = 1;
        out.push({
          id_externo: null,
          nombre: nombre,
          marca: "Carrefour",
          ean: null,
          imagen: null,
          descripcion: null,
          categoria: "carrefour busqueda",
          subcategoria: null,
          unidad_medida: null,
          cantidad_unidad: null,
          formato: null,
          alergenos: null,
          ingredientes: null,
          info_nutricional: null,
          origen: null,
          url: href,
          stock: null,
          precio_actual: precio,
          precio_oferta: null,
          precio_referencia: null,
          unidad_referencia: null,
          es_precio_tarjeta: 0
        });
      });
      return out;
    });
  });
  return rows;
}

async function scrapeProductsFromSupermarket(source, term) {
  if (source.slug === "eroski") {
    return scrapeProductsEroski(term);
  }
  return [];
}

module.exports = {
  scrapeProductsFromSupermarket,
  closeBrowser,
  scrapeCarrefourSearch
};
