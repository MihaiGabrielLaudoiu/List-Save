function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  let text = String(value).toLowerCase().trim();
  text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  text = text.replace(/[^a-z0-9\s]/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

function applySynonyms(text) {
  let normalized = text;
  const replacements = [
    { from: /\bpancasa\b/g, to: "pan" },
    { from: /\bpan de molde\b/g, to: "pan molde" },
    { from: /\bleche entera\b/g, to: "leche" },
    { from: /\bhuevos?\b/g, to: "huevo" },
    { from: /\btomates?\b/g, to: "tomate" },
    { from: /\bcebollas?\b/g, to: "cebolla" },
    { from: /\bpepinillos?\b/g, to: "pepinillo" },
    { from: /\bpepinos?\b/g, to: "pepino" },
    { from: /\byoghurts?\b/g, to: "yogur" },
    { from: /\byogures\b/g, to: "yogur" },
    { from: /\bfideos?\b/g, to: "pasta" },
    { from: /\bespaguet\w*\b/g, to: "pasta" },
    { from: /\bmacarrones?\b/g, to: "pasta" },
    { from: /\baceite de oliva\b/g, to: "aceite oliva" },
    { from: /\baceite girasol\b/g, to: "aceite girasol" },
    { from: /\bvinagres?\b/g, to: "vinagre" }
  ];

  replacements.forEach(function (rule) {
    normalized = normalized.replace(rule.from, rule.to);
  });

  return normalized;
}

var CANONICAL_CATEGORIES = {
  "lacteos": ["leche", "yogur", "mantequilla", "queso", "nata", "batido", "kefir", "cuajada"],
  "bebidas": ["agua", "refresco", "zumo", "cerveza", "cola", "tonica"],
  "panaderia": ["pan", "bolleria", "croissant", "galleta", "tostada", "harina"],
  "fruta-verdura": ["tomate", "cebolla", "platano", "manzana", "pera", "naranja", "patata", "lechuga", "zanahoria", "pepino", "calabacin", "berenjena", "pimiento", "ajo", "sandia", "melon", "uva", "kiwi", "limon", "mandarina", "fresa"],
  "carnes": ["pollo", "ternera", "cerdo", "pavo", "conejo", "cordero", "salmon", "atun", "pescado", "lomo", "jamon", "embutido"],
  "huevos": ["huevo"],
  "higiene": ["papel", "higienico", "champu", "gel", "desodorante", "dentifrico"],
  "limpieza": ["lavavajillas", "detergente", "lejia", "suavizante", "fregasuelos"],
  "arroces-pasta": ["arroz", "pasta", "fideo", "lenteja", "garbanzo", "alubia"],
  "aceites-vinagres": ["aceite", "vinagre", "sal", "ketchup", "mayonesa", "salsa"],
  "conservas": ["conserva", "bonito", "sardina", "esparrago"],
  "congelados": ["congelado", "helado", "pizza"],
  "encurtidos": ["pepinillo", "aceituna"],
  "desayuno": ["azucar", "cafe", "te", "cereal", "miel", "mermelada"],
  "mascota": ["mascota", "perro", "gato", "pienso"],
  "bebe": ["bebe", "pañal", "papilla"]
};

function detectCategory(normalizedName) {
  var keys = Object.keys(CANONICAL_CATEGORIES);
  for (var i = 0; i < keys.length; i++) {
    var cat = keys[i];
    var words = CANONICAL_CATEGORIES[cat];
    for (var j = 0; j < words.length; j++) {
      if (normalizedName.includes(words[j])) {
        return cat;
      }
    }
  }
  return "otros";
}

function mapCanonicalCategoryFromBlob(blob) {
  if (!blob) return null;
  const t = applySynonyms(normalizeText(blob));
  const nameOnly = applySynonyms(normalizeText(blob.split("|").pop() || blob));
  const classify = nameOnly.length > 2 ? nameOnly : t;
  if (/leche|yogur|mantequilla|queso|nata|batido|lacteo|emmental|cheddar|ricotta|requeson|kefir|cuajada/.test(classify)) {
    return "lacteos";
  }
  if (/refresco|zumo|jugo|cerveza|bebida|cola|nestea|isotonic|energ[ei]tica|tonica|limonada/.test(classify)) {
    return "bebidas";
  }
  if (/\bagua\b/.test(classify) && !/lavavajillas|agua oxigenada|agua destilada limpieza/.test(classify)) {
    return "bebidas";
  }
  if (/pan|bolleria|brioche|croissant|galleta|tostada|harina/.test(classify)) {
    return "panaderia";
  }
  if (/manzana|pera|platano|naranja|fruta|verdura|hortaliza|ensalada|patata|tomate|cebolla|pepino|lechuga|zanahoria|calabacin|berenjena|pimiento|ajo|sandia|melon|uva|kiwi|limon|mandarina|fresa|cereza|cerezal/.test(classify)) {
    return "fruta-verdura";
  }
  if (/pollo|ternera|cerdo|pavo|conejo|cordero|carne|hamburguesa|salchicha|salmon|atun|pescado|marisco|lomo|jamon|embutido/.test(classify)) {
    return "carnes";
  }
  if (/huevo/.test(classify)) {
    return "huevos";
  }
  if (/papel|higienico|panuelo|pañuelo|dentifrico|pasta de dientes|gel de ducha|champu|jabon de manos|desodorante|colonia|afeitado|crema hidratante|maquillaje/.test(classify)) {
    return "higiene";
  }
  if (/lavavajillas|detergente|lejia|suavizante|limpieza|fregasuelos|desinfectante|bayeta|lavadora/.test(classify)) {
    return "limpieza";
  }
  if (/arroz|pasta|fideo|lenteja|garbanzo|alubia|cous|quinoa|semola|fideua/.test(classify)) {
    return "arroces-pasta";
  }
  if (/aceite|vinagre|sal marina|sal gorda|sal fina|ketchup|mayonesa|mostaza|salsa/.test(classify)) {
    return "aceites-vinagres";
  }
  if (/conserva|tomate\s+tritur|tomate\s+frito|bonito|sardina|legumbre\s+conserv|esparrago/.test(classify)) {
    return "conservas";
  }
  if (/congelad|helado|hielo|pizza\s+congel|verdura\s+congel|pescado\s+congel/.test(classify)) {
    return "congelados";
  }
  if (/pepinillo|encurtido|aceituna|pickles/.test(classify)) {
    return "encurtidos";
  }
  if (/azucar|cafe|te|cacao|mermelada|miel|cereal|cereales|galleta\s+desayuno/.test(classify)) {
    return "desayuno";
  }
  if (/mascota|perro|gato|pienso/.test(classify)) {
    return "mascota";
  }
  if (/bebe|pañal|papilla/.test(classify)) {
    return "bebe";
  }
  return null;
}

function slugifyCategoryLabel(label) {
  if (!label) {
    return null;
  }
  return normalizeText(label).replace(/\s+/g, "-");
}

function normalizeIncomingProductCategories(prod) {
  const out = Object.assign({}, prod);
  const blob = [out.categoria, out.subcategoria, out.nombre].filter(Boolean).join(" ");
  const canon = mapCanonicalCategoryFromBlob(blob);
  if (canon) {
    out.categoria = canon;
  } else if (out.categoria) {
    out.categoria = normalizeText(out.categoria).replace(/\s+/g, "-");
  }
  if (out.subcategoria) {
    out.subcategoria = slugifyCategoryLabel(out.subcategoria);
  }
  return out;
}

function emojiByProductName(name) {
  const normalizedName = applySynonyms(normalizeText(name));

  if (normalizedName.includes("pepinillo") || normalizedName.includes("encurtido")) {
    return "🥒";
  }

  if (normalizedName.includes("pepino") || normalizedName.includes("zanahoria") || normalizedName.includes("platano")) {
    return "🥕";
  }

  if (normalizedName.includes("pollo") || normalizedName.includes("carne")) {
    return "🍗";
  }

  if (normalizedName.includes("agua")) {
    return "💧";
  }

  if (normalizedName.includes("papel") || normalizedName.includes("higienico")) {
    return "🧻";
  }

  if (normalizedName.includes("lavavajillas")) {
    return "🧽";
  }

  if (normalizedName.includes("leche") || normalizedName.includes("yogur") || normalizedName.includes("mantequilla")) {
    return "🥛";
  }

  if (normalizedName.includes("pan") || normalizedName.includes("galleta")) {
    return "🍞";
  }

  if (normalizedName.includes("huevo")) {
    return "🥚";
  }

  if (normalizedName.includes("arroz")) {
    return "🍚";
  }

  if (normalizedName.includes("pasta")) {
    return "🍝";
  }

  if (normalizedName.includes("manzana") || normalizedName.includes("fruta") || normalizedName.includes("tomate") || normalizedName.includes("cebolla")) {
    return "🍎";
  }

  return "🛒";
}

function buildComparableName(name, brand) {
  const normalizedName = applySynonyms(normalizeText(name));
  const normalizedBrand = normalizeText(brand);
  const brandTokens = normalizedBrand.split(" ").filter(function (token) {
    return token.length > 2;
  });

  const baseTokens = normalizedName.split(" ").filter(function (token) {
    if (token.length <= 2) {
      return false;
    }

    if (token === "marca") {
      return false;
    }

    if (brandTokens.includes(token)) {
      return false;
    }

    return true;
  });

  if (baseTokens.length === 0) {
    return normalizedName;
  }

  return baseTokens.join(" ");
}

function buildComparableKey(product) {
  const comparableName = buildComparableName(product.nombre, product.marca);
  const category = detectCategory(comparableName);
  return "cat:" + category + "|name:" + comparableName;
}

function resolveImage(product) {
  const image = product.imagen;

  if (!image) {
    return "";
  }

  if (String(image).startsWith("http://") || String(image).startsWith("https://") || String(image).startsWith("assets/") || String(image).startsWith("/")) {
    return image;
  }

  return "assets/images/" + image;
}

function enrichProductData(product) {
  const comparableName = buildComparableName(product.nombre, product.marca);
  const category = detectCategory(comparableName);
  const comparableKey = buildComparableKey(product);
  const emoji = emojiByProductName(product.nombre);
  const resolvedImage = resolveImage(product);

  return {
    id_producto: product.id_producto,
    id_producto_tienda: product.id_producto_tienda,
    nombre: product.nombre,
    marca: product.marca,
    imagen: product.imagen,
    imagen_resuelta: resolvedImage,
    emoji_sugerido: emoji,
    categoria: product.categoria || category,
    categoria_normalizada: category,
    subcategoria: product.subcategoria || null,
    nombre_comparable: comparableName,
    clave_comparable: comparableKey,
    unidad_medida: product.unidad_medida,
    cantidad_unidad: product.cantidad_unidad,
    formato: product.formato,
    supermercado: product.supermercado,
    nombre_supermercado: product.nombre_supermercado,
    precio_actual: product.precio_actual != null ? product.precio_actual : product.mejor_precio,
    precio_oferta: product.precio_oferta,
    precio_referencia: product.precio_referencia,
    unidad_referencia: product.unidad_referencia,
    mejor_precio: product.mejor_precio != null ? product.mejor_precio : product.precio_actual,
    max_precio_tiendas: product.max_precio_tiendas != null ? product.max_precio_tiendas : null,
    fecha_extraccion: product.fecha_extraccion
  };
}

module.exports = {
  normalizeText,
  enrichProductData,
  buildComparableKey,
  normalizeIncomingProductCategories,
  mapCanonicalCategoryFromBlob,
  slugifyCategoryLabel
};