require("dotenv").config({ path: require("path").join(__dirname, "..", "..", ".env") });
const { consultaDatos } = require("../config/db");

var SUPERMERCADOS = { mercadona: 1, carrefour: 2, eroski: 3 };
var CARREFOUR_FACTOR = 1.05;
var EROSKI_FACTOR = 1.02;

var PRODUCTOS_BASE = [
  { nombre: "leche entera", marca: "Hacendado", ean: "8480000001001", categoria: "lacteos", subcategoria: "leche", unidad: "l", cantidad: 1, formato: "Brik 1L", alergenos: "lactosa", ingredientes: "Leche entera de vaca", nutricion: {calorias:64,grasas:3.6,hidratos:4.8,proteinas:3.2,sal:0.1}, origen: "Espana", clave: "leche-entera-uht-1l", mercadona: 0.95, carrefour: null, eroski: null },
  { nombre: "leche semidesnatada", marca: "Hacendado", ean: "8480000001002", categoria: "lacteos", subcategoria: "leche", unidad: "l", cantidad: 1, formato: "Brik 1L", alergenos: "lactosa", ingredientes: "Leche semidesnatada", nutricion: {calorias:46,grasas:1.8,hidratos:5,proteinas:3.3,sal:0.12}, origen: "Espana", clave: "leche-semidesnatada-1l", mercadona: 0.89 },
  { nombre: "yogur natural", marca: "Hacendado", ean: "8480000001003", categoria: "lacteos", subcategoria: "yogures", unidad: "g", cantidad: 500, formato: "Pack 4 x 125 g", alergenos: "lactosa", ingredientes: null, nutricion: {calorias:57,grasas:3.2,hidratos:4.5,proteinas:3.5,sal:0.1}, origen: "Espana", clave: "yogur-natural-4x125g", mercadona: 1.25, carrefour: null, eroski: null },
  { nombre: "yogur natural", marca: "Carrefour", ean: "8480000001004", categoria: "lacteos", subcategoria: "yogures", unidad: "g", cantidad: 500, formato: "Pack 4 x 125 g", alergenos: "lactosa", ingredientes: null, nutricion: {calorias:57,grasas:3.2,hidratos:4.5,proteinas:3.5,sal:0.1}, origen: "Espana", clave: "yogur-natural-4x125g", carrefour: 1.45 },
  { nombre: "mantequilla con sal", marca: "President", ean: "8480000001005", categoria: "lacteos", subcategoria: "mantequillas", unidad: "g", cantidad: 250, formato: "250 g", alergenos: "lactosa", ingredientes: "Crema de leche, sal", nutricion: {calorias:740,grasas:82,hidratos:0.6,proteinas:0.7,sal:1.2}, origen: "Francia", clave: "mantequilla-con-sal-250g", mercadona: 2.85, carrefour: null, eroski: 3.10 },
  { nombre: "queso semicurado", marca: "Hacendado", ean: "8480000001006", categoria: "lacteos", subcategoria: "quesos", unidad: "g", cantidad: 300, formato: "Pieza 300 g", alergenos: "lactosa", ingredientes: "Leche de oveja, cuajo, sal", nutricion: {calorias:350,grasas:26,hidratos:1,proteinas:22,sal:1.5}, origen: "Espana", clave: "queso-semicurado-oveja-300g", mercadona: 3.45 },
  { nombre: "pan de molde blanco", marca: "Hacendado", ean: "8480000002001", categoria: "panaderia", subcategoria: "pan-molde", unidad: "g", cantidad: 500, formato: "500 g", alergenos: "gluten,soja,sesamo", ingredientes: "Harina de trigo, agua, levadura, sal", nutricion: {calorias:265,grasas:3.5,hidratos:48,proteinas:9,sal:1.1}, origen: "Espana", clave: "pan-molde-blanco-500g", mercadona: 1.30, carrefour: null },
  { nombre: "pan de molde blanco", marca: "Carrefour", ean: "8480000002002", categoria: "panaderia", subcategoria: "pan-molde", unidad: "g", cantidad: 500, formato: "500 g", alergenos: "gluten,soja", ingredientes: "Harina de trigo, agua, levadura, sal", nutricion: {calorias:265,grasas:3.5,hidratos:48,proteinas:9,sal:1.1}, origen: "Espana", clave: "pan-molde-blanco-500g", carrefour: 1.45 },
  { nombre: "galletas maria", marca: "Maria", ean: "8480000002003", categoria: "panaderia", subcategoria: "galletas", unidad: "g", cantidad: 800, formato: "800 g", alergenos: "gluten,traza_leche", ingredientes: "Harina de trigo, azucar, aceite de girasol", nutricion: {calorias:430,grasas:12,hidratos:72,proteinas:7,sal:0.8}, origen: "Espana", clave: "galletas-maria-800g", mercadona: 1.49, carrefour: null, eroski: null },
  { nombre: "croissant", marca: "Hacendado", ean: "8480000002004", categoria: "panaderia", subcategoria: "bolleria", unidad: "ud", cantidad: 4, formato: "Pack 4 ud", alergenos: "gluten,lactosa,huevo", ingredientes: "Harina de trigo, mantequilla, huevo, azucar", nutricion: {calorias:410,grasas:22,hidratos:46,proteinas:7,sal:1.1}, origen: "Espana", clave: "croissant-pack-4ud", mercadona: 1.89 },
  { nombre: "huevos talla M", marca: "Pazo de Vilane", ean: "8480000003001", categoria: "huevos", subcategoria: "frescos", unidad: "ud", cantidad: 12, formato: "Docena", alergenos: "huevo", ingredientes: "Huevos camperos", nutricion: {calorias:155,grasas:11,hidratos:1.1,proteinas:13,sal:0.36}, origen: "Espana", clave: "huevos-camperos-m-12ud", mercadona: 2.35, carrefour: null, eroski: 2.49 },
  { nombre: "tomate pera", marca: "Frutas Eroski", ean: "8480000004001", categoria: "fruta-verdura", subcategoria: "verduras", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, ingredientes: null, nutricion: null, origen: "Espana", clave: "tomate-pera-1kg", mercadona: 1.85, carrefour: 1.99, eroski: 2.10 },
  { nombre: "cebolla", marca: "Campo Fresco", ean: "8480000004002", categoria: "fruta-verdura", subcategoria: "verduras", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, ingredientes: null, nutricion: null, origen: "Espana", clave: "cebolla-blanca-1kg", mercadona: 0.99, carrefour: 1.15 },
  { nombre: "platano de Canarias", marca: "Coplaca", ean: "8480000004003", categoria: "fruta-verdura", subcategoria: "frutas", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, ingredientes: null, nutricion: null, origen: "Espana", clave: "platano-canarias-1kg", mercadona: 1.75, eroski: 1.89 },
  { nombre: "patata", marca: "Hacendado", ean: "8480000004004", categoria: "fruta-verdura", subcategoria: "verduras", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, ingredientes: null, nutricion: {calorias:77,grasas:0.1,hidratos:17,proteinas:2,sal:0.01}, origen: "Espana", clave: "patata-1kg", mercadona: 1.19, carrefour: 1.29 },
  { nombre: "lechuga", marca: "Campo Fresco", ean: "8480000004005", categoria: "fruta-verdura", subcategoria: "verduras", unidad: "ud", cantidad: 1, formato: "1 ud", alergenos: null, ingredientes: null, nutricion: null, origen: "Espana", clave: "lechuga-1ud", mercadona: 0.89, eroski: 0.99 },
  { nombre: "zanahoria", marca: "Campo Fresco", ean: "8480000004006", categoria: "fruta-verdura", subcategoria: "verduras", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, ingredientes: null, nutricion: null, origen: "Espana", clave: "zanahoria-1kg", mercadona: 0.99, carrefour: 1.15 },
  { nombre: "pechuga de pollo", marca: "El Pozo", ean: "8480000005001", categoria: "carnes", subcategoria: "aves", unidad: "g", cantidad: 600, formato: "Bandeja 600 g", alergenos: null, ingredientes: null, nutricion: {calorias:110,grasas:2,hidratos:0,proteinas:23,sal:0.1}, origen: "Espana", clave: "pechuga-pollo-fresca-600g", mercadona: 4.99, carrefour: 5.29 },
  { nombre: "lomo de cerdo", marca: "El Pozo", ean: "8480000005002", categoria: "carnes", subcategoria: "cerdo", unidad: "g", cantidad: 400, formato: "Bandeja 400 g", alergenos: null, ingredientes: null, nutricion: {calorias:143,grasas:5,hidratos:0,proteinas:22,sal:0.3}, origen: "Espana", clave: "lomo-cerdo-400g", mercadona: 3.89, carrefour: null, eroski: 4.15 },
  { nombre: "jamon serrano", marca: "Hacendado", ean: "8480000005003", categoria: "carnes", subcategoria: "embutido", unidad: "g", cantidad: 150, formato: "Pack 150 g", alergenos: null, ingredientes: "Jamon de cerdo, sal", nutricion: {calorias:200,grasas:10,hidratos:0.5,proteinas:28,sal:2.5}, origen: "Espana", clave: "jamon-serrano-150g", mercadona: 2.49, eroski: 2.65 },
  { nombre: "agua mineral", marca: "Bezoya", ean: "8480000006001", categoria: "bebidas", subcategoria: "aguas", unidad: "l", cantidad: 9, formato: "Pack 6 x 1,5 L", alergenos: null, ingredientes: null, nutricion: null, origen: "Espana", clave: "agua-mineral-6x15l", mercadona: 1.95, carrefour: 2.10, eroski: 2.05 },
  { nombre: "cerveza lager", marca: "Estrella Levante", ean: "8480000006002", categoria: "bebidas", subcategoria: "cerveza", unidad: "l", cantidad: 3, formato: "Pack 6 x 500 ml", alergenos: "gluten", ingredientes: "Agua, malta de cebada, lupulo", nutricion: {calorias:43,grasas:0,hidratos:3.4,proteinas:0.4,sal:0}, origen: "Espana", clave: "cerveza-lager-6x500ml", mercadona: 2.69, carrefour: null },
  { nombre: "zumo de naranja", marca: "Hacendado", ean: "8480000006003", categoria: "bebidas", subcategoria: "zumos", unidad: "l", cantidad: 1, formato: "Brik 1L", alergenos: null, ingredientes: "Zumo de naranja concentrado", nutricion: {calorias:45,grasas:0.1,hidratos:10,proteinas:0.7,sal:0}, origen: "Espana", clave: "zumo-naranja-1l", mercadona: 1.05, carrefour: 1.19, eroski: 1.15 },
  { nombre: "refresco cola", marca: "Coca-Cola", ean: "8480000006004", categoria: "bebidas", subcategoria: "refrescos", unidad: "l", cantidad: 2, formato: "Pack 2 x 1L", alergenos: null, ingredientes: "Agua, azucar, colorante, acidulantes, cafeina", nutricion: {calorias:42,grasas:0,hidratos:10.6,proteinas:0,sal:0}, origen: "Espana", clave: "cola-2x1l", mercadona: 2.75, carrefour: null, eroski: null },
  { nombre: "arroz redondo", marca: "La Fallera", ean: "8480000007001", categoria: "arroces-pasta", subcategoria: "arroces", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, ingredientes: "Arroz", nutricion: {calorias:350,grasas:0.7,hidratos:78,proteinas:7,sal:0}, origen: "Espana", clave: "arroz-redondo-1kg", mercadona: 1.45, carrefour: 1.69 },
  { nombre: "pasta espaguetis", marca: "Gallo", ean: "8480000007002", categoria: "arroces-pasta", subcategoria: "pasta", unidad: "g", cantidad: 500, formato: "500 g", alergenos: "gluten", ingredientes: "Semola de trigo duro", nutricion: {calorias:360,grasas:1.5,hidratos:74,proteinas:12,sal:0}, origen: "Italia", clave: "pasta-espaguetis-500g", mercadona: 0.95, carrefour: 1.15 },
  { nombre: "lentejas", marca: "Hacendado", ean: "8480000007003", categoria: "arroces-pasta", subcategoria: "legumbres", unidad: "g", cantidad: 500, formato: "500 g", alergenos: null, ingredientes: "Lenteja pardina", nutricion: {calorias:340,grasas:1,hidratos:52,proteinas:24,sal:0.02}, origen: "Espana", clave: "lentejas-pardina-500g", mercadona: 1.19, carrefour: null, eroski: 1.35 },
  { nombre: "aceite oliva virgen extra", marca: "Carbonell", ean: "8480000008001", categoria: "aceites-vinagres", subcategoria: "aceites", unidad: "l", cantidad: 1, formato: "Botella 1L", alergenos: null, ingredientes: "Aceite de oliva virgen extra", nutricion: {calorias:900,grasas:100,hidratos:0,proteinas:0,sal:0}, origen: "Espana", clave: "aceite-oliva-virgen-extra-1l", mercadona: 8.99, carrefour: 9.49, eroski: 9.25 },
  { nombre: "vinagre de manzana", marca: "Hacendado", ean: "8480000008002", categoria: "aceites-vinagres", subcategoria: "vinagres", unidad: "l", cantidad: 1, formato: "Botella 1L", alergenos: null, ingredientes: "Vinagre de manzana", nutricion: null, origen: "Espana", clave: "vinagre-manzana-1l", mercadona: 1.19 },
  { nombre: "sal gorda", marca: "Hacendado", ean: "8480000008003", categoria: "aceites-vinagres", subcategoria: "sal", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, ingredientes: "Sal marina gruesa", nutricion: null, origen: "Espana", clave: "sal-gorda-1kg", mercadona: 0.65, eroski: 0.75 },
  { nombre: "papel higienico", marca: "Scottex", ean: "8480000009001", categoria: "higiene", subcategoria: "papel", unidad: "ud", cantidad: 12, formato: "12 rollos", alergenos: null, ingredientes: null, nutricion: null, origen: null, clave: "papel-higienico-2capas-12rollos", mercadona: 5.45, carrefour: 6.10 },
  { nombre: "champu", marca: "Hacendado", ean: "8480000009002", categoria: "higiene", subcategoria: "cabello", unidad: "ml", cantidad: 400, formato: "400 ml", alergenos: null, ingredientes: "Agua, tensioactivos, perfume", nutricion: null, origen: "Espana", clave: "champu-400ml", mercadona: 1.85, eroski: 2.05 },
  { nombre: "gel de ducha", marca: "Hacendado", ean: "8480000009003", categoria: "higiene", subcategoria: "corporal", unidad: "ml", cantidad: 750, formato: "750 ml", alergenos: null, ingredientes: "Agua, tensioactivos, perfume", nutricion: null, origen: "Espana", clave: "gel-ducha-750ml", mercadona: 1.49, carrefour: 1.65 },
  { nombre: "pasta de dientes", marca: "Colgate", ean: "8480000009004", categoria: "higiene", subcategoria: "bucal", unidad: "ml", cantidad: 75, formato: "75 ml", alergenos: null, ingredientes: "Fluoruro de sodio, silice, sorbitol", nutricion: null, origen: null, clave: "pasta-dientes-75ml", mercadona: 1.35, carrefour: null, eroski: 1.45 },
  { nombre: "lavavajillas pastillas", marca: "Fairy", ean: "8480000010001", categoria: "limpieza", subcategoria: "lavavajillas", unidad: "ud", cantidad: 30, formato: "30 ud", alergenos: null, ingredientes: null, nutricion: null, origen: null, clave: "lavavajillas-pastillas-30ud", mercadona: 7.95, carrefour: 8.49 },
  { nombre: "detergente liquido", marca: "Wipp", ean: "8480000010002", categoria: "limpieza", subcategoria: "detergente", unidad: "l", cantidad: 2, formato: "2L", alergenos: null, ingredientes: "Tensioactivos, enzimas, perfume", nutricion: null, origen: null, clave: "detergente-liquido-2l", mercadona: 3.99, eroski: 4.25 },
  { nombre: "lejia", marca: "Hacendado", ean: "8480000010003", categoria: "limpieza", subcategoria: "lejia", unidad: "l", cantidad: 2, formato: "2L", alergenos: null, ingredientes: "Hipoclorito de sodio", nutricion: null, origen: "Espana", clave: "lejia-2l", mercadona: 0.79, carrefour: 0.95 },
  { nombre: "fregasuelos", marca: "Hacendado", ean: "8480000010004", categoria: "limpieza", subcategoria: "suelos", unidad: "l", cantidad: 1, formato: "1L", alergenos: null, ingredientes: "Tensioactivos, perfume", nutricion: null, origen: "Espana", clave: "fregasuelos-1l", mercadona: 1.39 },
  { nombre: "atun en aceite", marca: "Hacendado", ean: "8480000011001", categoria: "conservas", subcategoria: "pescado", unidad: "g", cantidad: 150, formato: "3 latas x 50 g", alergenos: "pescado", ingredientes: "Atun, aceite de girasol, sal", nutricion: {calorias:190,grasas:8,hidratos:0,proteinas:27,sal:0.8}, origen: null, clave: "atun-aceite-3x50g", mercadona: 2.49, carrefour: 2.75, eroski: 2.59 },
  { nombre: "tomate frito", marca: "Hacendado", ean: "8480000011002", categoria: "conservas", subcategoria: "tomate", unidad: "g", cantidad: 380, formato: "Brik 380 g", alergenos: null, ingredientes: "Tomate, aceite de oliva, azucar, sal", nutricion: {calorias:56,grasas:2.5,hidratos:7,proteinas:1.5,sal:0.8}, origen: "Espana", clave: "tomate-frito-380g", mercadona: 0.79 },
  { nombre: "pizza congelada", marca: "Hacendado", ean: "8480000012001", categoria: "congelados", subcategoria: "pizza", unidad: "g", cantidad: 345, formato: "345 g", alergenos: "gluten,lactosa", ingredientes: "Masa, tomate, queso mozzarella", nutricion: {calorias:250,grasas:10,hidratos:30,proteinas:12,sal:1.3}, origen: "Espana", clave: "pizza-congelada-345g", mercadona: 2.19, carrefour: 2.45 },
  { nombre: "helado vainilla", marca: "Hacendado", ean: "8480000012002", categoria: "congelados", subcategoria: "helados", unidad: "ml", cantidad: 750, formato: "750 ml", alergenos: "lactosa", ingredientes: "Leche, nata, azucar, vainilla", nutricion: {calorias:180,grasas:9,hidratos:22,proteinas:3,sal:0.1}, origen: "Espana", clave: "helado-vainilla-750ml", mercadona: 2.99, eroski: 3.25 },
  { nombre: "aceitunas verdes", marca: "Hacendado", ean: "8480000013001", categoria: "encurtidos", subcategoria: "aceitunas", unidad: "g", cantidad: 300, formato: "Frasco 300 g", alergenos: null, ingredientes: "Aceitunas, agua, sal", nutricion: {calorias:120,grasas:10,hidratos:2,proteinas:0.8,sal:2.5}, origen: "Espana", clave: "aceitunas-verdes-300g", mercadona: 1.29, carrefour: null },
  { nombre: "azucar", marca: "Hacendado", ean: "8480000014001", categoria: "desayuno", subcategoria: "azucar", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, ingredientes: "Azucar de cana", nutricion: {calorias:400,grasas:0,hidratos:100,proteinas:0,sal:0}, origen: null, clave: "azucar-1kg", mercadona: 0.89, carrefour: 0.99 },
  { nombre: "cafe molido", marca: "Hacendado", ean: "8480000014002", categoria: "desayuno", subcategoria: "cafe", unidad: "g", cantidad: 250, formato: "250 g", alergenos: null, ingredientes: "Cafe molido torrefacto", nutricion: {calorias:0,grasas:0,hidratos:0,proteinas:0,sal:0}, origen: null, clave: "cafe-molido-250g", mercadona: 1.69, carrefour: null, eroski: 1.89 },
  { nombre: "cereales", marca: "Hacendado", ean: "8480000014003", categoria: "desayuno", subcategoria: "cereales", unidad: "g", cantidad: 375, formato: "375 g", alergenos: "gluten", ingredientes: "Cereales, azucar, malta", nutricion: {calorias:370,grasas:2,hidratos:84,proteinas:7,sal:0.6}, origen: null, clave: "cereales-375g", mercadona: 1.85 },
  { nombre: "mermelada fresa", marca: "Hacendado", ean: "8480000014004", categoria: "desayuno", subcategoria: "mermelada", unidad: "g", cantidad: 340, formato: "Frasco 340 g", alergenos: null, ingredientes: "Fresa, azucar, pectina", nutricion: {calorias:260,grasas:0,hidratos:64,proteinas:0.4,sal:0}, origen: "Espana", clave: "mermelada-fresa-340g", mercadona: 1.49, carrefour: 1.69 },
  { nombre: "naranja", marca: "Hacendado", ean: "8480000015001", categoria: "fruta-verdura", subcategoria: "frutas", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, ingredientes: null, nutricion: null, origen: "Espana", clave: "naranja-valencia-1kg", mercadona: 1.49, carrefour: 1.59 },
  { nombre: "manzana golden", marca: "Hacendado", ean: "8480000015002", categoria: "fruta-verdura", subcategoria: "frutas", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, ingredientes: null, nutricion: null, origen: "Espana", clave: "manzana-golden-1kg", mercadona: 1.69, eroski: 1.79 },
  { nombre: "pimiento rojo", marca: "Campo Fresco", ean: "8480000015003", categoria: "fruta-verdura", subcategoria: "verduras", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, ingredientes: null, nutricion: null, origen: "Espana", clave: "pimiento-rojo-1kg", mercadona: 2.49, carrefour: 2.69 },
  { nombre: "ajo", marca: "Hacendado", ean: "8480000015004", categoria: "fruta-verdura", subcategoria: "verduras", unidad: "ud", cantidad: 2, formato: "2 cabezas", alergenos: null, ingredientes: null, nutricion: null, origen: "Espana", clave: "ajo-2cabezas", mercadona: 0.79 },
  { nombre: "filete de salmon", marca: "Hacendado", ean: "8480000016001", categoria: "carnes", subcategoria: "pescado", unidad: "g", cantidad: 200, formato: "2 filetes 200 g", alergenos: "pescado", ingredientes: "Salmon atlantico", nutricion: {calorias:208,grasas:13,hidratos:0,proteinas:20,sal:0.05}, origen: "Noruega", clave: "salmon-filete-200g", mercadona: 4.99, eroski: 5.29 },
  { nombre: "desodorante roll-on", marca: "Hacendado", ean: "8480000017001", categoria: "higiene", subcategoria: "desodorante", unidad: "ml", cantidad: 50, formato: "50 ml", alergenos: null, ingredientes: "Aluminio, alcohol, perfume", nutricion: null, origen: null, clave: "desodorante-rollon-50ml", mercadona: 1.19, eroski: 1.35 },
  { nombre: "papel cocina", marca: "Scottex", ean: "8480000018001", categoria: "higiene", subcategoria: "papel", unidad: "ud", cantidad: 3, formato: "3 rollos", alergenos: null, ingredientes: null, nutricion: null, origen: null, clave: "papel-cocina-3rollos", mercadona: 1.95, carrefour: 2.15 },
  { nombre: "pañales talla 4", marca: "Dodot", ean: "8480000019001", categoria: "bebe", subcategoria: "pañales", unidad: "ud", cantidad: 50, formato: "50 ud", alergenos: null, ingredientes: null, nutricion: null, origen: null, clave: "panales-talla4-50ud", mercadona: 12.99, carrefour: 13.99 },
  { nombre: "pienso gatos", marca: "Whiskas", ean: "8480000020001", categoria: "mascota", subcategoria: "gatos", unidad: "kg", cantidad: 1.2, formato: "1.2 kg", alergenos: null, ingredientes: "Cereales, carne, subproductos", nutricion: null, origen: null, clave: "pienso-gatos-12kg", mercadona: 3.49, eroski: 3.79 },
  { nombre: "salmon ahumado", marca: "Hacendado", ean: "8480000016002", categoria: "carnes", subcategoria: "pescado", unidad: "g", cantidad: 100, formato: "100 g", alergenos: "pescado", ingredientes: "Salmon, sal, humo", nutricion: {calorias:200,grasas:12,hidratos:0,proteinas:22,sal:2.5}, origen: "Noruega", clave: "salmon-ahumado-100g", mercadona: 3.99 },
  { nombre: "garbanzos cocidos", marca: "Hacendado", ean: "8480000007004", categoria: "arroces-pasta", subcategoria: "legumbres", unidad: "g", cantidad: 400, formato: "Bote 400 g", alergenos: null, ingredientes: "Garbanzos, agua, sal", nutricion: {calorias:120,grasas:2,hidratos:18,proteinas:7,sal:0.5}, origen: "Espana", clave: "garbanzos-cocidos-400g", mercadona: 0.65, carrefour: 0.75, eroski: 0.69 },
  { nombre: "pizza congelada", marca: "Carrefour", ean: "8480000012003", categoria: "congelados", subcategoria: "pizza", unidad: "g", cantidad: 390, formato: "390 g", alergenos: "gluten,lactosa", ingredientes: "Masa, tomate, mozzarella", nutricion: {calorias:240,grasas:9,hidratos:29,proteinas:11,sal:1.2}, origen: "Espana", clave: "pizza-congelada-carrefour-390g", carrefour: 2.45 },
  { nombre: "jamon cocido", marca: "Hacendado", ean: "8480000005004", categoria: "carnes", subcategoria: "embutido", unidad: "g", cantidad: 150, formato: "Pack 150 g", alergenos: null, ingredientes: "Jamon de cerdo, almidon, sal", nutricion: {calorias:100,grasas:2,hidratos:2.5,proteinas:18,sal:1.8}, origen: "Espana", clave: "jamon-cocido-150g", mercadona: 1.49 },
];

