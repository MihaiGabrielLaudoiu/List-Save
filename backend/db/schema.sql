-- ======================================================================
-- List & Save - Esquema completo de la base de datos
-- ----------------------------------------------------------------------
-- Para relanzar el proyecto en un servidor nuevo:
--   mysql -u root -p < backend/db/schema.sql
--   mysql -u root -p < backend/db/seed.sql
--
-- Este archivo es la unica fuente de verdad del esquema. No hay migraciones
-- sueltas: si necesitas cambiar la estructura, edita aqui y vuelve a crear.
-- ======================================================================

DROP DATABASE IF EXISTS list_save;
CREATE DATABASE list_save CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE list_save;

-- ----------------------------------------------------------------------
-- Usuarios y sus ajustes
-- ----------------------------------------------------------------------
CREATE TABLE Usuarios (
  user_id INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  fullname VARCHAR(120) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uk_usuarios_email (email)
) ENGINE=InnoDB;

CREATE TABLE AjustesUsuario (
  user_id INT NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'es',
  postal_code VARCHAR(10) NULL,
  card_last4 VARCHAR(4) NULL,
  card_name VARCHAR(120) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_ajustes_usuario FOREIGN KEY (user_id) REFERENCES Usuarios(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------
-- Catalogo de productos: un producto comparable (mismo formato y marca)
-- vive una sola vez en esta tabla aunque lo vendan varios supermercados.
-- ----------------------------------------------------------------------
CREATE TABLE Productos (
  id_producto INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(200) NOT NULL,
  marca VARCHAR(120) NOT NULL,
  ean VARCHAR(20) NULL,
  imagen VARCHAR(500) NULL,
  descripcion TEXT NULL,
  categoria VARCHAR(100) NULL,
  subcategoria VARCHAR(100) NULL,
  unidad_medida VARCHAR(20) NULL,         -- kg, l, ud, g, ml
  cantidad_unidad DECIMAL(10,3) NULL,     -- ej. 1.5 para 1,5 kg
  formato VARCHAR(100) NULL,              -- ej. "Pack 6 uds", "Botella 1L"
  alergenos TEXT NULL,                    -- lista separada por comas: gluten,lactosa
  ingredientes TEXT NULL,
  info_nutricional JSON NULL,             -- { calorias, grasas, hidratos, proteinas, sal }
  origen VARCHAR(100) NULL,
  -- clave normalizada para agrupar productos equivalentes entre supermercados
  -- ej. "leche-entera-1l" comparte clave aunque sea marca Pascual o Hacendado
  clave_comparable VARCHAR(160) NULL,
  metadata JSON NULL,                     -- trazas del sync y datos crudos opcionales
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_producto),
  KEY idx_productos_nombre (nombre),
  KEY idx_productos_categoria (categoria),
  KEY idx_productos_clave_comparable (clave_comparable),
  KEY idx_productos_ean (ean),
  UNIQUE KEY uk_producto_nombre_marca (nombre, marca)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------
-- Supermercados y sus ofertas concretas
-- ----------------------------------------------------------------------
CREATE TABLE Supermercados (
  id_supermercado INT NOT NULL AUTO_INCREMENT,
  nombre_supermercado VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  logo VARCHAR(255) NULL,
  color_hex VARCHAR(8) NULL,
  activa TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_supermercado),
  UNIQUE KEY uk_supermercado_nombre (nombre_supermercado),
  UNIQUE KEY uk_supermercado_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE ProductosTienda (
  id_producto_tienda INT NOT NULL AUTO_INCREMENT,
  id_producto INT NOT NULL,
  id_supermercado INT NOT NULL,
  url_producto_externo VARCHAR(500) NULL,
  id_externo VARCHAR(100) NULL,           -- id del producto en el supermercado
  disponible TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_producto_tienda),
  KEY idx_productotienda_producto (id_producto),
  KEY idx_productotienda_supermercado (id_supermercado),
  UNIQUE KEY uk_producto_tienda (id_producto, id_supermercado),
  CONSTRAINT fk_pt_producto FOREIGN KEY (id_producto) REFERENCES Productos(id_producto) ON DELETE CASCADE,
  CONSTRAINT fk_pt_supermercado FOREIGN KEY (id_supermercado) REFERENCES Supermercados(id_supermercado) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Cada fila es una "foto" del precio en una fecha. El historial vive aqui.
CREATE TABLE Precios (
  id_precio INT NOT NULL AUTO_INCREMENT,
  id_producto_tienda INT NOT NULL,
  precio_actual DECIMAL(10,2) NOT NULL,
  precio_oferta DECIMAL(10,2) NULL,
  precio_referencia DECIMAL(10,4) NULL,   -- precio por kg / litro para comparar formatos
  unidad_referencia VARCHAR(20) NULL,     -- kg, L, 100g, 100ml, ud
  es_precio_tarjeta TINYINT(1) NOT NULL DEFAULT 0,
  fecha_extraccion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_precio),
  KEY idx_precios_producto_tienda (id_producto_tienda),
  KEY idx_precios_fecha (fecha_extraccion),
  CONSTRAINT fk_precios_producto_tienda FOREIGN KEY (id_producto_tienda) REFERENCES ProductosTienda(id_producto_tienda) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------
-- Listas privadas del usuario (varias "libretas" por usuario)
-- ----------------------------------------------------------------------
CREATE TABLE ListasCabecera (
  cabecera_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  nombre VARCHAR(120) NOT NULL DEFAULT 'Mi lista',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (cabecera_id),
  KEY idx_listas_cabecera_user (user_id),
  CONSTRAINT fk_listas_cabecera_usuario FOREIGN KEY (user_id) REFERENCES Usuarios(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE ListasGuardadas (
  list_id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  cabecera_id INT NOT NULL,
  product_id INT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (list_id),
  UNIQUE KEY uk_cabecera_producto (cabecera_id, product_id),
  KEY idx_listas_user (user_id),
  KEY idx_listas_cabecera (cabecera_id),
  KEY idx_listas_producto (product_id),
  CONSTRAINT fk_listas_usuario FOREIGN KEY (user_id) REFERENCES Usuarios(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_listas_cabecera FOREIGN KEY (cabecera_id) REFERENCES ListasCabecera(cabecera_id) ON DELETE CASCADE,
  CONSTRAINT fk_listas_producto FOREIGN KEY (product_id) REFERENCES Productos(id_producto) ON DELETE CASCADE
) ENGINE=InnoDB;
