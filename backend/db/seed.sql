-- ======================================================================
-- List & Save - Datos iniciales (seed)
-- ----------------------------------------------------------------------
-- Ejecutar despues de schema.sql. Crea un usuario de prueba, los
-- supermercados activos, un catalogo basico y precios iniciales.
--
-- Usuario demo: admin@listandsave.com / Admin1234
-- ======================================================================

USE list_save;

-- Usuario administrador de prueba
INSERT INTO Usuarios (email, password, fullname) VALUES
  ('admin@listandsave.com', '$2a$10$UqstpS/F7CIIDwmppzqezOk5EW/Bu5bc6MdOKz7C0oMk2ok4EfWmS', 'Admin Test');

INSERT INTO AjustesUsuario (user_id, language) VALUES (1, 'es');

-- Lista vacia por defecto para el usuario admin
INSERT INTO ListasCabecera (user_id, nombre) VALUES (1, 'Mi lista');

-- Supermercados soportados. La columna `slug` debe coincidir con la
-- configuracion de backend/utils/supermarket-sources.js.
INSERT INTO Supermercados (nombre_supermercado, slug, logo, color_hex, activa) VALUES
  ('Mercadona', 'mercadona', 'assets/images/mercadona.svg', '#1f8f5f', 1),
  ('Carrefour', 'carrefour', 'assets/images/carrefour.svg', '#1f5eff', 1),
  ('Eroski',    'eroski',    'assets/images/eroski.svg',    '#e8000d', 1);

-- ----------------------------------------------------------------------
-- Catalogo base. Datos minimos pensados para arrancar la app, despues
-- el scraper/fetcher se encargara de mantenerlos actualizados.
-- ----------------------------------------------------------------------
INSERT INTO Productos
  (id_producto, nombre, marca, ean, imagen, descripcion, categoria, subcategoria,
   unidad_medida, cantidad_unidad, formato, alergenos, ingredientes, info_nutricional, origen, clave_comparable) VALUES
  (1, 'leche entera', 'Hacendado', '8480000000017', NULL,
   'Leche entera UHT en brik de 1 litro.', 'lacteos', 'leche',
   'l', 1.000, 'Brik 1L', 'lactosa', 'Leche entera de vaca.',
   '{"calorias":64,"grasas":3.6,"hidratos":4.8,"proteinas":3.2,"sal":0.1}', 'Espana',
   'leche-entera-uht-1l'),
  (2, 'pan de molde', 'Hacendado', '8480000000024', NULL,
   'Pan de molde blanco sin corteza, paquete de 500 g.', 'panaderia', 'pan-molde',
   'g', 500.000, '500 g', 'gluten,soja,sesamo', 'Harina de trigo, agua, levadura, sal.',
   '{"calorias":265,"grasas":3.5,"hidratos":48,"proteinas":9,"sal":1.1}', 'Espana',
   'pan-molde-blanco-500g'),
  (3, 'huevos talla M', 'Pazo de Vilane', '8480000000031', NULL,
   'Docena de huevos camperos talla M.', 'huevos', 'frescos',
   'ud', 12.000, 'Docena', 'huevo', 'Huevos camperos.',
   '{"calorias":155,"grasas":11,"hidratos":1.1,"proteinas":13,"sal":0.36}', 'Espana',
   'huevos-camperos-m-12ud'),
  (4, 'tomate pera', 'Frutas Eroski', '8480000000048', NULL,
   'Tomate pera al peso.', 'fruta-verdura', 'verduras',
   'kg', 1.000, '1 kg', NULL, NULL, NULL, 'Espana',
   'tomate-pera-1kg'),
  (5, 'cebolla', 'Campo Fresco', '8480000000055', NULL,
   'Cebolla blanca al peso.', 'fruta-verdura', 'verduras',
   'kg', 1.000, '1 kg', NULL, NULL, NULL, 'Espana',
   'cebolla-blanca-1kg'),
  (6, 'platano de Canarias', 'Coplaca', '8480000000062', NULL,
   'Platano de Canarias.', 'fruta-verdura', 'frutas',
   'kg', 1.000, '1 kg', NULL, NULL, NULL, 'Espana',
   'platano-canarias-1kg'),
  (7, 'yogur natural', 'Hacendado', '8480000000079', NULL,
   'Yogur natural pack 4 unidades.', 'lacteos', 'yogures',
   'g', 500.000, 'Pack 4 x 125 g', 'lactosa', NULL,
   '{"calorias":57,"grasas":3.2,"hidratos":4.5,"proteinas":3.5,"sal":0.1}', 'Espana',
   'yogur-natural-4x125g'),
  (8, 'pechuga de pollo', 'El Pozo', '8480000000086', NULL,
   'Pechuga de pollo fresca bandeja 600 g.', 'carnes', 'aves',
   'g', 600.000, 'Bandeja 600 g', NULL, NULL,
   '{"calorias":110,"grasas":2,"hidratos":0,"proteinas":23,"sal":0.1}', 'Espana',
   'pechuga-pollo-fresca-600g'),
  (9, 'agua mineral', 'Bezoya', '8480000000093', NULL,
   'Agua mineral natural pack 6 botellas de 1,5 L.', 'bebidas', 'aguas',
   'l', 9.000, 'Pack 6 x 1,5 L', NULL, NULL, NULL, 'Espana',
   'agua-mineral-6x15l'),
  (10, 'arroz redondo', 'La Fallera', '8480000000109', NULL,
   'Arroz redondo 1 kg, ideal paella.', 'arroces-pasta', 'arroces',
   'kg', 1.000, '1 kg', NULL, 'Arroz.',
   '{"calorias":350,"grasas":0.7,"hidratos":78,"proteinas":7,"sal":0}', 'Espana',
   'arroz-redondo-1kg'),
  (11, 'aceite oliva virgen extra', 'Carbonell', '8480000000116', NULL,
   'Aceite de oliva virgen extra botella 1 L.', 'aceites-vinagres', 'aceites',
   'l', 1.000, 'Botella 1L', NULL, 'Aceite de oliva virgen extra.',
   '{"calorias":900,"grasas":100,"hidratos":0,"proteinas":0,"sal":0}', 'Espana',
   'aceite-oliva-virgen-extra-1l'),
  (12, 'pasta espaguetis', 'Gallo', '8480000000123', NULL,
   'Espaguetis numero 3 paquete 500 g.', 'arroces-pasta', 'pasta',
   'g', 500.000, '500 g', 'gluten', 'Semola de trigo duro.',
   '{"calorias":360,"grasas":1.5,"hidratos":74,"proteinas":12,"sal":0}', 'Italia',
   'pasta-espaguetis-500g'),
  (13, 'papel higienico', 'Scottex', '8480000000130', NULL,
   'Papel higienico doble capa, paquete 12 rollos.', 'higiene', 'papel',
   'ud', 12.000, '12 rollos', NULL, NULL, NULL, NULL,
   'papel-higienico-2capas-12rollos'),
  (14, 'lavavajillas pastillas', 'Fairy', '8480000000147', NULL,
   'Pastillas para lavavajillas, paquete de 30 ud.', 'limpieza', 'lavavajillas',
   'ud', 30.000, '30 ud', NULL, NULL, NULL, NULL,
   'lavavajillas-pastillas-30ud'),
  (15, 'mantequilla', 'President', '8480000000154', NULL,
   'Mantequilla con sal, tableta 250 g.', 'lacteos', 'mantequillas',
   'g', 250.000, '250 g', 'lactosa', 'Crema de leche, sal.',
   '{"calorias":740,"grasas":82,"hidratos":0.6,"proteinas":0.7,"sal":1.2}', 'Francia',
   'mantequilla-con-sal-250g');

