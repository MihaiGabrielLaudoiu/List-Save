var MERCADONA_CATEGORY_IDS = [
  "29", "38", "37", "40", "48", "50", "54", "60", "72", "77", "78", "80",
  "81", "83", "89", "104", "112", "115", "116", "117", "118", "120", "121",
  "132", "135", "156", "164", "169", "226", "238"
];

var supermarketSources = [
  {
    slug: "mercadona",
    nombre: "Mercadona",
    estrategia: "api",
    descripcion: "API interna JSON de Mercadona",
    logo: "assets/images/mercadona.svg",
    emoji: "\uD83D\uDED2",
    color: "#1f8f5f",
    searchTerms: MERCADONA_CATEGORY_IDS,
    priceFactor: Number(process.env.MERCADONA_PRICE_FACTOR || 1.0),
    activa: true
  },
  {
    slug: "carrefour",
    nombre: "Carrefour",
    estrategia: "scraping",
    descripcion: "Scraping carrefour.es con Playwright",
    logo: "assets/images/carrefour.svg",
    emoji: "\uD83C\uDFEA",
    color: "#1f5eff",
    searchTerms: [
      "leche", "pan", "huevos", "arroz", "tomate", "pasta", "yogur", "aceite",
      "azucar", "agua", "pollo", "cebolla", "platano", "zanahoria", "patata",
      "mantequilla", "queso", "jamon", "atun", "cafe", "cerveza", "refresco",
      "galleta", "champu", "detergente", "lavavajillas", "papel higienico",
      "gel de ducha", "desodorante", "lechuga", "pimiento", "lentejas"
    ],
    priceFactor: Number(process.env.CARREFOUR_PRICE_FACTOR || 1.05),
    activa: true
  },
  {
    slug: "eroski",
    nombre: "Eroski",
    estrategia: "scraping",
    descripcion: "Scraping supermercado.eroski.es con Playwright",
    logo: "assets/images/eroski.svg",
    emoji: "\uD83C\uDFEC",
    color: "#e8000d",
    searchTerms: [
      "leche", "pan", "huevos", "arroz", "pasta", "yogur", "aceite", "agua",
      "pollo", "tomate", "cebolla", "platano", "zanahoria", "patata", "queso",
      "mantequilla", "jamon", "atun", "cafe", "cerveza", "galleta",
      "champu", "detergente", "papel higienico", "lechuga", "naranja",
      "lentejas", "garbanzos", "salmon", "embutido"
    ],
    priceFactor: Number(process.env.EROSKI_PRICE_FACTOR || 1.02),
    activa: true
  }
];

function getActiveSupermarketSources() {
  return supermarketSources.filter(function (source) {
    return source.activa === true;
  });
}

module.exports = {
  supermarketSources: supermarketSources,
  getActiveSupermarketSources: getActiveSupermarketSources
};