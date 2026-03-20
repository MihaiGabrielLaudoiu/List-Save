const { consultaDatos } = require("../../config/db");

function isListasSchemaMissing(error) {
  return Boolean(error && (error.code === "ER_NO_SUCH_TABLE" || error.errno === 1146));
}

function respondListasError(error, res, defaultMessage) {
  console.error(defaultMessage, error);
  if (isListasSchemaMissing(error)) {
    res.status(503).json({
      message:
        "Falta aplicar la migracion de listas. En MySQL ejecuta backend/db/migration-listas-cabecera.sql sobre la base de datos del proyecto.",
      code: "LISTAS_MIGRATION_REQUIRED"
    });
    return;
  }
  res.status(500).json({ message: defaultMessage });
}

const SQL_MEJOR_PRECIO_POR_PRODUCTO = `
  SELECT id_producto, nombre_supermercado AS mejor_tienda, mejor_precio FROM (
    SELECT P0.id_producto, S.nombre_supermercado,
      PR.precio_actual AS mejor_precio,
      ROW_NUMBER() OVER (PARTITION BY P0.id_producto ORDER BY PR.precio_actual ASC, S.nombre_supermercado ASC) AS rn
    FROM Productos P0
    INNER JOIN ProductosTienda PT ON PT.id_producto = P0.id_producto
    INNER JOIN Supermercados S ON S.id_supermercado = PT.id_supermercado
    INNER JOIN (
      SELECT P1.id_producto_tienda, P1.precio_actual
      FROM Precios P1
      INNER JOIN (
        SELECT id_producto_tienda, MAX(fecha_extraccion) AS mf
        FROM Precios GROUP BY id_producto_tienda
      ) P2 ON P1.id_producto_tienda = P2.id_producto_tienda AND P1.fecha_extraccion = P2.mf
    ) PR ON PR.id_producto_tienda = PT.id_producto_tienda
  ) ranked WHERE ranked.rn = 1
`;

async function ensureDefaultCabecera(userId) {
  const existentes = await consultaDatos(
    "SELECT cabecera_id FROM ListasCabecera WHERE user_id = ? ORDER BY cabecera_id ASC LIMIT 1",
    [userId]
  );
  if (existentes.length > 0) {
    return existentes[0].cabecera_id;
  }
  const ins = await consultaDatos(
    "INSERT INTO ListasCabecera (user_id, nombre) VALUES (?, ?)",
    [userId, "Mi lista"]
  );
  return ins.insertId;
}

async function cabeceraPerteneceUsuario(cabeceraId, userId) {
  const rows = await consultaDatos(
    "SELECT cabecera_id FROM ListasCabecera WHERE cabecera_id = ? AND user_id = ? LIMIT 1",
    [cabeceraId, userId]
  );
  return rows.length > 0;
}

async function getCabeceras(req, res) {
  const userId = req.user.user_id;
  try {
    let cabeceras = await consultaDatos(
      "SELECT C.cabecera_id, C.nombre, C.created_at, COUNT(L.list_id) AS item_count FROM ListasCabecera C LEFT JOIN ListasGuardadas L ON L.cabecera_id = C.cabecera_id WHERE C.user_id = ? GROUP BY C.cabecera_id, C.nombre, C.created_at ORDER BY C.cabecera_id ASC",
      [userId]
    );
    if (cabeceras.length === 0) {
      await ensureDefaultCabecera(userId);
      cabeceras = await consultaDatos(
        "SELECT C.cabecera_id, C.nombre, C.created_at, COUNT(L.list_id) AS item_count FROM ListasCabecera C LEFT JOIN ListasGuardadas L ON L.cabecera_id = C.cabecera_id WHERE C.user_id = ? GROUP BY C.cabecera_id, C.nombre, C.created_at ORDER BY C.cabecera_id ASC",
        [userId]
      );
    }
    res.json({ cabeceras });
  } catch (error) {
    respondListasError(error, res, "No se pudieron cargar las listas");
  }
}

async function createCabecera(req, res) {
  const userId = req.user.user_id;
  let nombre = (req.body.nombre || "Nueva lista").trim();
  if (nombre.length > 120) {
    nombre = nombre.slice(0, 120);
  }
  if (!nombre) {
    res.status(400).json({ message: "El nombre no puede estar vacio" });
    return;
  }
  try {
    const ins = await consultaDatos(
      "INSERT INTO ListasCabecera (user_id, nombre) VALUES (?, ?)",
      [userId, nombre]
    );
    res.status(201).json({
      cabecera_id: ins.insertId,
      nombre,
      item_count: 0
    });
  } catch (error) {
    respondListasError(error, res, "No se pudo crear la lista");
  }
}

async function updateCabecera(req, res) {
  const userId = req.user.user_id;
  const cabeceraId = Number(req.params.cabeceraId);
  let nombre = (req.body.nombre || "").trim();
  if (!cabeceraId || !nombre) {
    res.status(400).json({ message: "Datos invalidos" });
    return;
  }
  if (nombre.length > 120) {
    nombre = nombre.slice(0, 120);
  }
  try {
    const ok = await cabeceraPerteneceUsuario(cabeceraId, userId);
    if (!ok) {
      res.status(404).json({ message: "Lista no encontrada" });
      return;
    }
    const result = await consultaDatos(
      "UPDATE ListasCabecera SET nombre = ? WHERE cabecera_id = ? AND user_id = ?",
      [nombre, cabeceraId, userId]
    );
    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Lista no encontrada" });
      return;
    }
    res.json({ message: "Nombre actualizado", cabecera_id: cabeceraId, nombre });
  } catch (error) {
    respondListasError(error, res, "No se pudo actualizar el nombre");
  }
}