-- ----------------------------------------------------------------------
-- Asociacion producto-tienda. Los precios se versionan en la tabla Precios.
-- ----------------------------------------------------------------------
INSERT INTO ProductosTienda
  (id_producto_tienda, id_producto, id_supermercado, url_producto_externo, id_externo, disponible) VALUES
  -- Leche entera
  (1, 1, 1, 'https://tienda.mercadona.es/product/72',         '72',   1),
  (2, 1, 2, 'https://www.carrefour.es/leche-entera-1l',       NULL,   1),
  (3, 1, 3, 'https://supermercado.eroski.es/leche-entera-1l', NULL,   1),
  -- Pan de molde
  (4, 2, 1, 'https://tienda.mercadona.es/product/60',         '60',   1),
  (5, 2, 2, 'https://www.carrefour.es/pan-de-molde',          NULL,   1),
  -- Huevos
  (6, 3, 1, 'https://tienda.mercadona.es/product/77',         '77',   1),
  (7, 3, 3, 'https://supermercado.eroski.es/huevos-talla-m',  NULL,   1),
  -- Tomate
  (8, 4, 1, 'https://tienda.mercadona.es/product/120',        '120',  1),
  (9, 4, 2, 'https://www.carrefour.es/tomate-pera',           NULL,   1),
  (10, 4, 3, 'https://supermercado.eroski.es/tomate-pera',    NULL,   1),
  -- Cebolla
  (11, 5, 1, 'https://tienda.mercadona.es/product/121',       '121',  1),
  (12, 5, 2, 'https://www.carrefour.es/cebolla',              NULL,   1),
  -- Platano
  (13, 6, 1, 'https://tienda.mercadona.es/product/122',       '122',  1),
  (14, 6, 3, 'https://supermercado.eroski.es/platano',        NULL,   1),
  -- Yogur natural
  (15, 7, 1, 'https://tienda.mercadona.es/product/104',       '104',  1),
  (16, 7, 2, 'https://www.carrefour.es/yogur-natural',        NULL,   1),
  -- Pollo
  (17, 8, 1, 'https://tienda.mercadona.es/product/200',       '200',  1),
  (18, 8, 2, 'https://www.carrefour.es/pechuga-pollo',        NULL,   1),
  -- Agua
  (19, 9, 1, 'https://tienda.mercadona.es/product/156',       '156',  1),
  (20, 9, 2, 'https://www.carrefour.es/agua-bezoya',          NULL,   1),
  (21, 9, 3, 'https://supermercado.eroski.es/agua-bezoya',    NULL,   1),
  -- Arroz
  (22, 10, 1, 'https://tienda.mercadona.es/product/118',      '118',  1),
  (23, 10, 2, 'https://www.carrefour.es/arroz-redondo',       NULL,   1),
  -- Aceite
  (24, 11, 1, 'https://tienda.mercadona.es/product/112',      '112',  1),
  (25, 11, 2, 'https://www.carrefour.es/aceite-oliva-1l',     NULL,   1),
  (26, 11, 3, 'https://supermercado.eroski.es/aceite-oliva',  NULL,   1),
  -- Pasta
  (27, 12, 1, 'https://tienda.mercadona.es/product/130',      '130',  1),
  (28, 12, 2, 'https://www.carrefour.es/espaguetis',          NULL,   1),
  -- Papel higienico
  (29, 13, 1, 'https://tienda.mercadona.es/product/300',      '300',  1),
  (30, 13, 2, 'https://www.carrefour.es/papel-higienico',     NULL,   1),
  -- Lavavajillas
  (31, 14, 1, 'https://tienda.mercadona.es/product/310',      '310',  1),
  (32, 14, 2, 'https://www.carrefour.es/lavavajillas',        NULL,   1),
  -- Mantequilla
  (33, 15, 1, 'https://tienda.mercadona.es/product/115',      '115',  1),
  (34, 15, 3, 'https://supermercado.eroski.es/mantequilla',   NULL,   1);