async function main() {
  console.log("[seed:synthetic] Starting catalog generation...");
  var insertedProducts = 0;
  var insertedPrices = 0;

  for (var i = 0; i < PRODUCTOS_BASE.length; i++) {
    var p = PRODUCTOS_BASE[i];
    var existing = await consultaDatos(
      "SELECT id_producto FROM Productos WHERE clave_comparable = ? LIMIT 1",
      [p.clave]
    );
    var idProd;
    if (existing.length > 0) {
      idProd = existing[0].id_producto;
    } else {
      var ins = await consultaDatos(
        "INSERT IGNORE INTO Productos (nombre, marca, ean, imagen, descripcion, categoria, subcategoria, unidad_medida, cantidad_unidad, formato, alergenos, ingredientes, info_nutricional, origen, clave_comparable) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [p.nombre, p.marca, p.ean, p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1) + ".", p.categoria, p.subcategoria, p.unidad, p.cantidad, p.formato, p.alergenos, p.ingredientes, p.nutricion ? JSON.stringify(p.nutricion) : null, p.origen, p.clave]
      );
      if (ins.affectedRows > 0) {
        idProd = ins.insertId;
      } else {
        var dup = await consultaDatos("SELECT id_producto FROM Productos WHERE clave_comparable = ? LIMIT 1", [p.clave]);
        idProd = dup[0].id_producto;
      }
      insertedProducts++;
    }

    var supermercados = [];
    if (p.mercadona !== undefined && p.mercadona !== null) supermercados.push({ slug: "mercadona", precio: p.mercadona });
    if (p.carrefour !== undefined && p.carrefour !== null) supermercados.push({ slug: "carrefour", precio: p.carrefour });
    if (p.eroski !== undefined && p.eroski !== null) supermercados.push({ slug: "eroski", precio: p.eroski });

    for (var j = 0; j < supermercados.length; j++) {
      var sup = supermercados[j];
      var supRows = await consultaDatos("SELECT id_supermercado FROM Supermercados WHERE slug = ? LIMIT 1", [sup.slug]);
      if (!supRows.length) {
        console.warn("[seed:synthetic] No supermarket for slug=", sup.slug);
        continue;
      }
      var idSuper = supRows[0].id_supermercado;
      var ptRows = await consultaDatos("SELECT id_producto_tienda FROM ProductosTienda WHERE id_producto = ? AND id_supermercado = ? LIMIT 1", [idProd, idSuper]);
      var idPt;
      if (ptRows.length > 0) {
        idPt = ptRows[0].id_producto_tienda;
      } else {
        var ptIns = await consultaDatos(
          "INSERT INTO ProductosTienda (id_producto, id_supermercado, id_externo, disponible) VALUES (?, ?, ?, 1)",
          [idProd, idSuper, "syn-" + p.clave + "-" + sup.slug]
        );
        idPt = ptIns.insertId;
      }

      var precioRef = null;
      var unidadRef = null;
      if (p.unidad === "kg" || p.unidad === "l") {
        precioRef = sup.precio;
        unidadRef = p.unidad;
      } else if (p.unidad === "g") {
        precioRef = +(sup.precio / p.cantidad * 1000).toFixed(4);
        unidadRef = "kg";
      } else if (p.unidad === "ml") {
        precioRef = +(sup.precio / p.cantidad * 1000).toFixed(4);
        unidadRef = "L";
      } else if (p.unidad === "ud") {
        precioRef = +(sup.precio / p.cantidad).toFixed(4);
        unidadRef = "ud";
      }

      await consultaDatos(
        "INSERT INTO Precios (id_producto_tienda, precio_actual, precio_oferta, precio_referencia, unidad_referencia, es_precio_tarjeta, fecha_extraccion) VALUES (?, ?, NULL, ?, ?, 0, NOW())",
        [idPt, sup.precio, precioRef, unidadRef]
      );
      insertedPrices++;
    }
  }

  var syntheticProducts = [
    { nombre: "leche desnatada", marca: "Carrefour", categoria: "lacteos", subcategoria: "leche", unidad: "l", cantidad: 1, formato: "Brik 1L", alergenos: "lactosa", clave: "leche-desnatada-1l", precioBase: 0.85 },
    { nombre: "leche entera", marca: "Eroski", categoria: "lacteos", subcategoria: "leche", unidad: "l", cantidad: 1, formato: "Brik 1L", alergenos: "lactosa", clave: "leche-entera-eroski-1l", precioBase: 1.05 },
    { nombre: "yogur frutas", marca: "Carrefour", categoria: "lacteos", subcategoria: "yogures", unidad: "g", cantidad: 540, formato: "Pack 6 x 90 g", alergenos: "lactosa", clave: "yogur-frutas-6x90g", precioBase: 1.89 },
    { nombre: "yogur frutas", marca: "Eroski", categoria: "lacteos", subcategoria: "yogures", unidad: "g", cantidad: 540, formato: "Pack 6 x 90 g", alergenos: "lactosa", clave: "yogur-frutas-eroski-6x90g", precioBase: 2.10 },
    { nombre: "queso fresco", marca: "Carrefour", categoria: "lacteos", subcategoria: "quesos", unidad: "g", cantidad: 200, formato: "200 g", alergenos: "lactosa", clave: "queso-fresco-200g", precioBase: 1.79 },
    { nombre: "natilla vainilla", marca: "Eroski", categoria: "lacteos", subcategoria: "postres", unidad: "g", cantidad: 500, formato: "Pack 4 x 125 g", alergenos: "lactosa,huevo", clave: "natilla-vainilla-4x125g", precioBase: 1.65 },
    { nombre: "pan de molde integral", marca: "Carrefour", categoria: "panaderia", subcategoria: "pan-molde", unidad: "g", cantidad: 600, formato: "600 g", alergenos: "gluten", clave: "pan-molde-integral-600g", precioBase: 1.69 },
    { nombre: "pan de molde sin corteza", marca: "Eroski", categoria: "panaderia", subcategoria: "pan-molde", unidad: "g", cantidad: 450, formato: "450 g", alergenos: "gluten", clave: "pan-molde-sin-corteza-450g", precioBase: 1.55 },
    { nombre: "galletas chocolate", marca: "Carrefour", categoria: "panaderia", subcategoria: "galletas", unidad: "g", cantidad: 300, formato: "300 g", alergenos: "gluten,lactosa,soja", clave: "galletas-chocolate-300g", precioBase: 1.39 },
    { nombre: "tortitas arroz", marca: "Eroski", categoria: "panaderia", subcategoria: "galletas", unidad: "g", cantidad: 100, formato: "100 g", alergenos: null, clave: "tortitas-arroz-100g", precioBase: 0.95 },
    { nombre: "manzana golden", marca: "Carrefour", categoria: "fruta-verdura", subcategoria: "frutas", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, clave: "manzana-golden-carrefour-1kg", precioBase: 1.79 },
    { nombre: "limon", marca: "Campo Fresco", categoria: "fruta-verdura", subcategoria: "frutas", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, clave: "limon-1kg", precioBase: 1.59 },
    { nombre: "pepino", marca: "Campo Fresco", categoria: "fruta-verdura", subcategoria: "verduras", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, clave: "pepino-1kg", precioBase: 1.29 },
    { nombre: "calabacin", marca: "Hacendado", categoria: "fruta-verdura", subcategoria: "verduras", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, clave: "calabacin-1kg", precioBase: 1.69 },
    { nombre: "berenjena", marca: "Hacendado", categoria: "fruta-verdura", subcategoria: "verduras", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, clave: "berenjena-1kg", precioBase: 2.19 },
    { nombre: "sandia", marca: "Hacendado", categoria: "fruta-verdura", subcategoria: "frutas", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, clave: "sandia-entera-kg", precioBase: 0.69 },
    { nombre: "filete de ternera", marca: "Carrefour", categoria: "carnes", subcategoria: "ternera", unidad: "g", cantidad: 300, formato: "Bandeja 300 g", alergenos: null, clave: "filete-ternera-300g", precioBase: 7.49 },
    { nombre: "muslo de pollo", marca: "Hacendado", categoria: "carnes", subcategoria: "aves", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, clave: "muslo-pollo-1kg", precioBase: 3.29 },
    { nombre: "salchichas", marca: "Hacendado", categoria: "carnes", subcategoria: "embutido", unidad: "g", cantidad: 400, formato: "Pack 400 g", alergenos: "gluten,soja", clave: "salchichas-400g", precioBase: 1.59 },
    { nombre: "merluza congelada", marca: "Hacendado", categoria: "carnes", subcategoria: "pescado", unidad: "g", cantidad: 400, formato: "400 g", alergenos: "pescado", clave: "merluza-congelada-400g", precioBase: 3.99 },
    { nombre: "huevos talla L", marca: "Hacendado", categoria: "huevos", subcategoria: "frescos", unidad: "ud", cantidad: 12, formato: "Docena", alergenos: "huevo", clave: "huevos-l-12ud", precioBase: 2.75 },
    { nombre: "huevos talla M", marca: "Carrefour", categoria: "huevos", subcategoria: "frescos", unidad: "ud", cantidad: 12, formato: "Docena", alergenos: "huevo", clave: "huevos-m-carrefour-12ud", precioBase: 2.65 },
    { nombre: "macarrones", marca: "Carrefour", categoria: "arroces-pasta", subcategoria: "pasta", unidad: "g", cantidad: 500, formato: "500 g", alergenos: "gluten", clave: "macarrones-500g", precioBase: 0.99 },
    { nombre: "espaguetis", marca: "Eroski", categoria: "arroces-pasta", subcategoria: "pasta", unidad: "g", cantidad: 500, formato: "500 g", alergenos: "gluten", clave: "espaguetis-eroski-500g", precioBase: 0.89 },
    { nombre: "arroz basmati", marca: "Carrefour", categoria: "arroces-pasta", subcategoria: "arroces", unidad: "kg", cantidad: 1, formato: "1 kg", alergenos: null, clave: "arroz-basmati-1kg", precioBase: 1.89 },
    { nombre: "alubias blancas", marca: "Hacendado", categoria: "arroces-pasta", subcategoria: "legumbres", unidad: "g", cantidad: 400, formato: "Bote 400 g", alergenos: null, clave: "alubias-blancas-400g", precioBase: 0.75 },
    { nombre: "aceite de girasol", marca: "Hacendado", categoria: "aceites-vinagres", subcategoria: "aceites", unidad: "l", cantidad: 1, formato: "Botella 1L", alergenos: null, clave: "aceite-girasol-1l", precioBase: 1.79 },
    { nombre: "aceite oliva suave", marca: "Carrefour", categoria: "aceites-vinagres", subcategoria: "aceites", unidad: "l", cantidad: 1, formato: "Botella 1L", alergenos: null, clave: "aceite-oliva-suave-1l", precioBase: 6.99 },
    { nombre: "ketchup", marca: "Hacendado", categoria: "aceites-vinagres", subcategoria: "salsas", unidad: "g", cantidad: 570, formato: "570 g", alergenos: null, clave: "ketchup-570g", precioBase: 1.19 },
    { nombre: "mayonesa", marca: "Hacendado", categoria: "aceites-vinagres", subcategoria: "salsas", unidad: "g", cantidad: 450, formato: "450 g", alergenos: "huevo,mostaza", clave: "mayonesa-450g", precioBase: 1.29 },
    { nombre: "sopa de pollo", marca: "Carrefour", categoria: "conservas", subcategoria: "sopas", unidad: "g", cantidad: 250, formato: "Lata 250 g", alergenos: "gluten", clave: "sopa-pollo-250g", precioBase: 0.89 },
    { nombre: "esparragos", marca: "Hacendado", categoria: "conservas", subcategoria: "verduras", unidad: "g", cantidad: 200, formato: "Frasco 200 g", alergenos: null, clave: "esparragos-200g", precioBase: 1.59 },
    { nombre: "patatas fritas", marca: "Hacendado", categoria: "conservas", subcategoria: "snacks", unidad: "g", cantidad: 150, formato: "Bolsa 150 g", alergenos: "gluten", clave: "patatas-fritas-150g", precioBase: 1.09 },
    { nombre: "croquetas jamon", marca: "Hacendado", categoria: "congelados", subcategoria: "croquetas", unidad: "g", cantidad: 600, formato: "600 g", alergenos: "gluten,lactosa,huevo", clave: "croquetas-jamon-600g", precioBase: 3.29 },
    { nombre: "patata congelada", marca: "Carrefour", categoria: "congelados", subcategoria: "verdura", unidad: "g", cantidad: 750, formato: "750 g", alergenos: null, clave: "patata-congelada-750g", precioBase: 1.79 },
    { nombre: "pepinillos", marca: "Hacendado", categoria: "encurtidos", subcategoria: "pepinillos", unidad: "g", cantidad: 330, formato: "Frasco 330 g", alergenos: null, clave: "pepinillos-330g", precioBase: 1.19 },
    { nombre: "colonia", marca: "Hacendado", categoria: "higiene", subcategoria: "perfume", unidad: "ml", cantidad: 150, formato: "150 ml", alergenos: null, clave: "colonia-150ml", precioBase: 2.49 },
    { nombre: "crema hidratante", marca: "Hacendado", categoria: "higiene", subcategoria: "corporal", unidad: "ml", cantidad: 400, formato: "400 ml", alergenos: null, clave: "crema-hidratante-400ml", precioBase: 2.29 },
    { nombre: "bayeta microfibra", marca: "Hacendado", categoria: "limpieza", subcategoria: "utensilios", unidad: "ud", cantidad: 2, formato: "2 unidades", alergenos: null, clave: "bayeta-microfibra-2ud", precioBase: 1.49 },
    { nombre: "limpiacristales", marca: "Hacendado", categoria: "limpieza", subcategoria: "multiusos", unidad: "l", cantidad: 1, formato: "1L", alergenos: null, clave: "limpiacristales-1l", precioBase: 1.19 },
    { nombre: "suavizante", marca: "Hacendado", categoria: "limpieza", subcategoria: "suavizante", unidad: "l", cantidad: 2, formato: "2L", alergenos: null, clave: "suavizante-2l", precioBase: 2.39 },
    { nombre: "te negro", marca: "Hacendado", categoria: "desayuno", subcategoria: "te", unidad: "g", cantidad: 100, formato: "100 g", alergenos: null, clave: "te-negro-100g", precioBase: 1.29 },
    { nombre: "miel", marca: "Hacendado", categoria: "desayuno", subcategoria: "miel", unidad: "g", cantidad: 500, formato: "500 g", alergenos: null, clave: "miel-500g", precioBase: 2.99 },
    { nombre: "pienso perro", marca: "Hacendado", categoria: "mascota", subcategoria: "perros", unidad: "kg", cantidad: 3, formato: "3 kg", alergenos: null, clave: "pienso-perro-3kg", precioBase: 4.99 },
    { nombre: "papilla bebe", marca: "Hacendado", categoria: "bebe", subcategoria: "papilla", unidad: "g", cantidad: 200, formato: "200 g", alergenos: "gluten,lactosa", clave: "papilla-bebe-200g", precioBase: 1.49 },
    { nombre: "toallitas bebe", marca: "Dodot", categoria: "bebe", subcategoria: "toallitas", unidad: "ud", cantidad: 64, formato: "64 ud", alergenos: null, clave: "toallitas-bebe-64ud", precioBase: 1.89 },
  ];

  for (var k = 0; k < syntheticProducts.length; k++) {
    var sp = syntheticProducts[k];
    var precioMercadona = +(sp.precioBase).toFixed(2);
    var claveConMarca = sp.clave;

    var existingProd = await consultaDatos(
      "SELECT id_producto FROM Productos WHERE clave_comparable = ? LIMIT 1",
      [claveConMarca]
    );
    var idProd2;
    if (existingProd.length > 0) {
      idProd2 = existingProd[0].id_producto;
      continue;
    }

    var ins2 = await consultaDatos(
      "INSERT IGNORE INTO Productos (nombre, marca, ean, imagen, descripcion, categoria, subcategoria, unidad_medida, cantidad_unidad, formato, alergenos, ingredientes, info_nutricional, origen, clave_comparable) VALUES (?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?)",
      [sp.nombre, sp.marca, sp.nombre.charAt(0).toUpperCase() + sp.nombre.slice(1) + ".", sp.categoria, sp.subcategoria, sp.unidad, sp.cantidad, sp.formato, sp.alergenos, sp.origen || "Espana", claveConMarca]
    );
    if (ins2.affectedRows > 0) {
      idProd2 = ins2.insertId;
    } else {
      continue;
    }
    insertedProducts++;

    var synthSupers = [
      { slug: "mercadona", factor: 1.0 },
      { slug: "carrefour", factor: CARREFOUR_FACTOR },
      { slug: "eroski", factor: EROSKI_FACTOR }
    ];
    for (var s = 0; s < synthSupers.length; s++) {
      var ss = synthSupers[s];
      var supRows2 = await consultaDatos("SELECT id_supermercado FROM Supermercados WHERE slug = ? LIMIT 1", [ss.slug]);
      if (!supRows2.length) continue;
      var idSuper2 = supRows2[0].id_supermercado;
      var precio2 = +(sp.precioBase * ss.factor).toFixed(2);

      var ptIns2 = await consultaDatos(
        "INSERT INTO ProductosTienda (id_producto, id_supermercado, id_externo, disponible) VALUES (?, ?, ?, 1)",
        [idProd2, idSuper2, "syn-" + claveConMarca + "-" + ss.slug]
      );
      var idPt2 = ptIns2.insertId;

      var precioRef2 = null;
      var unidadRef2 = null;
      if (sp.unidad === "kg" || sp.unidad === "l") {
        precioRef2 = precio2;
        unidadRef2 = sp.unidad;
      } else if (sp.unidad === "g") {
        precioRef2 = +(precio2 / sp.cantidad * 1000).toFixed(4);
        unidadRef2 = "kg";
      } else if (sp.unidad === "ml") {
        precioRef2 = +(precio2 / sp.cantidad * 1000).toFixed(4);
        unidadRef2 = "L";
      } else if (sp.unidad === "ud") {
        precioRef2 = +(precio2 / sp.cantidad).toFixed(4);
        unidadRef2 = "ud";
      }

      await consultaDatos(
        "INSERT INTO Precios (id_producto_tienda, precio_actual, precio_oferta, precio_referencia, unidad_referencia, es_precio_tarjeta, fecha_extraccion) VALUES (?, ?, NULL, ?, ?, 0, NOW())",
        [idPt2, precio2, precioRef2, unidadRef2]
      );
      insertedPrices++;
    }
  }

  console.log("[seed:synthetic] Done. Products inserted:", insertedProducts, "Prices inserted:", insertedPrices);
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});