async function deleteCabecera(req, res) {
  const userId = req.user.user_id;
  const cabeceraId = Number(req.params.cabeceraId);
  if (!cabeceraId) {
    res.status(400).json({ message: "Identificador invalido" });
    return;
  }
  try {
    const todas = await consultaDatos(
      "SELECT cabecera_id FROM ListasCabecera WHERE user_id = ?",
      [userId]
    );
    if (todas.length <= 1) {
      res.status(400).json({ message: "No puedes eliminar tu unica lista" });
      return;
    }
    const ok = await cabeceraPerteneceUsuario(cabeceraId, userId);
    if (!ok) {
      res.status(404).json({ message: "Lista no encontrada" });
      return;
    }
    await consultaDatos("DELETE FROM ListasCabecera WHERE cabecera_id = ? AND user_id = ?", [
      cabeceraId,
      userId
    ]);
    res.json({ message: "Lista eliminada" });
  } catch (error) {
    respondListasError(error, res, "No se pudo eliminar la lista");
  }
}

async function getMyList(req, res) {
  const userId = req.user.user_id;
  let cabeceraId = Number(req.query.cabecera_id);

  try {
    if (!cabeceraId) {
      cabeceraId = await ensureDefaultCabecera(userId);
    } else {
      const ok = await cabeceraPerteneceUsuario(cabeceraId, userId);
      if (!ok) {
        res.status(404).json({ message: "Lista no encontrada" });
        return;
      }
    }

    const rows = await consultaDatos(
      `SELECT L.list_id, L.product_id, L.cantidad, L.cabecera_id,
        P.nombre, P.marca, P.categoria, P.subcategoria,
        PO.mejor_tienda,
        PO.mejor_precio
      FROM ListasGuardadas L
      INNER JOIN Productos P ON P.id_producto = L.product_id
      LEFT JOIN (${SQL_MEJOR_PRECIO_POR_PRODUCTO}) PO ON PO.id_producto = L.product_id
      WHERE L.user_id = ? AND L.cabecera_id = ?
      ORDER BY L.list_id DESC`,
      [userId, cabeceraId]
    );

    res.json({ items: rows, cabecera_id: cabeceraId });
  } catch (error) {
    respondListasError(error, res, "No se pudo cargar la lista");
  }
}

async function addItem(req, res) {
  const userId = req.user.user_id;
  const productId = Number(req.body.product_id);
  const cantidad = Number(req.body.cantidad || 1);
  let cabeceraId = Number(req.body.cabecera_id);

  if (!productId || cantidad <= 0) {
    res.status(400).json({ message: "Datos invalidos" });
    return;
  }

  try {
    if (!cabeceraId) {
      cabeceraId = await ensureDefaultCabecera(userId);
    } else {
      const ok = await cabeceraPerteneceUsuario(cabeceraId, userId);
      if (!ok) {
        res.status(404).json({ message: "Lista no encontrada" });
        return;
      }
    }

    const existing = await consultaDatos(
      "SELECT list_id, cantidad FROM ListasGuardadas WHERE cabecera_id = ? AND product_id = ? LIMIT 1",
      [cabeceraId, productId]
    );

    if (existing.length > 0) {
      const newQuantity = Number(existing[0].cantidad) + cantidad;
      await consultaDatos("UPDATE ListasGuardadas SET cantidad = ? WHERE list_id = ?", [
        newQuantity,
        existing[0].list_id
      ]);
    } else {
      await consultaDatos(
        "INSERT INTO ListasGuardadas (user_id, cabecera_id, product_id, cantidad) VALUES (?, ?, ?, ?)",
        [userId, cabeceraId, productId, cantidad]
      );
    }

    res.status(201).json({ message: "Producto guardado en la lista", cabecera_id: cabeceraId });
  } catch (error) {
    respondListasError(error, res, "No se pudo guardar el producto");
  }
}

async function updateItem(req, res) {
  const userId = req.user.user_id;
  const listId = Number(req.params.listId);
  const cantidad = Number(req.body.cantidad);

  if (!listId || !cantidad || cantidad <= 0) {
    res.status(400).json({ message: "Cantidad invalida" });
    return;
  }

  try {
    const result = await consultaDatos(
      "UPDATE ListasGuardadas SET cantidad = ? WHERE list_id = ? AND user_id = ?",
      [cantidad, listId, userId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Elemento no encontrado" });
      return;
    }

    res.json({ message: "Cantidad actualizada" });
  } catch (error) {
    respondListasError(error, res, "No se pudo actualizar");
  }
}

async function deleteItem(req, res) {
  const userId = req.user.user_id;
  const listId = Number(req.params.listId);

  if (!listId) {
    res.status(400).json({ message: "Identificador invalido" });
    return;
  }

  try {
    const result = await consultaDatos(
      "DELETE FROM ListasGuardadas WHERE list_id = ? AND user_id = ?",
      [listId, userId]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Elemento no encontrado" });
      return;
    }

    res.json({ message: "Elemento eliminado" });
  } catch (error) {
    respondListasError(error, res, "No se pudo eliminar");
  }
}

module.exports = {
  getCabeceras,
  createCabecera,
  updateCabecera,
  deleteCabecera,
  getMyList,
  addItem,
  updateItem,
  deleteItem
};
