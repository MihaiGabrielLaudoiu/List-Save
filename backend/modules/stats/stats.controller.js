const { consultaDatos } = require("../../config/db");

const SQL_PRECIOS_ULTIMOS =
  "SELECT P1.id_producto_tienda, P1.precio_actual, P1.precio_oferta, P1.precio_referencia, P1.unidad_referencia, P1.fecha_extraccion " +
  "FROM Precios P1 " +
  "INNER JOIN (SELECT id_producto_tienda, MAX(fecha_extraccion) AS max_fecha FROM Precios GROUP BY id_producto_tienda) P2 " +
  "ON P1.id_producto_tienda = P2.id_producto_tienda AND P1.fecha_extraccion = P2.max_fecha";

async function getCatalogStats(req, res) {
  try {
    const sqlProductosConPrecio =
      "SELECT COUNT(DISTINCT PT.id_producto) AS n " +
      "FROM ProductosTienda PT " +
      "INNER JOIN (" +
      SQL_PRECIOS_ULTIMOS +
      ") PR ON PR.id_producto_tienda = PT.id_producto_tienda " +
      "WHERE PR.precio_actual IS NOT NULL";

    const sqlPreciosRegistrados = "SELECT COUNT(*) AS n FROM (" + SQL_PRECIOS_ULTIMOS + ") U";

    const sqlPorCategoria =
      "SELECT COALESCE(NULLIF(TRIM(categoria), ''), '(Sin categoría)') AS etiqueta, COUNT(*) AS n " +
      "FROM Productos " +
      "GROUP BY COALESCE(NULLIF(TRIM(categoria), ''), '(Sin categoría)') " +
      "ORDER BY n DESC";

    const sqlCobertura =
      "SELECT S.nombre_supermercado AS etiqueta, COUNT(DISTINCT PT.id_producto) AS n " +
      "FROM Supermercados S " +
      "INNER JOIN ProductosTienda PT ON PT.id_supermercado = S.id_supermercado " +
      "INNER JOIN (" +
      SQL_PRECIOS_ULTIMOS +
      ") PR ON PR.id_producto_tienda = PT.id_producto_tienda " +
      "WHERE S.activa = 1 AND PR.precio_actual IS NOT NULL " +
      "GROUP BY S.id_supermercado, S.nombre_supermercado " +
      "ORDER BY n DESC";

    const sqlRangos =
      "SELECT " +
      "SUM(CASE WHEN t.min_p < 1 THEN 1 ELSE 0 END) AS b0_1, " +
      "SUM(CASE WHEN t.min_p >= 1 AND t.min_p < 3 THEN 1 ELSE 0 END) AS b1_3, " +
      "SUM(CASE WHEN t.min_p >= 3 AND t.min_p < 5 THEN 1 ELSE 0 END) AS b3_5, " +
      "SUM(CASE WHEN t.min_p >= 5 AND t.min_p < 10 THEN 1 ELSE 0 END) AS b5_10, " +
      "SUM(CASE WHEN t.min_p >= 10 THEN 1 ELSE 0 END) AS b10p " +
      "FROM ( " +
      "  SELECT P.id_producto, MIN(PR.precio_actual) AS min_p " +
      "  FROM Productos P " +
      "  INNER JOIN ProductosTienda PT ON PT.id_producto = P.id_producto " +
      "  INNER JOIN (" +
      SQL_PRECIOS_ULTIMOS +
      ") PR ON PR.id_producto_tienda = PT.id_producto_tienda " +
      "  GROUP BY P.id_producto " +
      ") t";

    const sqlMediaSuper =
      "SELECT S.nombre_supermercado AS etiqueta, AVG(PR.precio_actual) AS media " +
      "FROM Supermercados S " +
      "INNER JOIN ProductosTienda PT ON PT.id_supermercado = S.id_supermercado " +
      "INNER JOIN (" +
      SQL_PRECIOS_ULTIMOS +
      ") PR ON PR.id_producto_tienda = PT.id_producto_tienda " +
      "WHERE S.activa = 1 AND PR.precio_actual IS NOT NULL " +
      "GROUP BY S.id_supermercado, S.nombre_supermercado " +
      "ORDER BY media ASC";

    const sqlTopBaratos =
      "SELECT P.nombre, P.marca, MIN(PR.precio_actual) AS min_precio " +
      "FROM Productos P " +
      "INNER JOIN ProductosTienda PT ON PT.id_producto = P.id_producto " +
      "INNER JOIN (" +
      SQL_PRECIOS_ULTIMOS +
      ") PR ON PR.id_producto_tienda = PT.id_producto_tienda " +
      "GROUP BY P.id_producto, P.nombre, P.marca " +
      "ORDER BY min_precio ASC " +
      "LIMIT 10";

    const sqlTopSubcats =
      "SELECT TRIM(subcategoria) AS etiqueta, COUNT(*) AS n " +
      "FROM Productos " +
      "WHERE subcategoria IS NOT NULL AND TRIM(subcategoria) <> '' " +
      "GROUP BY TRIM(subcategoria) " +
      "ORDER BY n DESC " +
      "LIMIT 10";

    const [
      totalProductos,
      totalSupermercados,
      preciosRegistrados,
      productosConPrecio,
      porCategoria,
      coberturaSuper,
      rangosRow,
      mediaSuper,
      topBaratos,
      topSubcats
    ] = await Promise.all([
      consultaDatos("SELECT COUNT(*) AS n FROM Productos", []),
      consultaDatos("SELECT COUNT(*) AS n FROM Supermercados WHERE activa = 1", []),
      consultaDatos(sqlPreciosRegistrados, []),
      consultaDatos(sqlProductosConPrecio, []),
      consultaDatos(sqlPorCategoria, []),
      consultaDatos(sqlCobertura, []),
      consultaDatos(sqlRangos, []),
      consultaDatos(sqlMediaSuper, []),
      consultaDatos(sqlTopBaratos, []),
      consultaDatos(sqlTopSubcats, [])
    ]);

    const nProd = totalProductos[0] && Number(totalProductos[0].n);
    const nSup = totalSupermercados[0] && Number(totalSupermercados[0].n);
    const nPrec = preciosRegistrados[0] && Number(preciosRegistrados[0].n);
    const nConPrecio = productosConPrecio[0] && Number(productosConPrecio[0].n);
    const sinPrecio = Math.max(0, (nProd || 0) - (nConPrecio || 0));

    const r = rangosRow[0] || {};
    const rangosPrecio = [
      { etiqueta: "Menos de 1 €", n: Number(r.b0_1) || 0 },
      { etiqueta: "1 € – 3 €", n: Number(r.b1_3) || 0 },
      { etiqueta: "3 € – 5 €", n: Number(r.b3_5) || 0 },
      { etiqueta: "5 € – 10 €", n: Number(r.b5_10) || 0 },
      { etiqueta: "10 € o más", n: Number(r.b10p) || 0 }
    ];

    const topBaratosMapped = topBaratos.map(function (row) {
      const marca = row.marca ? " (" + row.marca + ")" : "";
      return {
        etiqueta: String(row.nombre || "").slice(0, 48) + marca,
        min_precio: row.min_precio !== null && row.min_precio !== undefined ? Number(row.min_precio) : null
      };
    });

    res.json({
      kpis: {
        productos: nProd || 0,
        precios_registrados: nPrec || 0,
        supermercados: nSup || 0,
        sin_precio: sinPrecio
      },
      por_categoria: porCategoria.map(function (row) {
        return { etiqueta: row.etiqueta, n: Number(row.n) || 0 };
      }),
      cobertura_supermercado: coberturaSuper.map(function (row) {
        return { etiqueta: row.etiqueta, n: Number(row.n) || 0 };
      }),
      rangos_precio: rangosPrecio,
      precio_medio_super: mediaSuper.map(function (row) {
        return {
          etiqueta: row.etiqueta,
          media: row.media !== null && row.media !== undefined ? Number(row.media) : null
        };
      }),
      top_baratos: topBaratosMapped,
      top_subcategorias: topSubcats.map(function (row) {
        return { etiqueta: row.etiqueta, n: Number(row.n) || 0 };
      })
    });
  } catch (error) {
    console.error("Error en getCatalogStats:", error);
    res.status(500).json({ message: "No se pudieron calcular las estadísticas del catálogo" });
  }
}

module.exports = {
  getCatalogStats
};
