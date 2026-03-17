const { consultaDatos } = require("../../config/db");
const { getActiveSupermarketSources } = require("../../utils/supermarket-sources");
const { enrichProductData } = require("../../utils/product-normalizer");
const { syncSupermarketData } = require("../../utils/supermarket-sync");

const SQL_PRECIOS_ULTIMOS =
  "SELECT P1.id_producto_tienda, P1.precio_actual, P1.precio_oferta, P1.precio_referencia, P1.unidad_referencia, P1.fecha_extraccion " +
  "FROM Precios P1 " +
  "INNER JOIN (SELECT id_producto_tienda, MAX(fecha_extraccion) AS max_fecha FROM Precios GROUP BY id_producto_tienda) P2 " +
  "ON P1.id_producto_tienda = P2.id_producto_tienda AND P1.fecha_extraccion = P2.max_fecha";

function getSources(req, res) {
  res.json({ sources: getActiveSupermarketSources() });
}

async function getComparatorOptions(req, res) {
  try {
    const rows = await consultaDatos(
      "SELECT PT.id_producto_tienda, P.id_producto, P.nombre, P.marca, P.imagen, P.categoria, P.subcategoria, P.unidad_medida, P.cantidad_unidad, P.formato, S.nombre_supermercado, PR.precio_actual, PR.precio_oferta, PR.precio_referencia, PR.unidad_referencia, PR.fecha_extraccion FROM ProductosTienda PT INNER JOIN Productos P ON P.id_producto = PT.id_producto INNER JOIN Supermercados S ON S.id_supermercado = PT.id_supermercado INNER JOIN (" +
        SQL_PRECIOS_ULTIMOS +
        ") PR ON PR.id_producto_tienda = PT.id_producto_tienda ORDER BY P.nombre ASC, S.nombre_supermercado ASC",
      []
    );

    const enrichedRows = rows.map(function (row) {
      return enrichProductData(row);
    });

    res.json({ items: enrichedRows });
  } catch (error) {
    console.error("Error en getComparatorOptions:", error);
    res.status(500).json({ message: "No se pudo cargar el comparador" });
  }
}

async function getCatalogMeta(req, res) {
  try {
    const catRows = await consultaDatos(
      "SELECT DISTINCT categoria FROM Productos WHERE categoria IS NOT NULL AND TRIM(categoria) <> '' ORDER BY categoria ASC",
      []
    );
    const subRows = await consultaDatos(
      "SELECT DISTINCT categoria, subcategoria FROM Productos WHERE subcategoria IS NOT NULL AND TRIM(subcategoria) <> '' ORDER BY categoria ASC, subcategoria ASC",
      []
    );
    const marcaRows = await consultaDatos(
      "SELECT DISTINCT marca FROM Productos WHERE marca IS NOT NULL AND TRIM(marca) <> '' ORDER BY marca ASC LIMIT 120",
      []
    );
    const supRows = await consultaDatos(
      "SELECT slug, nombre_supermercado FROM Supermercados WHERE activa = 1 ORDER BY nombre_supermercado ASC",
      []
    );

    const subcategoriesByCat = {};
    subRows.forEach(function (r) {
      const c = r.categoria;
      if (!subcategoriesByCat[c]) {
        subcategoriesByCat[c] = [];
      }
      if (subcategoriesByCat[c].indexOf(r.subcategoria) < 0) {
        subcategoriesByCat[c].push(r.subcategoria);
      }
    });

    res.json({
      categories: catRows.map(function (r) {
        return r.categoria;
      }),
      subcategoriesByCat: subcategoriesByCat,
      marcas: marcaRows.map(function (r) {
        return r.marca;
      }),
      supermarkets: supRows
    });
  } catch (error) {
    console.error("Error en getCatalogMeta:", error);
    res.status(500).json({ message: "No se pudieron cargar los metadatos del catalogo" });
  }
}

