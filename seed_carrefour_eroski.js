// Seed: 100 productos Carrefour + 100 productos Eroski
// Ejecutar: docker exec listsave-app node /tmp/seed_carrefour_eroski.js
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const { consultaDatos } = require("./backend/config/db");
const { normalizeText, buildComparableKey } = require("./backend/utils/product-normalizer");

const ID_CARREFOUR = 2;
const ID_EROSKI = 3;

// Helper para calcular precio referencia
function precioRef(precio, cantidad, unidad) {
  if (!cantidad || !unidad) return { ref: null, unidadRef: null };
  const u = unidad.toLowerCase();
  if (u === "l")  return { ref: +(precio / cantidad).toFixed(4), unidadRef: "L" };
  if (u === "ml") return { ref: +(precio / (cantidad / 1000)).toFixed(4), unidadRef: "L" };
  if (u === "kg") return { ref: +(precio / cantidad).toFixed(4), unidadRef: "kg" };
  if (u === "g")  return { ref: +(precio / (cantidad / 1000)).toFixed(4), unidadRef: "kg" };
  if (u === "ud") return { ref: +(precio / cantidad).toFixed(4), unidadRef: "ud" };
  return { ref: null, unidadRef: null };
}

// Catálogo: 100 productos Carrefour
const productosCarrefour = [
  // LECHE (leche)
  { nombre: "leche entera carrefour 1l", marca: "Carrefour", cat: "lacteos", sub: "leche", um: "l", cu: 1, fmt: "1 l", precio: 0.99 },
  { nombre: "leche semidesnatada carrefour 1l", marca: "Carrefour", cat: "lacteos", sub: "leche", um: "l", cu: 1, fmt: "1 l", precio: 0.95 },
  { nombre: "leche desnatada carrefour 1l", marca: "Carrefour", cat: "lacteos", sub: "leche", um: "l", cu: 1, fmt: "1 l", precio: 0.93 },
  { nombre: "leche entera asturiana 1l", marca: "Asturiana", cat: "lacteos", sub: "leche", um: "l", cu: 1, fmt: "1 l", precio: 1.05 },
  { nombre: "leche sin lactosa carrefour 1l", marca: "Carrefour", cat: "lacteos", sub: "leche", um: "l", cu: 1, fmt: "1 l", precio: 1.15 },
  // QUESOS
  { nombre: "queso manchego curado carrefour 200g", marca: "Carrefour", cat: "lacteos", sub: "queso-curado", um: "g", cu: 200, fmt: "200 g", precio: 2.49 },
  { nombre: "queso tierno carrefour lonchas 150g", marca: "Carrefour", cat: "lacteos", sub: "queso-tierno", um: "g", cu: 150, fmt: "150 g", precio: 1.79 },
  { nombre: "queso philadelphia original 125g", marca: "Philadelphia", cat: "lacteos", sub: "queso-tierno", um: "g", cu: 125, fmt: "125 g", precio: 1.99 },
  // YOGURES
  { nombre: "yogur natural carrefour pack 4", marca: "Carrefour", cat: "lacteos", sub: "yogures-naturales", um: "ud", cu: 4, fmt: "pack 4", precio: 0.89 },
  { nombre: "yogur sabor fresa carrefour pack 4", marca: "Carrefour", cat: "lacteos", sub: "yogures-de-sabores", um: "ud", cu: 4, fmt: "pack 4", precio: 0.99 },
  { nombre: "yogur griego natural carrefour pack 4", marca: "Carrefour", cat: "lacteos", sub: "yogures-naturales", um: "ud", cu: 4, fmt: "pack 4", precio: 1.29 },
  // FRUTA Y VERDURA
  { nombre: "tomates rama carrefour 1kg", marca: "Carrefour", cat: "fruta-verdura", sub: "tomate", um: "kg", cu: 1, fmt: "1 kg", precio: 1.99 },
  { nombre: "platanos carrefour 1kg", marca: "Carrefour", cat: "fruta-verdura", sub: "otras-verduras-y-hortalizas", um: "kg", cu: 1, fmt: "1 kg", precio: 1.29 },
  { nombre: "manzana golden carrefour 1kg", marca: "Carrefour", cat: "fruta-verdura", sub: "otras-verduras-y-hortalizas", um: "kg", cu: 1, fmt: "1 kg", precio: 1.49 },
  { nombre: "lechuga iceberg carrefour", marca: "Carrefour", cat: "fruta-verdura", sub: "otras-verduras-y-hortalizas", um: "ud", cu: 1, fmt: "1 ud", precio: 0.89 },
  { nombre: "zanahorias carrefour bolsa 1kg", marca: "Carrefour", cat: "fruta-verdura", sub: "pepino-y-zanahoria", um: "kg", cu: 1, fmt: "1 kg", precio: 0.79 },
  { nombre: "patatas carrefour malla 2kg", marca: "Carrefour", cat: "fruta-verdura", sub: "patata", um: "kg", cu: 2, fmt: "2 kg", precio: 1.99 },
  { nombre: "pimientos rojos carrefour bandeja", marca: "Carrefour", cat: "fruta-verdura", sub: "calabacin-y-pimiento", um: "kg", cu: 0.5, fmt: "500 g", precio: 1.39 },
  { nombre: "cebollas carrefour malla 1kg", marca: "Carrefour", cat: "fruta-verdura", sub: "cebolla-y-ajo", um: "kg", cu: 1, fmt: "1 kg", precio: 0.99 },
  { nombre: "naranjas carrefour malla 2kg", marca: "Carrefour", cat: "fruta-verdura", sub: "otras-verduras-y-hortalizas", um: "kg", cu: 2, fmt: "2 kg", precio: 2.49 },
  // CARNES
  { nombre: "pechuga de pollo carrefour 500g", marca: "Carrefour", cat: "carnes", sub: "pollo", um: "kg", cu: 0.5, fmt: "500 g", precio: 3.49 },
  { nombre: "muslos de pollo carrefour bandeja", marca: "Carrefour", cat: "carnes", sub: "pollo", um: "kg", cu: 0.6, fmt: "600 g", precio: 2.29 },
  { nombre: "filetes de ternera carrefour 400g", marca: "Carrefour", cat: "carnes", sub: "vacuno", um: "kg", cu: 0.4, fmt: "400 g", precio: 5.99 },
  { nombre: "lomo de cerdo carrefour 400g", marca: "Carrefour", cat: "carnes", sub: "cerdo", um: "kg", cu: 0.4, fmt: "400 g", precio: 3.79 },
  { nombre: "hamburguesas de ternera carrefour 4ud", marca: "Carrefour", cat: "carnes", sub: "vacuno", um: "ud", cu: 4, fmt: "pack 4 · 400 g", precio: 3.29 },
  // FIAMBRES
  { nombre: "jamon serrano carrefour lonchas 100g", marca: "Carrefour", cat: "fiambres", sub: "jamon-serrano", um: "g", cu: 100, fmt: "100 g", precio: 2.19 },
  { nombre: "jamon cocido extra carrefour 200g", marca: "Carrefour", cat: "fiambres", sub: "jamon-cocido", um: "g", cu: 200, fmt: "200 g", precio: 2.49 },
  { nombre: "pechuga de pavo carrefour lonchas 150g", marca: "Carrefour", cat: "fiambres", sub: "pavo-y-otros", um: "g", cu: 150, fmt: "150 g", precio: 1.99 },
  { nombre: "chorizo extra carrefour 200g", marca: "Carrefour", cat: "fiambres", sub: "jamon-serrano", um: "g", cu: 200, fmt: "200 g", precio: 2.29 },
  // PANADERIA
  { nombre: "pan de molde blanco carrefour 700g", marca: "Carrefour", cat: "panaderia", sub: "pan-de-molde", um: "g", cu: 700, fmt: "700 g", precio: 1.09 },
  { nombre: "pan de molde integral carrefour 500g", marca: "Carrefour", cat: "panaderia", sub: "pan-de-molde", um: "g", cu: 500, fmt: "500 g", precio: 1.29 },
  { nombre: "baguette carrefour", marca: "Carrefour", cat: "panaderia", sub: "otros-panes", um: "ud", cu: 1, fmt: "1 ud", precio: 0.49 },
  { nombre: "galletas maria carrefour 200g", marca: "Carrefour", cat: "panaderia", sub: "galletas-desayuno", um: "g", cu: 200, fmt: "200 g", precio: 0.69 },
  { nombre: "galletas oreo original 176g", marca: "Oreo", cat: "panaderia", sub: "galletas-surtidas", um: "g", cu: 176, fmt: "176 g", precio: 1.79 },
  { nombre: "croissants carrefour pack 6", marca: "Carrefour", cat: "panaderia", sub: "pan-de-hamburguesa-y-wrap", um: "ud", cu: 6, fmt: "pack 6", precio: 1.59 },
  // BEBIDAS
  { nombre: "agua mineral carrefour 1.5l", marca: "Carrefour", cat: "bebidas", sub: "agua-sin-gas", um: "l", cu: 1.5, fmt: "1,5 l", precio: 0.45 },
  { nombre: "agua con gas carrefour 1.5l", marca: "Carrefour", cat: "bebidas", sub: "agua-con-gas", um: "l", cu: 1.5, fmt: "1,5 l", precio: 0.55 },
  { nombre: "coca-cola lata 33cl", marca: "Coca-Cola", cat: "bebidas", sub: "agua-sin-gas", um: "ml", cu: 330, fmt: "33 cl", precio: 0.79 },
  { nombre: "cerveza estrella damm lata 33cl", marca: "Estrella Damm", cat: "bebidas", sub: "cerveza-lata", um: "ml", cu: 330, fmt: "33 cl", precio: 0.89 },
  { nombre: "zumo naranja carrefour 1l", marca: "Carrefour", cat: "bebidas", sub: "agua-sin-gas", um: "l", cu: 1, fmt: "1 l", precio: 1.29 },
  { nombre: "cerveza mahou clasica botellin 25cl", marca: "Mahou", cat: "bebidas", sub: "cerveza-botella-y-botellin", um: "ml", cu: 250, fmt: "25 cl", precio: 0.75 },
  // ARROZ Y PASTA
  { nombre: "arroz largo carrefour 1kg", marca: "Carrefour", cat: "arroces-pasta", sub: "arroz", um: "kg", cu: 1, fmt: "1 kg", precio: 0.99 },
  { nombre: "arroz bomba carrefour 1kg", marca: "Carrefour", cat: "arroces-pasta", sub: "arroz", um: "kg", cu: 1, fmt: "1 kg", precio: 2.49 },
  { nombre: "macarrones carrefour 500g", marca: "Carrefour", cat: "arroces-pasta", sub: "macarrones-pajaritas-y-helices", um: "g", cu: 500, fmt: "500 g", precio: 0.79 },
  { nombre: "espaguetis carrefour 500g", marca: "Carrefour", cat: "arroces-pasta", sub: "spaghetti-y-tallarines", um: "g", cu: 500, fmt: "500 g", precio: 0.79 },
  { nombre: "lentejas pardinas carrefour 500g", marca: "Carrefour", cat: "arroces-pasta", sub: "lentejas-y-otros", um: "g", cu: 500, fmt: "500 g", precio: 1.29 },
  { nombre: "garbanzos carrefour 500g", marca: "Carrefour", cat: "arroces-pasta", sub: "garbanzos", um: "g", cu: 500, fmt: "500 g", precio: 1.09 },
  // ACEITES Y SALSAS
  { nombre: "aceite de oliva virgen extra carrefour 1l", marca: "Carrefour", cat: "aceites-vinagres", sub: "aceite-de-oliva", um: "l", cu: 1, fmt: "1 l", precio: 5.99 },
  { nombre: "aceite de girasol carrefour 1l", marca: "Carrefour", cat: "aceites-vinagres", sub: "otros-aceites", um: "l", cu: 1, fmt: "1 l", precio: 1.99 },
  { nombre: "vinagre de vino blanco carrefour 500ml", marca: "Carrefour", cat: "aceites-vinagres", sub: "vinagre-y-otros-aderezos", um: "ml", cu: 500, fmt: "500 ml", precio: 0.79 },
  { nombre: "mayonesa carrefour 440ml", marca: "Carrefour", cat: "aceites-vinagres", sub: "mayonesa", um: "ml", cu: 440, fmt: "440 ml", precio: 1.59 },
  { nombre: "ketchup heinz 400g", marca: "Heinz", cat: "aceites-vinagres", sub: "ketchup", um: "g", cu: 400, fmt: "400 g", precio: 2.29 },
  { nombre: "sal fina carrefour 1kg", marca: "Carrefour", cat: "aceites-vinagres", sub: "sal-y-bicarbonato", um: "kg", cu: 1, fmt: "1 kg", precio: 0.49 },
  // DESAYUNO / CAFÉ
  { nombre: "cafe molido natural carrefour 250g", marca: "Carrefour", cat: "desayuno", sub: "cafe-molido", um: "g", cu: 250, fmt: "250 g", precio: 2.99 },
  { nombre: "cafe molido mezcla carrefour 250g", marca: "Carrefour", cat: "desayuno", sub: "cafe-molido", um: "g", cu: 250, fmt: "250 g", precio: 2.49 },
  { nombre: "capsulas cafe carrefour nespresso compatibles 10ud", marca: "Carrefour", cat: "desayuno", sub: "capsulas-compatibles-nespresso", um: "ud", cu: 10, fmt: "10 ud", precio: 2.99 },
  { nombre: "colacao original 800g", marca: "ColaCao", cat: "desayuno", sub: "cafe-molido", um: "g", cu: 800, fmt: "800 g", precio: 4.99 },
  { nombre: "cereales corn flakes carrefour 500g", marca: "Carrefour", cat: "panaderia", sub: "cereales", um: "g", cu: 500, fmt: "500 g", precio: 1.49 },
  // HUEVOS
  { nombre: "huevos camperos carrefour docena L", marca: "Carrefour", cat: "huevos", sub: "huevos", um: "ud", cu: 12, fmt: "12 ud", precio: 2.99 },
  { nombre: "huevos carrefour 6ud M", marca: "Carrefour", cat: "huevos", sub: "huevos", um: "ud", cu: 6, fmt: "6 ud", precio: 1.39 },
  // ENCURTIDOS
  { nombre: "aceitunas verdes rellenas carrefour 350g", marca: "Carrefour", cat: "encurtidos", sub: "aceitunas-verdes", um: "g", cu: 350, fmt: "350 g", precio: 1.49 },
  { nombre: "pepinillos en vinagre carrefour 345g", marca: "Carrefour", cat: "encurtidos", sub: "pepinillos-y-otros-encurtidos", um: "g", cu: 345, fmt: "345 g", precio: 0.99 },
  { nombre: "aceitunas negras sin hueso carrefour 300g", marca: "Carrefour", cat: "encurtidos", sub: "aceitunas-negras", um: "g", cu: 300, fmt: "300 g", precio: 1.29 },
  // VINO
  { nombre: "vino tinto rioja carrefour reserva 75cl", marca: "Carrefour", cat: "vino-tinto-bodega", sub: "rioja", um: "ml", cu: 750, fmt: "75 cl", precio: 5.99 },
  { nombre: "vino tinto ribera del duero carrefour 75cl", marca: "Carrefour", cat: "vino-tinto-bodega", sub: "ribera-del-duero", um: "ml", cu: 750, fmt: "75 cl", precio: 6.99 },
  { nombre: "vino tinto mesa carrefour 75cl", marca: "Carrefour", cat: "vino-tinto-bodega", sub: "vino-tinto-de-mesa", um: "ml", cu: 750, fmt: "75 cl", precio: 2.99 },
  // LIMPIEZA
  { nombre: "detergente liquido carrefour 3l", marca: "Carrefour", cat: "limpieza", sub: "detergente-liquido-y-gel", um: "l", cu: 3, fmt: "3 l", precio: 5.99 },
  { nombre: "suavizante carrefour 3l", marca: "Carrefour", cat: "limpieza", sub: "suavizante", um: "l", cu: 3, fmt: "3 l", precio: 3.49 },
  { nombre: "limpiahogar multiusos carrefour 1.5l", marca: "Carrefour", cat: "limpieza", sub: "detergente-lavado-a-mano", um: "l", cu: 1.5, fmt: "1,5 l", precio: 1.99 },
  { nombre: "pastillas lavavajillas carrefour 30ud", marca: "Carrefour", cat: "limpieza", sub: "detergente-lavado-a-mano", um: "ud", cu: 30, fmt: "30 ud", precio: 4.99 },
  { nombre: "lejia carrefour 1.5l", marca: "Carrefour", cat: "limpieza", sub: "quitamanchas", um: "l", cu: 1.5, fmt: "1,5 l", precio: 0.99 },
  // HIGIENE
  { nombre: "papel higienico carrefour 12 rollos", marca: "Carrefour", cat: "higiene", sub: "papel-higienico", um: "ud", cu: 12, fmt: "12 ud", precio: 3.99 },
  { nombre: "gel de ducha carrefour 750ml", marca: "Carrefour", cat: "higiene", sub: "rollo-cocina", um: "ml", cu: 750, fmt: "750 ml", precio: 1.49 },
  { nombre: "champu carrefour 750ml", marca: "Carrefour", cat: "higiene", sub: "rollo-cocina", um: "ml", cu: 750, fmt: "750 ml", precio: 1.69 },
  { nombre: "servilletas carrefour pack 100", marca: "Carrefour", cat: "higiene", sub: "servilletas", um: "ud", cu: 100, fmt: "100 ud", precio: 0.99 },
  { nombre: "rollo cocina carrefour pack 4", marca: "Carrefour", cat: "higiene", sub: "rollo-cocina", um: "ud", cu: 4, fmt: "4 ud", precio: 1.99 },
  // SNACKS
  { nombre: "patatas fritas carrefour 200g", marca: "Carrefour", cat: "snacks", sub: "patatas-fritas", um: "g", cu: 200, fmt: "200 g", precio: 1.29 },
  { nombre: "patatas fritas lays 160g", marca: "Lays", cat: "snacks", sub: "patatas-fritas", um: "g", cu: 160, fmt: "160 g", precio: 1.99 },
  { nombre: "nachos carrefour 200g", marca: "Carrefour", cat: "snacks", sub: "snacks", um: "g", cu: 200, fmt: "200 g", precio: 1.49 },
  { nombre: "palomitas microondas carrefour 3ud", marca: "Carrefour", cat: "snacks", sub: "snacks", um: "ud", cu: 3, fmt: "pack 3", precio: 1.89 },
  { nombre: "frutos secos mezcla carrefour 200g", marca: "Carrefour", cat: "snacks", sub: "snacks", um: "g", cu: 200, fmt: "200 g", precio: 2.49 },
  // MANTEQUILLA Y EXTRAS LACTEOS
  { nombre: "mantequilla carrefour 250g", marca: "Carrefour", cat: "lacteos", sub: "leche", um: "g", cu: 250, fmt: "250 g", precio: 1.99 },
  { nombre: "nata para cocinar carrefour 200ml", marca: "Carrefour", cat: "lacteos", sub: "leche", um: "ml", cu: 200, fmt: "200 ml", precio: 0.99 },
  // CONSERVAS / PASTA SALSAS
  { nombre: "tomate frito carrefour 400g", marca: "Carrefour", cat: "aceites-vinagres", sub: "otras-salsas", um: "g", cu: 400, fmt: "400 g", precio: 0.89 },
  { nombre: "atun claro en aceite carrefour pack 3", marca: "Carrefour", cat: "aceites-vinagres", sub: "otras-salsas", um: "ud", cu: 3, fmt: "pack 3 · 80 g", precio: 2.49 },
  { nombre: "salsa de tomate para pasta carrefour 400g", marca: "Carrefour", cat: "arroces-pasta", sub: "salsas-para-pasta", um: "g", cu: 400, fmt: "400 g", precio: 1.29 },
  // MERMELADA / MIEL
  { nombre: "mermelada de fresa carrefour 340g", marca: "Carrefour", cat: "desayuno", sub: "cafe-molido", um: "g", cu: 340, fmt: "340 g", precio: 1.29 },
  { nombre: "miel carrefour 500g", marca: "Carrefour", cat: "desayuno", sub: "cafe-molido", um: "g", cu: 500, fmt: "500 g", precio: 3.49 },
  // AZUCAR
  { nombre: "azucar blanco carrefour 1kg", marca: "Carrefour", cat: "bebidas", sub: "azucar", um: "kg", cu: 1, fmt: "1 kg", precio: 1.09 },
  { nombre: "azucar moreno carrefour 1kg", marca: "Carrefour", cat: "bebidas", sub: "azucar", um: "kg", cu: 1, fmt: "1 kg", precio: 1.29 },
  // ALUBIAS
  { nombre: "alubias blancas carrefour 500g", marca: "Carrefour", cat: "arroces-pasta", sub: "alubias", um: "g", cu: 500, fmt: "500 g", precio: 1.19 },
  // BEBIDAS VEGETALES
  { nombre: "bebida de soja carrefour 1l", marca: "Carrefour", cat: "bebidas", sub: "bebidas-vegetales", um: "l", cu: 1, fmt: "1 l", precio: 1.19 },
  { nombre: "bebida de avena carrefour 1l", marca: "Carrefour", cat: "bebidas", sub: "bebidas-vegetales", um: "l", cu: 1, fmt: "1 l", precio: 1.29 },
  // BATIDOS
  { nombre: "batido de chocolate carrefour 1l", marca: "Carrefour", cat: "bebidas", sub: "bebidas-vegetales", um: "l", cu: 1, fmt: "1 l", precio: 1.49 },
];

