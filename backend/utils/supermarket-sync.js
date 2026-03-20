// Sincronizacion de precios: llama a las APIs de supermercados y hace upsert en la BD
// Flujo: Supermercados → Productos → ProductosTienda → Precios
const { getActiveSupermarketSources } = require("./supermarket-sources");
const { fetchProductsFromSupermarket } = require("./supermarket-fetcher");
const { normalizeText, buildComparableKey, normalizeIncomingProductCategories } = require("./product-normalizer");
const { enrichProductByEan } = require("./off-enricher");
const { consultaDatos } = require("../config/db");
const { closeBrowser } = require("./supermarket-scraper");

// Si el producto trae EAN pero le faltan datos de enriquecimiento (al, nut, marca),
// intentamos completarlos consultando Open Food Facts. No bloqueante: si falla
// devuelve el producto tal cual sin romper el sync.
async function maybeEnrichWithOff(prod) {
  if (!prod.ean) return prod;

  const necesitaEnriquecer =
    !prod.alergenos || !prod.info_nutricional || !prod.imagen;

  if (!necesitaEnriquecer) return prod;

  const extra = await enrichProductByEan(prod.ean);
  if (!extra) return prod;

  return Object.assign({}, prod, {
    imagen: prod.imagen || extra.imagen,
    info_nutricional: prod.info_nutricional || extra.info_nutricional,
    alergenos: prod.alergenos || extra.alergenos,
    marca:
      prod.marca && prod.marca !== "Hacendado" && prod.marca !== "Carrefour"
        ? prod.marca
        : extra.marca || prod.marca
  });
}

// Inserta el supermercado si no existe y devuelve su id
async function upsertSupermercado(nombre, slug) {
  await consultaDatos(
    "INSERT IGNORE INTO Supermercados (nombre_supermercado, slug) VALUES (?, ?)",
    [nombre, slug || nombre.toLowerCase()]
  );
  const rows = await consultaDatos(
    "SELECT id_supermercado FROM Supermercados WHERE nombre_supermercado = ? LIMIT 1",
    [nombre]
  );
  return rows[0].id_supermercado;
}

// Inserta el producto si no existe (clave unica nombre+marca) y devuelve su id e isNew
// Si ya existe, actualiza los campos de enriquecimiento (imagen, categoria, alergenos, etc.)
async function upsertProducto(prod, metadataJson) {
  const nombreNorm = normalizeText(prod.nombre);
  const marcaNorm = normalizeText(prod.marca);
  const claveComp = buildComparableKey({ nombre: prod.nombre, marca: prod.marca });

  // INSERT IGNORE aprovecha el UNIQUE KEY uk_producto_nombre_marca
  const insertResult = await consultaDatos(
    "INSERT IGNORE INTO Productos (nombre, marca, ean, imagen, descripcion, categoria, subcategoria, unidad_medida, cantidad_unidad, formato, alergenos, ingredientes, info_nutricional, origen, clave_comparable, metadata) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      nombreNorm,
      marcaNorm,
      prod.ean || null,
      prod.imagen || null,
      prod.descripcion || null,
      prod.categoria || null,
      prod.subcategoria || null,
      prod.unidad_medida || null,
      prod.cantidad_unidad || null,
      prod.formato || null,
      prod.alergenos || null,
      prod.ingredientes || null,
      prod.info_nutricional || null,
      prod.origen || null,
      claveComp,
      metadataJson || null
    ]
  );

  if (insertResult.affectedRows > 0) {
    return { id: insertResult.insertId, isNew: true };
  }

  // Ya existia: actualizamos campos de enriquecimiento si llegan datos nuevos
  await consultaDatos(
    "UPDATE Productos SET ean = COALESCE(NULLIF(?, ''), ean), imagen = COALESCE(NULLIF(?, ''), imagen), descripcion = COALESCE(NULLIF(?, ''), descripcion), categoria = COALESCE(NULLIF(?, ''), categoria), subcategoria = COALESCE(NULLIF(?, ''), subcategoria), unidad_medida = COALESCE(NULLIF(?, ''), unidad_medida), cantidad_unidad = COALESCE(?, cantidad_unidad), formato = COALESCE(NULLIF(?, ''), formato), alergenos = COALESCE(NULLIF(?, ''), alergenos), ingredientes = COALESCE(NULLIF(?, ''), ingredientes), info_nutricional = COALESCE(NULLIF(?, ''), info_nutricional), origen = COALESCE(NULLIF(?, ''), origen), clave_comparable = COALESCE(NULLIF(?, ''), clave_comparable), metadata = COALESCE(?, metadata) WHERE nombre = ? AND marca = ?",
    [
      prod.ean || null,
      prod.imagen || null,
      prod.descripcion || null,
      prod.categoria || null,
      prod.subcategoria || null,
      prod.unidad_medida || null,
      prod.cantidad_unidad || null,
      prod.formato || null,
      prod.alergenos || null,
      prod.ingredientes || null,
      prod.info_nutricional || null,
      prod.origen || null,
      claveComp,
      metadataJson || null,
      nombreNorm,
      marcaNorm
    ]
  );

  const rows = await consultaDatos(
    "SELECT id_producto FROM Productos WHERE nombre = ? AND marca = ? LIMIT 1",
    [nombreNorm, marcaNorm]
  );

  return { id: rows[0].id_producto, isNew: false };
}