async function getListWizardProducts(req, res) {
  const categoria = String(req.query.categoria || "").trim();
  const subcategoria = String(req.query.subcategoria || "").trim();
  if (!categoria) {
    res.status(400).json({ message: "Falta el parametro categoria" });
    return;
  }

  const params = [categoria];
  let subFilter = "";
  if (subcategoria) {
    subFilter = " AND P_inner.subcategoria = ? ";
    params.push(subcategoria);
  }

  try {
    const sql =
      "WITH precios_actuales AS (" +
      "  SELECT P_inner.id_producto AS pid, P_inner.nombre, P_inner.marca, P_inner.categoria, P_inner.subcategoria, " +
      "    COALESCE(NULLIF(TRIM(P_inner.clave_comparable), ''), CONCAT('id:', P_inner.id_producto)) AS ck, " +
      "    PR.precio_actual, S.nombre_supermercado, " +
      "    ROW_NUMBER() OVER (PARTITION BY COALESCE(NULLIF(TRIM(P_inner.clave_comparable), ''), CONCAT('id:', P_inner.id_producto)) ORDER BY PR.precio_actual ASC, P_inner.id_producto ASC) AS rn " +
      "  FROM ProductosTienda PT " +
      "  INNER JOIN Productos P_inner ON P_inner.id_producto = PT.id_producto " +
      "  INNER JOIN Supermercados S ON S.id_supermercado = PT.id_supermercado " +
      "  INNER JOIN (" +
      SQL_PRECIOS_ULTIMOS +
      ") PR ON PR.id_producto_tienda = PT.id_producto_tienda " +
      "  WHERE P_inner.categoria = ? " +
      subFilter +
      ") " +
      "SELECT pid AS id_producto, nombre, marca, categoria, subcategoria, precio_actual AS mejor_precio, nombre_supermercado AS mejor_tienda, ck AS clave_comparable " +
      "FROM precios_actuales WHERE rn = 1 ORDER BY nombre ASC LIMIT 100";

    const rows = await consultaDatos(sql, params);
    res.json({ items: rows });
  } catch (error) {
    console.error("Error en getListWizardProducts:", error);
    res.status(500).json({ message: "No se pudieron cargar los productos" });
  }
}

async function getCatalog(req, res) {
  const search = req.query.search;
  const category = req.query.category;
  const subcategory = req.query.subcategory;
  const marca = req.query.marca;
  const supermarketSlug = req.query.supermarket;
  const precioMin = req.query.precio_min;
  const precioMax = req.query.precio_max;
  const onlyWithPrice =
    req.query.only_with_price === "1" ||
    req.query.only_with_price === "true" ||
    req.query.only_with_price === "yes";

  let page = parseInt(String(req.query.page || "1"), 10);
  let limit = parseInt(String(req.query.limit || "24"), 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }
  if (isNaN(limit) || limit < 1) {
    limit = 24;
  }
  if (limit > 100) {
    limit = 100;
  }

  const offset = (page - 1) * limit;
  const sort = String(req.query.sort || "nombre").toLowerCase();

  const orderByWhitelist = {
    nombre: "P.nombre ASC",
    precio_asc: "Agg.min_p ASC, P.nombre ASC",
    precio_desc: "Agg.min_p DESC, P.nombre ASC",
    savings: "(IFNULL(Agg.max_p,0) - IFNULL(Agg.min_p,0)) DESC, P.nombre ASC"
  };
  const orderSql = orderByWhitelist[sort] || orderByWhitelist.nombre;

  try {
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push("(P.nombre LIKE ? OR P.marca LIKE ?)");
      params.push("%" + search + "%", "%" + search + "%");
    }
    if (category) {
      conditions.push("P.categoria = ?");
      params.push(category);
    }
    if (subcategory) {
      conditions.push("P.subcategoria = ?");
      params.push(subcategory);
    }
    if (marca) {
      conditions.push("P.marca = ?");
      params.push(marca);
    }
    if (onlyWithPrice) {
      conditions.push("Agg.min_p IS NOT NULL");
    }

    const pm = precioMin !== undefined && precioMin !== "" ? Number(precioMin) : null;
    const pM = precioMax !== undefined && precioMax !== "" ? Number(precioMax) : null;
    if (pm !== null && !isNaN(pm)) {
      conditions.push("Agg.min_p >= ?");
      params.push(pm);
    }
    if (pM !== null && !isNaN(pM)) {
      conditions.push("Agg.min_p <= ?");
      params.push(pM);
    }

    if (supermarketSlug) {
      conditions.push(
        "EXISTS (SELECT 1 FROM ProductosTienda PTf " +
          "INNER JOIN Supermercados Sf ON Sf.id_supermercado = PTf.id_supermercado AND Sf.slug = ? " +
          "INNER JOIN (" +
          SQL_PRECIOS_ULTIMOS +
          ") PRf ON PRf.id_producto_tienda = PTf.id_producto_tienda " +
          "WHERE PTf.id_producto = P.id_producto)"
      );
      params.push(supermarketSlug);
    }

    const where = conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";

    const fromCore =
      "FROM Productos P " +
      "LEFT JOIN (" +
      "  SELECT PT.id_producto, MIN(PR.precio_actual) AS min_p, MAX(PR.precio_actual) AS max_p " +
      "  FROM ProductosTienda PT " +
      "  INNER JOIN (" +
      SQL_PRECIOS_ULTIMOS +
      ") PR ON PR.id_producto_tienda = PT.id_producto_tienda " +
      "  GROUP BY PT.id_producto" +
      ") Agg ON Agg.id_producto = P.id_producto ";

    const countRows = await consultaDatos("SELECT COUNT(*) AS total " + fromCore + where, params.slice());
    const total = Number(countRows[0].total) || 0;

    const lim = Math.min(100, Math.max(1, limit));
    const off = Math.max(0, offset);

    const rows = await consultaDatos(
      "SELECT P.id_producto, P.nombre, P.marca, P.imagen, P.categoria, P.subcategoria, P.unidad_medida, P.cantidad_unidad, P.formato, " +
        "Agg.min_p AS mejor_precio_catalogo, Agg.max_p AS max_precio_catalogo " +
        fromCore +
        where +
        " ORDER BY " +
        orderSql +
        " LIMIT " +
        lim +
        " OFFSET " +
        off,
      params.slice()
    );

    const enrichedRows = rows.map(function (row) {
      const r2 = {
        id_producto: row.id_producto,
        nombre: row.nombre,
        marca: row.marca,
        imagen: row.imagen,
        categoria: row.categoria,
        subcategoria: row.subcategoria,
        unidad_medida: row.unidad_medida,
        cantidad_unidad: row.cantidad_unidad,
        formato: row.formato,
        mejor_precio: row.mejor_precio_catalogo,
        precio_actual: row.mejor_precio_catalogo,
        max_precio_tiendas: row.max_precio_catalogo,
        precio_oferta: null,
        precio_referencia: null,
        unidad_referencia: null
      };
      return enrichProductData(r2);
    });

    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);

    const catRows = await consultaDatos(
      "SELECT DISTINCT categoria FROM Productos WHERE categoria IS NOT NULL AND TRIM(categoria) <> '' ORDER BY categoria ASC",
      []
    );
    const categories = catRows.map(function (r) {
      return r.categoria;
    });

    res.json({
      products: enrichedRows,
      total: total,
      page: page,
      pageSize: limit,
      totalPages: totalPages,
      categories: categories
    });
  } catch (error) {
    console.error("Error en getCatalog:", error);
    res.status(500).json({ message: "No se pudo cargar el catalogo" });
  }
}

