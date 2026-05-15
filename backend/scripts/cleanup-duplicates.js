require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const { consultaDatos, pool } = require("../config/db");

async function main() {
  console.log("[cleanup] Analizando productos duplicados...");

  // 1. Buscar nombres duplicados (mismo nombre, distintas marcas o sin marca especificada)
  const dupes = await consultaDatos(
    "SELECT nombre, COUNT(*) as c FROM Productos GROUP BY nombre HAVING c > 1 ORDER BY c DESC"
  );
  console.log("[cleanup] Nombres duplicados:", dupes.length, "grupos");
  dupes.forEach(function (r) {
    console.log("  -", r.nombre, "x" + r.c);
  });

  // 2. Buscar duplicados por clave_comparable
  const dupesClave = await consultaDatos(
    "SELECT clave_comparable, COUNT(*) as c FROM Productos WHERE clave_comparable IS NOT NULL AND clave_comparable != '' GROUP BY clave_comparable HAVING c > 1 ORDER BY c DESC"
  );
  console.log("\n[cleanup] Claves comparables duplicadas:", dupesClave.length, "grupos");

  // 3. Para cada nombre duplicado, verificar si son el mismo producto con distinta marca
  // y si tienen clave_comparable que debería unificarlos
  let pricesDeleted = 0;
  let ptDeleted = 0;
  let productsDeleted = 0;

  for (const dupe of dupesClave) {
    const products = await consultaDatos(
      "SELECT id_producto, nombre, marca, clave_comparable FROM Productos WHERE clave_comparable = ? ORDER BY id_producto ASC",
      [dupe.clave_comparable]
    );

    if (products.length <= 1) continue;

    // Keep the first (oldest) product, merge others into it
    const keepId = products[0].id_producto;

    for (let i = 1; i < products.length; i++) {
      const removeId = products[i].id_producto;

      // Check if the product to remove has a ProductosTienda entry for a supermarket
      // that the kept product doesn't have
      const removePTs = await consultaDatos(
        "SELECT id_producto_tienda, id_supermercado FROM ProductosTienda WHERE id_producto = ?",
        [removeId]
      );
      const keepPTs = await consultaDatos(
        "SELECT id_supermercado FROM ProductosTienda WHERE id_producto = ?",
        [keepId]
      );
      const keepSuperIds = keepPTs.map(function (r) { return r.id_supermercado; });

      for (const pt of removePTs) {
        if (keepSuperIds.indexOf(pt.id_supermercado) < 0) {
          // Reassign this ProductosTienda to the kept product
          await consultaDatos(
            "UPDATE ProductosTienda SET id_producto = ? WHERE id_producto_tienda = ?",
            [keepId, pt.id_producto_tienda]
          );
          console.log("  Reasigned PT", pt.id_producto_tienda, "from product", removeId, "to", keepId, "(super", pt.id_supermercado, ")");
        } else {
          // Duplicate supermarket entry - delete prices and PT
          const priceCount = await consultaDatos(
            "SELECT COUNT(*) as c FROM Precios WHERE id_producto_tienda = ?",
            [pt.id_producto_tienda]
          );
          await consultaDatos(
            "DELETE FROM Precios WHERE id_producto_tienda = ?",
            [pt.id_producto_tienda]
          );
          pricesDeleted += priceCount[0].c;
          await consultaDatos(
            "DELETE FROM ProductosTienda WHERE id_producto_tienda = ?",
            [pt.id_producto_tienda]
          );
          ptDeleted++;
          console.log("  Deleted duplicate PT", pt.id_producto_tienda, "for super", pt.id_supermercado);
        }
      }

      // Delete any remaining Prices/PT for the removed product
      const remainingPTs = await consultaDatos(
        "SELECT id_producto_tienda FROM ProductosTienda WHERE id_producto = ?",
        [removeId]
      );
      for (const rpt of remainingPTs) {
        const pc = await consultaDatos(
          "SELECT COUNT(*) as c FROM Precios WHERE id_producto_tienda = ?",
          [rpt.id_producto_tienda]
        );
        await consultaDatos("DELETE FROM Precios WHERE id_producto_tienda = ?", [rpt.id_producto_tienda]);
        pricesDeleted += pc[0].c;
        await consultaDatos("DELETE FROM ProductosTienda WHERE id_producto_tienda = ?", [rpt.id_producto_tienda]);
        ptDeleted++;
      }

      // Delete the duplicate product
      await consultaDatos("DELETE FROM Productos WHERE id_producto = ?", [removeId]);
      productsDeleted++;
      console.log("  Merged product", removeId, "into", keepId, "-", products[i].nombre);
    }
  }

  // 4. Also clean up products with categoria = "supermercado eroski" (scraping artifact)
  const eroskiCat = await consultaDatos(
    "SELECT COUNT(*) as c FROM Productos WHERE categoria = 'supermercado eroski'"
  );
  if (eroskiCat[0].c > 0) {
    const ePTs = await consultaDatos(
      "SELECT PT.id_producto_tienda FROM ProductosTienda PT INNER JOIN Productos P ON P.id_producto = PT.id_producto WHERE P.categoria = 'supermercado eroski'"
    );
    for (const pt of ePTs) {
      await consultaDatos("DELETE FROM Precios WHERE id_producto_tienda = ?", [pt.id_producto_tienda]);
      await consultaDatos("DELETE FROM ProductosTienda WHERE id_producto_tienda = ?", [pt.id_producto_tienda]);
    }
    await consultaDatos("DELETE FROM Productos WHERE categoria = 'supermercado eroski'");
    console.log("[cleanup] Deleted", eroskiCat[0].c, "products with categoria 'supermercado eroski'");
  }

  // 5. Clean up products without any prices/tienda (orphan products)
  const orphans = await consultaDatos(
    "SELECT P.id_producto FROM Productos P LEFT JOIN ProductosTienda PT ON PT.id_producto = P.id_producto WHERE PT.id_producto IS NULL"
  );
  for (const o of orphans) {
    await consultaDatos("DELETE FROM Productos WHERE id_producto = ?", [o.id_producto]);
  }
  console.log("[cleanup] Deleted", orphans.length, "orphan products with no prices");

  // 6. Remove duplicate prices (same product_tienda, same date)
  const dupPrices = await consultaDatos(
    "SELECT id_producto_tienda, DATE(fecha_extraccion) as fd, COUNT(*) as c FROM Precios GROUP BY id_producto_tienda, DATE(fecha_extraccion) HAVING c > 1"
  );
  for (const dp of dupPrices) {
    const keepPrice = await consultaDatos(
      "SELECT id_precio FROM Precios WHERE id_producto_tienda = ? AND DATE(fecha_extraccion) = ? ORDER BY id_precio DESC LIMIT 1",
      [dp.id_producto_tienda, dp.fd]
    );
    if (keepPrice.length > 0) {
      await consultaDatos(
        "DELETE FROM Precios WHERE id_producto_tienda = ? AND DATE(fecha_extraccion) = ? AND id_precio != ?",
        [dp.id_producto_tienda, dp.fd, keepPrice[0].id_precio]
      );
    }
  }
  console.log("[cleanup] Cleaned duplicate price entries for", dupPrices.length, "product_tienda/date combos");

  // Stats
  const finalCount = await consultaDatos("SELECT COUNT(*) as c FROM Productos");
  const finalPT = await consultaDatos("SELECT COUNT(*) as c FROM ProductosTienda");
  const finalPrices = await consultaDatos("SELECT COUNT(*) as c FROM Precios");
  console.log("\n[cleanup] RESULTS:");
  console.log("  Products deleted:", productsDeleted);
  console.log("  ProductTienda deleted:", ptDeleted);
  console.log("  Prices deleted:", pricesDeleted);
  console.log("  Orphans deleted:", orphans.length);
  console.log("  Final products:", finalCount[0].c);
  console.log("  Final product_tienda:", finalPT[0].c);
  console.log("  Final prices:", finalPrices[0].c);

  pool.end();
}

main().catch(function (e) {
  console.error("[cleanup] Error:", e);
  pool.end();
  process.exit(1);
});