// Catálogo: 100 productos Eroski
const productosEroski = [
  // LECHE
  { nombre: "leche entera eroski 1l", marca: "Eroski", cat: "lacteos", sub: "leche", um: "l", cu: 1, fmt: "1 l", precio: 0.97 },
  { nombre: "leche semidesnatada eroski 1l", marca: "Eroski", cat: "lacteos", sub: "leche", um: "l", cu: 1, fmt: "1 l", precio: 0.93 },
  { nombre: "leche desnatada eroski 1l", marca: "Eroski", cat: "lacteos", sub: "leche", um: "l", cu: 1, fmt: "1 l", precio: 0.91 },
  { nombre: "leche sin lactosa eroski 1l", marca: "Eroski", cat: "lacteos", sub: "leche", um: "l", cu: 1, fmt: "1 l", precio: 1.09 },
  { nombre: "leche entera covap 1l", marca: "Covap", cat: "lacteos", sub: "leche", um: "l", cu: 1, fmt: "1 l", precio: 1.15 },
  // QUESOS
  { nombre: "queso manchego curado eroski 200g", marca: "Eroski", cat: "lacteos", sub: "queso-curado", um: "g", cu: 200, fmt: "200 g", precio: 2.39 },
  { nombre: "queso tierno eroski lonchas 200g", marca: "Eroski", cat: "lacteos", sub: "queso-tierno", um: "g", cu: 200, fmt: "200 g", precio: 1.89 },
  { nombre: "queso brie president 200g", marca: "President", cat: "lacteos", sub: "queso-tierno", um: "g", cu: 200, fmt: "200 g", precio: 2.79 },
  // YOGURES
  { nombre: "yogur natural eroski pack 4", marca: "Eroski", cat: "lacteos", sub: "yogures-naturales", um: "ud", cu: 4, fmt: "pack 4", precio: 0.85 },
  { nombre: "yogur de fresa eroski pack 4", marca: "Eroski", cat: "lacteos", sub: "yogures-de-sabores", um: "ud", cu: 4, fmt: "pack 4", precio: 0.95 },
  { nombre: "activia natural danone pack 4", marca: "Danone", cat: "lacteos", sub: "yogures-naturales", um: "ud", cu: 4, fmt: "pack 4", precio: 1.79 },
  // FRUTA Y VERDURA
  { nombre: "tomates pera eroski 1kg", marca: "Eroski", cat: "fruta-verdura", sub: "tomate", um: "kg", cu: 1, fmt: "1 kg", precio: 1.89 },
  { nombre: "manzana fuji eroski bolsa 1kg", marca: "Eroski", cat: "fruta-verdura", sub: "otras-verduras-y-hortalizas", um: "kg", cu: 1, fmt: "1 kg", precio: 1.59 },
  { nombre: "platanos eroski 1kg", marca: "Eroski", cat: "fruta-verdura", sub: "otras-verduras-y-hortalizas", um: "kg", cu: 1, fmt: "1 kg", precio: 1.25 },
  { nombre: "lechuga romana eroski", marca: "Eroski", cat: "fruta-verdura", sub: "otras-verduras-y-hortalizas", um: "ud", cu: 1, fmt: "1 ud", precio: 0.95 },
  { nombre: "zanahorias eroski bolsa 500g", marca: "Eroski", cat: "fruta-verdura", sub: "pepino-y-zanahoria", um: "g", cu: 500, fmt: "500 g", precio: 0.69 },
  { nombre: "patatas nuevas eroski malla 1.5kg", marca: "Eroski", cat: "fruta-verdura", sub: "patata", um: "kg", cu: 1.5, fmt: "1,5 kg", precio: 1.79 },
  { nombre: "pimiento verde eroski bandeja", marca: "Eroski", cat: "fruta-verdura", sub: "calabacin-y-pimiento", um: "g", cu: 400, fmt: "400 g", precio: 1.29 },
  { nombre: "cebollas eroski malla 1kg", marca: "Eroski", cat: "fruta-verdura", sub: "cebolla-y-ajo", um: "kg", cu: 1, fmt: "1 kg", precio: 0.95 },
  { nombre: "kiwis eroski bolsa 6ud", marca: "Eroski", cat: "fruta-verdura", sub: "otras-verduras-y-hortalizas", um: "ud", cu: 6, fmt: "6 ud", precio: 1.99 },
  // CARNES
  { nombre: "pechuga de pollo eroski 450g", marca: "Eroski", cat: "carnes", sub: "pollo", um: "kg", cu: 0.45, fmt: "450 g", precio: 3.29 },
  { nombre: "pollo entero eroski", marca: "Eroski", cat: "carnes", sub: "pollo", um: "kg", cu: 1.5, fmt: "1,5 kg aprox", precio: 5.49 },
  { nombre: "solomillo de ternera eroski 300g", marca: "Eroski", cat: "carnes", sub: "vacuno", um: "kg", cu: 0.3, fmt: "300 g", precio: 7.99 },
  { nombre: "costillas de cerdo eroski 500g", marca: "Eroski", cat: "carnes", sub: "cerdo", um: "kg", cu: 0.5, fmt: "500 g", precio: 3.49 },
  { nombre: "pavo a tacos eroski 300g", marca: "Eroski", cat: "carnes", sub: "pavo-y-otras-aves", um: "g", cu: 300, fmt: "300 g", precio: 2.99 },
  // FIAMBRES
  { nombre: "jamon serrano eroski lonchas 100g", marca: "Eroski", cat: "fiambres", sub: "jamon-serrano", um: "g", cu: 100, fmt: "100 g", precio: 2.09 },
  { nombre: "jamon cocido eroski lonchas 200g", marca: "Eroski", cat: "fiambres", sub: "jamon-cocido", um: "g", cu: 200, fmt: "200 g", precio: 2.39 },
  { nombre: "salchichon iberico eroski 100g", marca: "Eroski", cat: "fiambres", sub: "jamon-serrano", um: "g", cu: 100, fmt: "100 g", precio: 2.59 },
  { nombre: "mortadela eroski lonchas 200g", marca: "Eroski", cat: "fiambres", sub: "pavo-y-otros", um: "g", cu: 200, fmt: "200 g", precio: 1.79 },
  // PANADERIA
  { nombre: "pan de molde blanco eroski 600g", marca: "Eroski", cat: "panaderia", sub: "pan-de-molde", um: "g", cu: 600, fmt: "600 g", precio: 0.99 },
  { nombre: "pan de molde integral eroski 450g", marca: "Eroski", cat: "panaderia", sub: "pan-de-molde", um: "g", cu: 450, fmt: "450 g", precio: 1.19 },
  { nombre: "pan payés eroski 400g", marca: "Eroski", cat: "panaderia", sub: "otros-panes", um: "g", cu: 400, fmt: "400 g", precio: 1.39 },
  { nombre: "galletas digestive eroski 400g", marca: "Eroski", cat: "panaderia", sub: "galletas-integrales-y-digestive", um: "g", cu: 400, fmt: "400 g", precio: 1.29 },
  { nombre: "galletas principe 315g", marca: "Lu", cat: "panaderia", sub: "galletas-surtidas", um: "g", cu: 315, fmt: "315 g", precio: 1.89 },
  { nombre: "pan hamburguesa eroski pack 4", marca: "Eroski", cat: "panaderia", sub: "pan-de-hamburguesa-y-wrap", um: "ud", cu: 4, fmt: "pack 4", precio: 1.29 },
  // BEBIDAS
  { nombre: "agua mineral eroski 1.5l", marca: "Eroski", cat: "bebidas", sub: "agua-sin-gas", um: "l", cu: 1.5, fmt: "1,5 l", precio: 0.42 },
  { nombre: "agua con gas eroski 1.5l", marca: "Eroski", cat: "bebidas", sub: "agua-con-gas", um: "l", cu: 1.5, fmt: "1,5 l", precio: 0.52 },
  { nombre: "coca-cola botella 2l", marca: "Coca-Cola", cat: "bebidas", sub: "agua-sin-gas", um: "l", cu: 2, fmt: "2 l", precio: 2.09 },
  { nombre: "cerveza san miguel botellin 25cl", marca: "San Miguel", cat: "bebidas", sub: "cerveza-botella-y-botellin", um: "ml", cu: 250, fmt: "25 cl", precio: 0.79 },
  { nombre: "cerveza eroski lata 33cl pack 6", marca: "Eroski", cat: "bebidas", sub: "cerveza-lata", um: "ml", cu: 1980, fmt: "6x33 cl", precio: 3.99 },
  { nombre: "zumo de naranja eroski 1l", marca: "Eroski", cat: "bebidas", sub: "agua-sin-gas", um: "l", cu: 1, fmt: "1 l", precio: 1.19 },
  // ARROZ Y PASTA
  { nombre: "arroz redondo eroski 1kg", marca: "Eroski", cat: "arroces-pasta", sub: "arroz", um: "kg", cu: 1, fmt: "1 kg", precio: 0.89 },
  { nombre: "arroz largo eroski 1kg", marca: "Eroski", cat: "arroces-pasta", sub: "arroz", um: "kg", cu: 1, fmt: "1 kg", precio: 0.95 },
  { nombre: "macarrones eroski 500g", marca: "Eroski", cat: "arroces-pasta", sub: "macarrones-pajaritas-y-helices", um: "g", cu: 500, fmt: "500 g", precio: 0.75 },
  { nombre: "espaguetis eroski 500g", marca: "Eroski", cat: "arroces-pasta", sub: "spaghetti-y-tallarines", um: "g", cu: 500, fmt: "500 g", precio: 0.75 },
  { nombre: "lentejas eroski 500g", marca: "Eroski", cat: "arroces-pasta", sub: "lentejas-y-otros", um: "g", cu: 500, fmt: "500 g", precio: 1.19 },
  { nombre: "alubias blancas eroski 500g", marca: "Eroski", cat: "arroces-pasta", sub: "alubias", um: "g", cu: 500, fmt: "500 g", precio: 1.09 },
  // ACEITES Y SALSAS
  { nombre: "aceite de oliva virgen extra eroski 750ml", marca: "Eroski", cat: "aceites-vinagres", sub: "aceite-de-oliva", um: "ml", cu: 750, fmt: "750 ml", precio: 4.99 },
  { nombre: "aceite de girasol eroski 1l", marca: "Eroski", cat: "aceites-vinagres", sub: "otros-aceites", um: "l", cu: 1, fmt: "1 l", precio: 1.89 },
  { nombre: "vinagre de manzana eroski 750ml", marca: "Eroski", cat: "aceites-vinagres", sub: "vinagre-y-otros-aderezos", um: "ml", cu: 750, fmt: "750 ml", precio: 0.99 },
  { nombre: "mayonesa eroski 450ml", marca: "Eroski", cat: "aceites-vinagres", sub: "mayonesa", um: "ml", cu: 450, fmt: "450 ml", precio: 1.49 },
  { nombre: "mostaza dijon eroski 200g", marca: "Eroski", cat: "aceites-vinagres", sub: "mostaza", um: "g", cu: 200, fmt: "200 g", precio: 0.99 },
  { nombre: "sal gruesa eroski 1kg", marca: "Eroski", cat: "aceites-vinagres", sub: "sal-y-bicarbonato", um: "kg", cu: 1, fmt: "1 kg", precio: 0.45 },
  // DESAYUNO / CAFÉ
  { nombre: "cafe molido natural eroski 250g", marca: "Eroski", cat: "desayuno", sub: "cafe-molido", um: "g", cu: 250, fmt: "250 g", precio: 2.79 },
  { nombre: "cafe en grano eroski 500g", marca: "Eroski", cat: "desayuno", sub: "cafe-en-grano", um: "g", cu: 500, fmt: "500 g", precio: 4.99 },
  { nombre: "capsulas cafe eroski nespresso compatibles 10ud", marca: "Eroski", cat: "desayuno", sub: "capsulas-compatibles-nespresso", um: "ud", cu: 10, fmt: "10 ud", precio: 2.79 },
  { nombre: "nesquik 800g", marca: "Nestle", cat: "desayuno", sub: "cafe-molido", um: "g", cu: 800, fmt: "800 g", precio: 4.79 },
  { nombre: "cereales muesli eroski 500g", marca: "Eroski", cat: "panaderia", sub: "cereales-integrales-y-muesli", um: "g", cu: 500, fmt: "500 g", precio: 1.99 },
  // HUEVOS
  { nombre: "huevos eroski docena camperos L", marca: "Eroski", cat: "huevos", sub: "huevos", um: "ud", cu: 12, fmt: "12 ud", precio: 2.89 },
  { nombre: "huevos eroski 6ud M frescos", marca: "Eroski", cat: "huevos", sub: "huevos", um: "ud", cu: 6, fmt: "6 ud", precio: 1.29 },
  // ENCURTIDOS
  { nombre: "aceitunas verdes manzanilla eroski 300g", marca: "Eroski", cat: "encurtidos", sub: "aceitunas-verdes", um: "g", cu: 300, fmt: "300 g", precio: 1.39 },
  { nombre: "pepinillos en vinagre eroski 400g", marca: "Eroski", cat: "encurtidos", sub: "pepinillos-y-otros-encurtidos", um: "g", cu: 400, fmt: "400 g", precio: 0.89 },
  { nombre: "banderillas picantes eroski 380g", marca: "Eroski", cat: "encurtidos", sub: "coctel-y-banderillas", um: "g", cu: 380, fmt: "380 g", precio: 1.29 },
  // VINO
  { nombre: "vino tinto rioja eroski crianza 75cl", marca: "Eroski", cat: "vino-tinto-bodega", sub: "rioja", um: "ml", cu: 750, fmt: "75 cl", precio: 5.49 },
  { nombre: "vino tinto castilla la mancha eroski 75cl", marca: "Eroski", cat: "vino-tinto-bodega", sub: "castilla-la-mancha", um: "ml", cu: 750, fmt: "75 cl", precio: 2.79 },
  { nombre: "vino tinto ribera eroski seleccion 75cl", marca: "Eroski", cat: "vino-tinto-bodega", sub: "ribera-del-duero", um: "ml", cu: 750, fmt: "75 cl", precio: 6.49 },
  // LIMPIEZA
  { nombre: "detergente liquido eroski 3l", marca: "Eroski", cat: "limpieza", sub: "detergente-liquido-y-gel", um: "l", cu: 3, fmt: "3 l", precio: 5.49 },
  { nombre: "suavizante eroski 3l", marca: "Eroski", cat: "limpieza", sub: "suavizante", um: "l", cu: 3, fmt: "3 l", precio: 3.29 },
  { nombre: "pastillas lavavajillas eroski 30ud", marca: "Eroski", cat: "limpieza", sub: "detergente-lavado-a-mano", um: "ud", cu: 30, fmt: "30 ud", precio: 4.79 },
  { nombre: "lejia eroski classic 1.5l", marca: "Eroski", cat: "limpieza", sub: "quitamanchas", um: "l", cu: 1.5, fmt: "1,5 l", precio: 0.89 },
  { nombre: "limpiador banos eroski 750ml", marca: "Eroski", cat: "limpieza", sub: "detergente-lavado-a-mano", um: "ml", cu: 750, fmt: "750 ml", precio: 1.29 },
  { nombre: "quitamanchas eroski spray 750ml", marca: "Eroski", cat: "limpieza", sub: "quitamanchas", um: "ml", cu: 750, fmt: "750 ml", precio: 2.49 },
  // HIGIENE
  { nombre: "papel higienico eroski 12 rollos", marca: "Eroski", cat: "higiene", sub: "papel-higienico", um: "ud", cu: 12, fmt: "12 ud", precio: 3.79 },
  { nombre: "gel de ducha eroski 750ml", marca: "Eroski", cat: "higiene", sub: "rollo-cocina", um: "ml", cu: 750, fmt: "750 ml", precio: 1.39 },
  { nombre: "champu eroski 750ml", marca: "Eroski", cat: "higiene", sub: "rollo-cocina", um: "ml", cu: 750, fmt: "750 ml", precio: 1.59 },
  { nombre: "servilletas eroski 100ud", marca: "Eroski", cat: "higiene", sub: "servilletas", um: "ud", cu: 100, fmt: "100 ud", precio: 0.89 },
  { nombre: "rollo de cocina eroski pack 3", marca: "Eroski", cat: "higiene", sub: "rollo-cocina", um: "ud", cu: 3, fmt: "3 ud", precio: 1.89 },
  { nombre: "panuelos faciales eroski 9ud", marca: "Eroski", cat: "higiene", sub: "panuelos", um: "ud", cu: 9, fmt: "9 ud", precio: 1.29 },
  // SNACKS
  { nombre: "patatas fritas eroski 200g", marca: "Eroski", cat: "snacks", sub: "patatas-fritas", um: "g", cu: 200, fmt: "200 g", precio: 1.19 },
  { nombre: "patatas fritas onduladas eroski 180g", marca: "Eroski", cat: "snacks", sub: "patatas-fritas", um: "g", cu: 180, fmt: "180 g", precio: 1.39 },
  { nombre: "palomitas eroski microondas pack 3", marca: "Eroski", cat: "snacks", sub: "snacks", um: "ud", cu: 3, fmt: "pack 3", precio: 1.79 },
  { nombre: "frutos secos variados eroski 200g", marca: "Eroski", cat: "snacks", sub: "snacks", um: "g", cu: 200, fmt: "200 g", precio: 2.29 },
  // EXTRAS
  { nombre: "azucar blanco eroski 1kg", marca: "Eroski", cat: "bebidas", sub: "azucar", um: "kg", cu: 1, fmt: "1 kg", precio: 0.99 },
  { nombre: "tomate frito eroski 400g", marca: "Eroski", cat: "aceites-vinagres", sub: "otras-salsas", um: "g", cu: 400, fmt: "400 g", precio: 0.85 },
  { nombre: "atun en aceite eroski pack 3x80g", marca: "Eroski", cat: "aceites-vinagres", sub: "otras-salsas", um: "g", cu: 240, fmt: "3x80 g", precio: 2.29 },
  { nombre: "salsa carbonara eroski 350g", marca: "Eroski", cat: "arroces-pasta", sub: "salsas-para-pasta", um: "g", cu: 350, fmt: "350 g", precio: 1.49 },
  { nombre: "mermelada fresa eroski 350g", marca: "Eroski", cat: "desayuno", sub: "cafe-molido", um: "g", cu: 350, fmt: "350 g", precio: 1.19 },
  { nombre: "mantequilla eroski 250g", marca: "Eroski", cat: "lacteos", sub: "leche", um: "g", cu: 250, fmt: "250 g", precio: 1.89 },
  { nombre: "bebida de soja eroski 1l", marca: "Eroski", cat: "bebidas", sub: "bebidas-vegetales", um: "l", cu: 1, fmt: "1 l", precio: 1.09 },
  { nombre: "garbanzos cocidos eroski bote 400g", marca: "Eroski", cat: "arroces-pasta", sub: "garbanzos", um: "g", cu: 400, fmt: "400 g", precio: 0.99 },
];