-- ----------------------------------------------------------------------
-- Precios iniciales. Una sola "foto" actual; el sync se encarga del histo.
-- ----------------------------------------------------------------------
INSERT INTO Precios
  (id_producto_tienda, precio_actual, precio_oferta, precio_referencia, unidad_referencia, es_precio_tarjeta) VALUES
  -- Leche
  (1, 0.95, NULL, 0.9500, 'L', 0),
  (2, 1.10, NULL, 1.1000, 'L', 0),
  (3, 1.05, NULL, 1.0500, 'L', 0),
  -- Pan
  (4, 1.30, NULL, 2.6000, 'kg', 0),
  (5, 1.45, NULL, 2.9000, 'kg', 0),
  -- Huevos
  (6, 2.35, NULL, 0.1958, 'ud', 0),
  (7, 2.49, 2.29, 0.2075, 'ud', 0),
  -- Tomate
  (8, 1.85, NULL, 1.8500, 'kg', 0),
  (9, 1.99, NULL, 1.9900, 'kg', 0),
  (10, 2.10, 1.89, 2.1000, 'kg', 0),
  -- Cebolla
  (11, 0.99, NULL, 0.9900, 'kg', 0),
  (12, 1.15, NULL, 1.1500, 'kg', 0),
  -- Platano
  (13, 1.75, NULL, 1.7500, 'kg', 0),
  (14, 1.89, NULL, 1.8900, 'kg', 0),
  -- Yogur
  (15, 1.25, NULL, 2.5000, 'kg', 0),
  (16, 1.45, 1.29, 2.9000, 'kg', 0),
  -- Pollo
  (17, 4.99, NULL, 8.3167, 'kg', 0),
  (18, 5.29, NULL, 8.8167, 'kg', 0),
  -- Agua
  (19, 1.95, NULL, 0.2167, 'L', 0),
  (20, 2.10, NULL, 0.2333, 'L', 0),
  (21, 2.05, NULL, 0.2278, 'L', 0),
  -- Arroz
  (22, 1.45, NULL, 1.4500, 'kg', 0),
  (23, 1.69, NULL, 1.6900, 'kg', 0),
  -- Aceite
  (24, 8.99, NULL, 8.9900, 'L', 0),
  (25, 9.49, 8.99, 9.4900, 'L', 0),
  (26, 9.25, NULL, 9.2500, 'L', 0),
  -- Pasta
  (27, 0.95, NULL, 1.9000, 'kg', 0),
  (28, 1.15, NULL, 2.3000, 'kg', 0),
  -- Papel higienico
  (29, 5.45, NULL, 0.4542, 'ud', 0),
  (30, 6.10, 5.49, 0.5083, 'ud', 0),
  -- Lavavajillas
  (31, 7.95, NULL, 0.2650, 'ud', 0),
  (32, 8.49, NULL, 0.2830, 'ud', 0),
  -- Mantequilla
  (33, 2.85, NULL, 11.4000, 'kg', 0),
  (34, 3.10, NULL, 12.4000, 'kg', 0);