async function getBestPrices(req, res) {
  try {
    const rows = await consultaDatos(
      "WITH precios_recientes AS (SELECT P1.id_producto_tienda, P1.precio_actual, P1.precio_referencia, P1.unidad_referencia FROM Precios P1 INNER JOIN (SELECT id_producto_tienda, MAX(fecha_extraccion) AS max_fecha FROM Precios GROUP BY id_producto_tienda) P2 ON P1.id_producto_tienda = P2.id_producto_tienda AND P1.fecha_extraccion = P2.max_fecha), precios_ordenados AS (SELECT P.id_producto, P.nombre, P.marca, P.imagen, P.categoria, P.unidad_medida, P.cantidad_unidad, P.formato, S.nombre_supermercado AS supermercado, PR.precio_actual AS mejor_precio, PR.precio_referencia, PR.unidad_referencia, ROW_NUMBER() OVER (PARTITION BY P.id_producto ORDER BY PR.precio_actual ASC, S.nombre_supermercado ASC) AS fila FROM Productos P INNER JOIN ProductosTienda PT ON PT.id_producto = P.id_producto INNER JOIN Supermercados S ON S.id_supermercado = PT.id_supermercado INNER JOIN precios_recientes PR ON PR.id_producto_tienda = PT.id_producto_tienda) SELECT id_producto, nombre, marca, imagen, categoria, unidad_medida, cantidad_unidad, formato, supermercado, mejor_precio, precio_referencia, unidad_referencia FROM precios_ordenados WHERE fila = 1 ORDER BY nombre ASC",
      []
    );

    const enrichedRows = rows.map(function (row) {
      return enrichProductData(row);
    });

    res.json({ prices: enrichedRows });
  } catch (error) {
    console.error("Error en getBestPrices:", error);
    res.status(500).json({ message: "No se pudieron cargar los precios" });
  }
}

async function syncPrices(req, res) {
  try {
    const stats = await syncSupermarketData();
    res.json({ ok: true, stats });
  } catch (error) {
    console.error("Error en syncPrices:", error);
    res.status(500).json({ message: "No se pudo sincronizar los precios" });
  }
}

module.exports = {
  getSources,
  getComparatorOptions,
  getCatalogMeta,
  getListWizardProducts,
  getCatalog,
  getBestPrices,
  syncPrices
};