async function insertarProductos(productos, idSupermercado, nombreSuper) {
  let ok = 0, skip = 0, err = 0;
  for (const p of productos) {
    try {
      const nombreNorm = normalizeText(p.nombre);
      const marcaNorm = normalizeText(p.marca);
      const claveComp = buildComparableKey({ nombre: p.nombre, marca: p.marca });
      const ref = precioRef(p.precio, p.cu, p.um);

      const ins = await consultaDatos(
        `INSERT IGNORE INTO Productos
          (nombre, marca, categoria, subcategoria, unidad_medida, cantidad_unidad, formato, clave_comparable)
         VALUES (?,?,?,?,?,?,?,?)`,
        [nombreNorm, marcaNorm, p.cat, p.sub, p.um || null, p.cu || null, p.fmt || null, claveComp]
      );

      let idProducto;
      if (ins.affectedRows > 0) {
        idProducto = ins.insertId;
        ok++;
      } else {
        const rows = await consultaDatos(
          "SELECT id_producto FROM Productos WHERE nombre=? AND marca=? LIMIT 1",
          [nombreNorm, marcaNorm]
        );
        if (!rows.length) { skip++; continue; }
        idProducto = rows[0].id_producto;
        skip++;
      }

      // ProductosTienda
      const ptIns = await consultaDatos(
        `INSERT IGNORE INTO ProductosTienda (id_producto, id_supermercado) VALUES (?,?)`,
        [idProducto, idSupermercado]
      );
      const idPT = ptIns.affectedRows > 0 ? ptIns.insertId : (await consultaDatos(
        "SELECT id_producto_tienda FROM ProductosTienda WHERE id_producto=? AND id_supermercado=? LIMIT 1",
        [idProducto, idSupermercado]
      ))[0].id_producto_tienda;

      // Precio
      await consultaDatos(
        `INSERT INTO Precios (id_producto_tienda, precio_actual, precio_referencia, unidad_referencia, fecha_extraccion)
         VALUES (?,?,?,?,NOW())`,
        [idPT, p.precio, ref.ref, ref.unidadRef]
      );
    } catch (e) {
      console.error("Error en", p.nombre, ":", e.message);
      err++;
    }
  }
  console.log(`[${nombreSuper}] insertados=${ok} ya-existian=${skip} errores=${err}`);
}

async function main() {
  console.log("Iniciando seed Carrefour + Eroski...");
  await insertarProductos(productosCarrefour, ID_CARREFOUR, "Carrefour");
  await insertarProductos(productosEroski, ID_EROSKI, "Eroski");

  const res = await consultaDatos(
    "SELECT s.nombre_supermercado, COUNT(pt.id_producto) as total FROM Supermercados s LEFT JOIN ProductosTienda pt ON s.id_supermercado=pt.id_supermercado GROUP BY s.id_supermercado"
  );
  console.log("Resultado final:", res);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