// Inserta la relacion producto-supermercado si no existe y devuelve su id
// Actualiza id_externo si llega uno nuevo
async function upsertProductoTienda(idProducto, idSupermercado, idExterno) {
  const existentes = await consultaDatos(
    "SELECT id_producto_tienda FROM ProductosTienda WHERE id_producto = ? AND id_supermercado = ? LIMIT 1",
    [idProducto, idSupermercado]
  );

  if (existentes.length > 0) {
    if (idExterno) {
      await consultaDatos(
        "UPDATE ProductosTienda SET id_externo = ? WHERE id_producto_tienda = ?",
        [idExterno, existentes[0].id_producto_tienda]
      );
    }
    return existentes[0].id_producto_tienda;
  }

  const result = await consultaDatos(
    "INSERT INTO ProductosTienda (id_producto, id_supermercado, id_externo) VALUES (?, ?, ?)",
    [idProducto, idSupermercado, idExterno || null]
  );

  return result.insertId;
}

// Funcion principal: itera todos los supermercados activos y sus terminos de busqueda,
// descarga productos y los persiste en la BD
// Devuelve { insertados, actualizados, errores }
async function syncSupermarketData() {
  const sources = getActiveSupermarketSources();
  let insertados = 0;
  let actualizados = 0;
  let errores = 0;

  console.log("[sync] Inicio, fuentes activas:", sources.filter(function (s) {
    return s.searchTerms && s.searchTerms.length > 0;
  }).length);

  for (const source of sources) {
    if (!source.searchTerms || source.searchTerms.length === 0) {
      continue;
    }

    let idSupermercado;
    try {
      idSupermercado = await upsertSupermercado(source.nombre, source.slug);
    } catch (err) {
      console.error("[sync] Error registrando supermercado:", source.nombre, err.message);
      errores++;
      continue;
    }

    for (const term of source.searchTerms) {
      const productos = await fetchProductsFromSupermarket(source, term);

      for (const prod of productos) {
        if (!prod.nombre || !prod.precio_actual) {
          continue;
        }

        const prodCanon = normalizeIncomingProductCategories(prod);

        try {
          // Enriquecimiento opcional via Open Food Facts si tenemos EAN
          const prodEnriquecido = await maybeEnrichWithOff(prodCanon);

          const metadataJson = JSON.stringify({
            sourceSlug: source.slug,
            searchTerm: String(term),
            syncedAt: new Date().toISOString(),
            enrichedViaOff: prodEnriquecido !== prodCanon,
            id: prodEnriquecido.id_externo || null,
            nombre: prodEnriquecido.nombre,
            categoria: prodEnriquecido.categoria || null,
            subcategoria: prodEnriquecido.subcategoria || null,
            supermercado: source.slug,
            precio: prodEnriquecido.precio_actual,
            precioUnidad: prodEnriquecido.precio_referencia,
            unidadPrecio: prodEnriquecido.unidad_referencia || null,
            marca: prodEnriquecido.marca || null,
            imagen: prodEnriquecido.imagen || null,
            url: prodEnriquecido.url || null,
            stock: prodEnriquecido.stock != null ? prodEnriquecido.stock : null,
            cantidadFormato:
              prodEnriquecido.formato ||
              (prodEnriquecido.cantidad_unidad != null && prodEnriquecido.unidad_medida
                ? String(prodEnriquecido.cantidad_unidad) + " " + String(prodEnriquecido.unidad_medida)
                : null)
          });

          const { id: idProducto, isNew } = await upsertProducto(prodEnriquecido, metadataJson);

          const idProductoTienda = await upsertProductoTienda(
            idProducto,
            idSupermercado,
            prodEnriquecido.id_externo || null
          );

          await consultaDatos(
            "INSERT INTO Precios (id_producto_tienda, precio_actual, precio_oferta, precio_referencia, unidad_referencia, es_precio_tarjeta, fecha_extraccion) VALUES (?, ?, ?, ?, ?, ?, NOW())",
            [
              idProductoTienda,
              prodEnriquecido.precio_actual,
              prodEnriquecido.precio_oferta || null,
              prodEnriquecido.precio_referencia || null,
              prodEnriquecido.unidad_referencia || null,
              prodEnriquecido.es_precio_tarjeta || 0
            ]
          );

          if (isNew) {
            insertados++;
          } else {
            actualizados++;
          }
        } catch (err) {
          console.error("[sync] Error procesando producto:", prod.nombre, err.message);
          errores++;
        }
      }
    }
  }

  await closeBrowser().catch(function () {});
  console.log("[sync] Fin insertados:", insertados, "actualizados:", actualizados, "errores:", errores);
  return { insertados, actualizados, errores };
}

module.exports = { syncSupermarketData };
