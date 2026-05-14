// Logica de la pagina de productos
// Carga el catalogo, los mejores precios y gestiona filtros de busqueda
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector(".products-search__input");
    const productsGrid = document.querySelector(".all-products__grid");
    const featuredGrid = document.querySelector(".featured-products__grid");
    const supermarketsGrid = document.getElementById("supermarket-filter-bar");
    const filterButtons = document.querySelectorAll(".filter-button");
    const categorySelect = document.getElementById("category-filter");
    const supermarketSelect = document.getElementById("supermarket-filter");
    const paginationEl = document.querySelector(".all-products__pagination");

    let allProducts = [];
    let featuredProducts = [];
    let activeFilter = "all";
    let catalogMeta = null;
    const subcategorySelect = document.getElementById("subcategory-filter");
    const marcaSelect = document.getElementById("marca-filter");
    const priceMinEl = document.getElementById("price-min");
    const priceMaxEl = document.getElementById("price-max");
    const sortSelect = document.getElementById("sort-filter");
    const skeletonEl = document.getElementById("products-skeleton");

    let catalogPage = 1;
    const catalogPageSize = 24;
    const bulkFetchLimit = 500;
    let catalogTotalPages = 1;
    let catalogTotal = 0;
    let searchDebounceTimer = null;

    async function productsT(keyPath) {
        const lang = SessionManager.getCurrentLanguage();
        const tr = await TranslationManager.loadTranslations(lang);
        return TranslationManager.getTranslatedValue(tr, keyPath.split(".")) || keyPath;
    }

    function formatPriceEs(value) {
        const n = Number(value);
        if (!n || isNaN(n)) {
            return "";
        }
        return n.toFixed(2).replace(".", ",");
    }

    function normalizeUnitLabel(unit) {
        if (!unit) {
            return "";
        }
        const u = String(unit).trim().toLowerCase();
        if (u === "kg" || u.indexOf("kilo") >= 0) {
            return "kg";
        }
        if (u === "l" || u === "litro" || u === "litros") {
            return "L";
        }
        if (u === "100g") {
            return "100 g";
        }
        if (u === "100ml") {
            return "100 ml";
        }
        if (u === "ud") {
            return "ud";
        }
        return String(unit).trim();
    }

    function computeFallbackUnitPrice(fi) {
        const p = Number(fi.mejor_precio);
        if (!p || p <= 0 || isNaN(p)) {
            return null;
        }
        const q = Number(fi.cantidad_unidad);
        const u = String(fi.unidad_medida || "").toLowerCase();
        if (!q || q <= 0 || isNaN(q) || !u) {
            return null;
        }
        if (u === "kg") {
            return { v: p / q, unit: "kg" };
        }
        if (u === "g") {
            return { v: p / (q / 1000), unit: "kg" };
        }
        if (u === "l") {
            return { v: p / q, unit: "L" };
        }
        if (u === "ml") {
            return { v: p / (q / 1000), unit: "L" };
        }
        if (u === "cl") {
            return { v: p / (q / 100), unit: "L" };
        }
        if (u === "ud") {
            return { v: p / q, unit: "ud" };
        }
        return null;
    }

    function resolveUnitPriceForCard(fi) {
        if (!fi) {
            return null;
        }
        let ref = Number(fi.precio_referencia);
        let unit = fi.unidad_referencia != null ? String(fi.unidad_referencia).trim() : "";
        if (ref > 0 && !isNaN(ref) && unit) {
            return { price: ref, unit: normalizeUnitLabel(unit) };
        }
        const fb = computeFallbackUnitPrice(fi);
        if (fb && fb.v > 0 && !isNaN(fb.v)) {
            return { price: fb.v, unit: fb.unit };
        }
        return null;
    }

    function buildUnitPriceMarkup(fi, cssClass) {
        const info = resolveUnitPriceForCard(fi);
        if (!info) {
            return "";
        }
        const priceStr = formatPriceEs(info.price);
        if (!priceStr) {
            return "";
        }
        const safeUnit = escapeHtml(info.unit);
        const text = productsPageT(
            "unit_price_line",
            "{{price}} € / {{unit}}",
            { price: priceStr, unit: safeUnit }
        );
        return '<p class="' + cssClass + '">' + text + "</p>";
    }

    // Escapa caracteres HTML para evitar inyeccion de codigo en el DOM
    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function getProductEmoji(productName, category) {
        var name = String(productName || "").toLowerCase();
        var cat = String(category || "").toLowerCase();

        if (name.includes("leche") || name.includes("yogur") || name.includes("nata") || name.includes("kefir") || name.includes("cuajada") || name.includes("batido")) {
            return "🥛";
        }
        if (name.includes("queso")) {
            return "🧀";
        }
        if (name.includes("mantequilla") || name.includes("margarina")) {
            return "🧈";
        }
        if (name.includes("pan") || name.includes("galleta") || name.includes("croissant") || name.includes("bolleria")) {
            return "🍞";
        }
        if (name.includes("huevo")) {
            return "🥚";
        }
        if (name.includes("manzana") || name.includes("pera") || name.includes("fruta")) {
            return "🍎";
        }
        if (name.includes("naranja") || name.includes("zumo") || name.includes("mandarina") || name.includes("limon")) {
            return "🍊";
        }
        if (name.includes("platano") || name.includes("banana") || name.includes("banana")) {
            return "🍌";
        }
        if (name.includes("arroz")) {
            return "🍚";
        }
        if (name.includes("pasta") || name.includes("espagueti") || name.includes("fideo") || name.includes("macarron")) {
            return "🍝";
        }
        if (name.includes("lenteja") || name.includes("garbanzo") || name.includes("alubia") || name.includes("legumbre")) {
            return "🫘";
        }
        if (name.includes("tomate") || name.includes("verdura") || name.includes("cebolla") || name.includes("zanahoria") || name.includes("patata") || name.includes("pimiento") || name.includes("lechuga") || name.includes("pepino") || name.includes("ajo") || name.includes("calabacin")) {
            return "🥦";
        }
        if (name.includes("pollo") || name.includes("pavo") || name.includes("cerdo") || name.includes("ternera") || name.includes("carne") || name.includes("lomo") || name.includes("filete")) {
            return "🥩";
        }
        if (name.includes("jamon") || name.includes("embutido") || name.includes("salami") || name.includes("chorizo")) {
            return "🥓";
        }
        if (name.includes("salmon") || name.includes("atun") || name.includes("pescado") || name.includes("sardina")) {
            return "🐟";
        }
        if (name.includes("agua")) {
            return "💧";
        }
        if (name.includes("cerveza")) {
            return "🍺";
        }
        if (name.includes("refresco") || name.includes("cola")) {
            return "🥤";
        }
        if (name.includes("aceite")) {
            return "🫒";
        }
        if (name.includes(" vinagre") || name.includes("vinagre")) {
            return "🫙";
        }
        if (name.includes("sal")) {
            return "🧂";
        }
        if (name.includes("azucar") || name.includes("mermelada") || name.includes("miel")) {
            return "🍯";
        }
        if (name.includes("cafe") || name.includes("te")) {
            return "☕";
        }
        if (name.includes("cereal")) {
            return "🥣";
        }
        if (name.includes("detergente") || name.includes("lavavajillas") || name.includes("lejia") || name.includes("fregasuelos") || name.includes("limpieza")) {
            return "🧹";
        }
        if (name.includes("champu") || name.includes("gel") || name.includes("desodorante") || name.includes("pasta de diente") || name.includes("dentifrico") || name.includes("higiene")) {
            return "🧴";
        }
        if (name.includes("papel")) {
            return "🧻";
        }
        if (name.includes("congelado") || name.includes("pizza") || name.includes("helado")) {
            return "🧊";
        }
        if (name.includes("conserva") || name.includes("lat")) {
            return "🥫";
        }
        if (name.includes("aceituna") || name.includes("encurtido") || name.includes("pepinillo")) {
            return "🫒";
        }
        if (name.includes("bebe") || name.includes("panal") || name.includes("pañal") || name.includes("papilla")) {
            return "👶";
        }
        if (name.includes("mascota") || name.includes("pienso") || name.includes("perro") || name.includes("gato")) {
            return "🐾";
        }

        if (cat.includes("lacteo")) return "🥛";
        if (cat.includes("carn")) return "🥩";
        if (cat.includes("fruta") || cat.includes("verdura")) return "🥦";
        if (cat.includes("panad")) return "🍞";
        if (cat.includes("bebid")) return "🥤";
        if (cat.includes("higien")) return "🧴";
        if (cat.includes("limpi")) return "🧹";
        if (cat.includes("arroz") || cat.includes("pasta")) return "🍝";
        if (cat.includes("aceite") || cat.includes("vinagr")) return "🫒";
        if (cat.includes("congel")) return "🧊";
        if (cat.includes("conserva")) return "🥫";
        if (cat.includes("desayuno")) return "☕";
        if (cat.includes("huev")) return "🥚";
        if (cat.includes("bebe")) return "👶";
        if (cat.includes("mascota")) return "🐾";
        if (cat.includes("encurtido")) return "🫒";

        return "🛒";
    }

    // Construye la ruta correcta de la imagen del producto
    // Las imagenes locales van en assets/images/, las externas se usan tal cual
    function resolveProductImage(imageValue) {
        if (!imageValue) {
            return "";
        }

        if (imageValue.startsWith("http://") || imageValue.startsWith("https://") || imageValue.startsWith("assets/") || imageValue.startsWith("/")) {
            return imageValue;
        }

        return "assets/images/" + imageValue;
    }

    // Busca los datos visuales del supermercado en el mapa que cargamos al inicio
    function getSupermarketVisual(supermarketName) {
        const visual = supermarketVisuals[supermarketName];

        if (visual) {
            return visual;
        }

        return {
            image: "",
            emoji: "🏬",
            accent: "#475569"
        };
    }

    // Convierte el array de fuentes en un mapa indexado por nombre de supermercado
    // Asi luego podemos buscar rapido con supermarketVisuals[nombre]
    function updateSupermarketVisuals(sources) {
        const visuals = {};

        sources.forEach(function (source) {
            visuals[source.nombre] = {
                image: source.logo || "",
                emoji: source.emoji || "🏬",
                accent: source.color || "#475569"
            };
        });

        supermarketVisuals = visuals;
    }

    // Genera el HTML de la etiqueta del supermercado (con logo o con emoji)
    function createSupermarketBadge(supermarketName) {
        const safeName = escapeHtml(supermarketName || "Supermercado");
        const visual = getSupermarketVisual(supermarketName);

        if (visual.image) {
            return "<span class=\"supermarket-badge\" style=\"--supermarket-accent:" + visual.accent + "\">" +
                "<img src=\"" + visual.image + "\" alt=\"" + safeName + "\" class=\"supermarket-badge__image\">" +
                "<span class=\"supermarket-badge__text\">" + safeName + "</span>" +
                "</span>";
        }

        return "<span class=\"supermarket-badge\" style=\"--supermarket-accent:" + visual.accent + "\">" +
            "<span class=\"supermarket-badge__emoji\">" + visual.emoji + "</span>" +
            "<span class=\"supermarket-badge__text\">" + safeName + "</span>" +
            "</span>";
    }

    // Genera el bloque visual del producto: imagen si tiene, emoji si no
    function createProductVisual(product) {
        let imagePath = "";
        let emoji = "";

        if (product.imagen_resuelta) {
            imagePath = resolveProductImage(product.imagen_resuelta);
        } else {
            imagePath = resolveProductImage(product.imagen);
        }

        if (product.emoji_sugerido) {
            emoji = product.emoji_sugerido;
        } else {
            emoji = getProductEmoji(product.nombre, product.categoria || product.categoria_normalizada);
        }

        const safeName = escapeHtml(product.nombre);

        if (imagePath) {
            return "<div class=\"product-card__media\">" +
                "<img src=\"" + imagePath + "\" alt=\"" + safeName + "\" class=\"product-card__image\">" +
                "</div>";
        }

        return "<div class=\"product-card__media product-card__media--emoji\">" +
            "<span class=\"product-card__emoji\">" + emoji + "</span>" +
            "</div>";
    }

    // Crea un diccionario de productos destacados indexado por id_producto
    // Util para buscar rapido si un producto tiene precio destacado
    function getFeaturedMap() {
        const productMap = {};

        featuredProducts.forEach(function (item) {
            productMap[item.id_producto] = item;
        });

        return productMap;
    }

    // Pinta el resumen de supermercados con cuantos productos tiene cada uno
    function renderSupermarkets(items) {
        if (!supermarketsGrid) {
            return;
        }

        if (items.length === 0) {
            supermarketsGrid.innerHTML = "<p class=\"products-empty\">Todavía no hay supermercados con precios publicados.</p>";
            return;
        }

        const summary = {};

        items.forEach(function (item) {
            const supermarketName = item.supermercado || "Supermercado";

            if (!summary[supermarketName]) {
                summary[supermarketName] = 0;
            }

            summary[supermarketName] = summary[supermarketName] + 1;
        });

        const allBtn = document.createElement("button");
        allBtn.type = "button";
        allBtn.className = "supermarket-filter-chip supermarket-filter-chip--active";
        allBtn.innerHTML = '<i class="fas fa-store"></i> ' + escapeHtml(productsPageT("all_supermarkets", "Todos")) + ' <span class="supermarket-filter-chip__count">' + items.length + '</span>';
        allBtn.addEventListener("click", function () {
            supermarketsGrid.querySelectorAll(".supermarket-filter-chip").forEach(function (c) { c.classList.remove("supermarket-filter-chip--active"); });
            allBtn.classList.add("supermarket-filter-chip--active");
            if (supermarketSelect) {
                supermarketSelect.value = "";
                loadProducts(1);
            }
        });
        supermarketsGrid.innerHTML = "";
        supermarketsGrid.appendChild(allBtn);

        Object.keys(summary).forEach(function (supermarketName) {
            const visual = getSupermarketVisual(supermarketName);
            const safeName = escapeHtml(supermarketName);
            const totalProducts = summary[supermarketName];
            let visualMarkup = '<span class="supermarket-filter-chip__emoji">' + visual.emoji + '</span>';

            if (visual.image) {
                visualMarkup = '<img src="' + visual.image + '" alt="' + safeName + '" class="supermarket-filter-chip__image">';
            }

            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "supermarket-filter-chip";
            btn.style.setProperty("--supermarket-accent", visual.accent);
            btn.innerHTML = visualMarkup + '<span class="supermarket-filter-chip__name">' + safeName + '</span> <span class="supermarket-filter-chip__count">' + totalProducts + '</span>';
            btn.addEventListener("click", function () {
                supermarketsGrid.querySelectorAll(".supermarket-filter-chip").forEach(function (c) { c.classList.remove("supermarket-filter-chip--active"); });
                btn.classList.add("supermarket-filter-chip--active");
                if (supermarketSelect) {
                    var opt = supermarketSelect.querySelector('option[value="' + CSS.escape(supermarketName) + '"]');
                    if (opt) {
                        supermarketSelect.value = supermarketName;
                    } else {
                        var realSlug = "";
                        if (catalogMeta && catalogMeta.supermarkets) {
                            catalogMeta.supermarkets.forEach(function (s) {
                                if (s.nombre_supermercado === supermarketName) {
                                    realSlug = s.slug;
                                }
                            });
                        }
                        supermarketSelect.value = realSlug || supermarketName;
                    }
                    loadProducts(1);
                }
            });
            supermarketsGrid.appendChild(btn);
        });
    }

    // Muestra en el grid los productos con mejor precio (hasta 6 tarjetas)
    function renderFeatured(items) {
        if (!featuredGrid) {
            return;
        }

        if (items.length === 0) {
            featuredGrid.innerHTML = "<p class=\"products-empty\">No hay datos de precios todavía.</p>";
            return;
        }

        const html = items.slice(0, 6).map(function (item) {
            const safeName = escapeHtml(item.nombre);
            const safeBrand = escapeHtml(item.marca || "Marca sin especificar");
            const bestPriceStr = formatPriceEs(item.mejor_precio || 0);
            const fromLine = productsPageT("from_price", "Desde {{price}} €", { price: bestPriceStr });
            const unitLine = buildUnitPriceMarkup(item, "featured-card__unit-price");

            return "<article class=\"featured-card\">" +
                createProductVisual(item) +
                "<div class=\"featured-card__content\">" +
                createSupermarketBadge(item.supermercado) +
                "<h3 class=\"featured-card__title\">" + safeName + "</h3>" +
                "<p class=\"featured-card__brand\">" + safeBrand + "</p>" +
                "<p class=\"featured-card__price\">" + fromLine + "</p>" +
                unitLine +
                "</div>" +
                "</article>";
        }).join("");

        featuredGrid.innerHTML = html;
    }

    function usesClientSupermarketFilter() {
        return false;
    }

    function productsPageT(key, fallback, vars) {
        const lang =
            typeof SessionManager !== "undefined" && SessionManager.getCurrentLanguage
                ? SessionManager.getCurrentLanguage()
                : "es";
        const cache =
            typeof TranslationManager !== "undefined" && TranslationManager.translationsCache
                ? TranslationManager.translationsCache[lang]
                : null;
        let text =
            cache && TranslationManager.getTranslatedValue
                ? TranslationManager.getTranslatedValue(cache, ["products_page", key])
                : null;
        text = text || fallback;
        if (vars) {
            Object.keys(vars).forEach(function (k) {
                text = text.split("{{" + k + "}}").join(String(vars[k]));
            });
        }
        return text;
    }

    function fillCategoryOptions(categories) {
        if (!categorySelect || !categories || categories.length === 0) {
            return;
        }

        const current = categorySelect.value;
        let html =
            '<option value="" data-i18n="products_page.all_categories">Todas las categorias</option>';

        categories.forEach(function (cat) {
            html +=
                '<option value="' +
                escapeHtml(cat) +
                '">' +
                escapeHtml(cat) +
                "</option>";
        });

        categorySelect.innerHTML = html;

        if (current) {
            categorySelect.value = current;
        }

        if (typeof TranslationManager !== "undefined" && TranslationManager.translatePage) {
            TranslationManager.translatePage();
        }
        fillSubcategoryOptions();
    }

    function renderPagination() {
        if (!paginationEl) {
            return;
        }

        if (usesClientSupermarketFilter()) {
            paginationEl.innerHTML = "";
            paginationEl.hidden = true;
            return;
        }

        paginationEl.hidden = false;

        if (catalogTotalPages <= 1) {
            paginationEl.innerHTML =
                '<p class="products-pagination__summary" data-i18n="products_page.pagination_single">' +
                "Todos los resultados caben en esta pagina." +
                "</p>";
            if (typeof TranslationManager !== "undefined" && TranslationManager.translatePage) {
                TranslationManager.translatePage();
            }
            return;
        }

        const prevDisabled = catalogPage <= 1;
        const nextDisabled = catalogPage >= catalogTotalPages;

        paginationEl.innerHTML =
            '<nav class="products-pagination" aria-label="Paginacion">' +
            '<button type="button" class="button button--secondary products-pagination__prev"' +
            (prevDisabled ? " disabled" : "") +
            ' data-i18n="products_page.pagination_prev">Anterior</button>' +
            '<span class="products-pagination__info" id="pagination-info"></span>' +
            '<button type="button" class="button button--secondary products-pagination__next"' +
            (nextDisabled ? " disabled" : "") +
            ' data-i18n="products_page.pagination_next">Siguiente</button>' +
            "</nav>";

        const infoEl = document.getElementById("pagination-info");
        if (infoEl) {
            infoEl.textContent = productsPageT(
                "pagination_info",
                "Pagina {{page}} de {{totalPages}} — {{total}} productos",
                {
                    page: catalogPage,
                    totalPages: catalogTotalPages,
                    total: catalogTotal
                }
            );
        }

        if (typeof TranslationManager !== "undefined" && TranslationManager.translatePage) {
            TranslationManager.translatePage();
        }

        const prevBtn = paginationEl.querySelector(".products-pagination__prev");
        const nextBtn = paginationEl.querySelector(".products-pagination__next");

        if (prevBtn && !prevDisabled) {
            prevBtn.addEventListener("click", function () {
                loadProducts(catalogPage - 1);
            });
        }

        if (nextBtn && !nextDisabled) {
            nextBtn.addEventListener("click", function () {
                loadProducts(catalogPage + 1);
            });
        }
    }

    // Filtra en cliente solo por supermercado (mejor precio); ofertas y busqueda van por API
    function getFilteredProducts() {
        if (!usesClientSupermarketFilter()) {
            return allProducts;
        }

        const featuredMap = getFeaturedMap();
        const selectedSupermarket = supermarketSelect.value.trim();

        return allProducts.filter(function (product) {
            const featuredInfo = featuredMap[product.id_producto];
            return featuredInfo && featuredInfo.supermercado === selectedSupermarket;
        });
    }

    // Pone el listener de 'Anadir a mi lista' en cada tarjeta de producto
    function attachAddToListEvents() {
        const buttons = document.querySelectorAll(".add-list-button");

        buttons.forEach(function (button) {
            button.addEventListener("click", async function () {
                const productId = Number(button.getAttribute("data-product-id"));

                try {
                    var body = {
                        product_id: productId,
                        cantidad: 1
                    };
                    if (typeof ListContext !== "undefined") {
                        var cid = ListContext.getCabeceraId();
                        if (cid) {
                            body.cabecera_id = cid;
                        }
                    }
                    await ApiClient.post("/api/lists/mine", body);
                    showProductsToast(await productsT("products_page.list_add_ok"));
                } catch (error) {
                    if (error.message === "No autenticado") {
                        window.location.href = "./login.html";
                        return;
                    }

                    await AppModal.alert(await productsT("products_page.list_add_err"));
                }
            });
        });
    }

    // Renderiza el grid principal con los productos filtrados
    function renderProducts() {
        if (!productsGrid) {
            return;
        }

        const featuredMap = getFeaturedMap();
        const filteredProducts = getFilteredProducts();

        if (filteredProducts.length === 0) {
            productsGrid.innerHTML = "<p class=\"products-empty\">No se han encontrado productos con ese criterio.</p>";
            return;
        }

        const html = filteredProducts.map(function (product) {
            const safeName = escapeHtml(product.nombre);
            const safeBrand = escapeHtml(product.marca || "Marca sin especificar");
            let formatoLine = "";
            if (product.formato) {
                formatoLine = "<p class=\"product-card__meta\">" + escapeHtml(product.formato) + "</p>";
            } else if (product.cantidad_unidad && product.unidad_medida) {
                formatoLine =
                    "<p class=\"product-card__meta\">" +
                    escapeHtml(String(product.cantidad_unidad) + " " + product.unidad_medida) +
                    "</p>";
            }
            let featuredInfo = featuredMap[product.id_producto];
            if (!featuredInfo && (product.mejor_precio != null || product.precio_actual != null)) {
                const mp = product.mejor_precio != null ? product.mejor_precio : product.precio_actual;
                featuredInfo = {
                    mejor_precio: mp,
                    supermercado: product.nombre_supermercado || null,
                    precio_referencia: product.precio_referencia,
                    unidad_referencia: product.unidad_referencia,
                    cantidad_unidad: product.cantidad_unidad,
                    unidad_medida: product.unidad_medida,
                    precio_oferta: product.precio_oferta
                };
            }
            let priceMarkup = "<p class=\"product-card__meta\">Precio pendiente de actualizar</p>";
            let categoryMarkup = "";

            if (product.categoria_normalizada) {
                categoryMarkup = "<p class=\"product-card__meta\">Categoria: " + escapeHtml(product.categoria_normalizada) + "</p>";
            }

            if (featuredInfo) {
                const mainPrice = formatPriceEs(featuredInfo.mejor_precio || 0);
                const unitLine = buildUnitPriceMarkup(featuredInfo, "product-card__unit-price");
                const offerBadge =
                    featuredInfo.precio_oferta != null && featuredInfo.precio_oferta !== ""
                        ? '<span class="product-card__offer-badge">Oferta</span>'
                        : "";
                priceMarkup =
                    '<div class="product-card__price-block">' +
                    offerBadge +
                    '<div class="product-card__price-row">' +
                    createSupermarketBadge(featuredInfo.supermercado) +
                    '<p class="product-card__price">' +
                    productsPageT("pack_price", "{{price}} €", { price: mainPrice }) +
                    "</p>" +
                    "</div>" +
                    unitLine +
                    "</div>";
            }

            const favSet = JSON.parse(localStorage.getItem("ls_fav_products") || "[]");
            const isFav = favSet.indexOf(product.id_producto) >= 0;
            const favIcon = isFav ? "fas fa-heart" : "far fa-heart";

            return "<article class=\"product-card product-card--catalog\" data-product-id=\"" + product.id_producto + "\">" +
                "<button type=\"button\" class=\"product-card__fav\" data-fav-id=\"" +
                product.id_producto +
                "\" aria-label=\"Favorito\"><i class=\"" +
                favIcon +
                "\"></i></button>" +
                createProductVisual(product) +
                "<div class=\"product-card__content\">" +
                priceMarkup +
                "<h3 class=\"product-card__title\">" + safeName + "</h3>" +
                "<p class=\"product-card__brand\">" + safeBrand + "</p>" +
                categoryMarkup +
                formatoLine +
                "<button class=\"button button--primary add-list-button\" data-product-id=\"" + product.id_producto + "\">Añadir a mi lista</button>" +
                "</div>" +
                "</article>";
        }).join("");

        productsGrid.innerHTML = html;
        attachAddToListEvents();
        document.querySelectorAll(".product-card__fav").forEach(function (btn) {
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                const id = Number(btn.getAttribute("data-fav-id"));
                let arr = JSON.parse(localStorage.getItem("ls_fav_products") || "[]");
                const idx = arr.indexOf(id);
                if (idx >= 0) {
                    arr.splice(idx, 1);
                } else {
                    arr.push(id);
                }
                localStorage.setItem("ls_fav_products", JSON.stringify(arr));
                renderProducts();
            });
        });
    }

    // Rellena el select de supermercados con los que aparecen en los precios destacados
    function renderSupermarketOptions(items) {
        if (!supermarketSelect) {
            return;
        }

        const supermarkets = [];

        items.forEach(function (item) {
            if (item.supermercado && supermarkets.indexOf(item.supermercado) === -1) {
                supermarkets.push(item.supermercado);
            }
        });

        const options = ["<option value=\"\">Todos los supermercados</option>"];

        supermarkets.forEach(function (supermarketName) {
            options.push("<option value=\"" + escapeHtml(supermarketName) + "\">" + escapeHtml(supermarketName) + "</option>");
        });

        supermarketSelect.innerHTML = options.join("");
    }

    async function loadMetaFilters() {
        try {
            catalogMeta = await ApiClient.get("/api/products/catalog-meta");
            if (marcaSelect && catalogMeta.marcas) {
                marcaSelect.innerHTML =
                    "<option value=\"\">Todas las marcas</option>" +
                    catalogMeta.marcas
                        .map(function (m) {
                            return "<option value=\"" + escapeHtml(m) + "\">" + escapeHtml(m) + "</option>";
                        })
                        .join("");
            }
            if (supermarketSelect && catalogMeta.supermarkets) {
                supermarketSelect.innerHTML =
                    "<option value=\"\">Todos los supermercados</option>" +
                    catalogMeta.supermarkets
                        .map(function (s) {
                            return (
                                "<option value=\"" +
                                escapeHtml(s.slug) +
                                "\">" +
                                escapeHtml(s.nombre_supermercado) +
                                "</option>"
                            );
                        })
                        .join("");
            }
            fillSubcategoryOptions();
        } catch (err) {
            console.error("No se pudieron cargar metadatos del catalogo", err);
        }
    }

    function fillSubcategoryOptions() {
        if (!subcategorySelect || !catalogMeta || !categorySelect) {
            return;
        }
        const cat = categorySelect.value;
        const subs =
            cat && catalogMeta.subcategoriesByCat && catalogMeta.subcategoriesByCat[cat]
                ? catalogMeta.subcategoriesByCat[cat]
                : [];
        subcategorySelect.innerHTML =
            "<option value=\"\">Todas las subcategorias</option>" +
            subs
                .map(function (s) {
                    return "<option value=\"" + escapeHtml(s) + "\">" + escapeHtml(s) + "</option>";
                })
                .join("");
    }

    function showProductsToast(msg) {
        let el = document.getElementById("toast-products");
        if (!el) {
            el = document.createElement("div");
            el.id = "toast-products";
            el.className = "toast-ok";
            el.setAttribute("role", "status");
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.classList.add("toast-ok--show");
        clearTimeout(showProductsToast._t);
        showProductsToast._t = setTimeout(function () {
            el.classList.remove("toast-ok--show");
        }, 2000);
    }

    async function loadProducts(page) {
        const targetPage = page != null && !isNaN(Number(page)) ? Number(page) : catalogPage;
        catalogPage = targetPage < 1 ? 1 : targetPage;

        const limit = catalogPageSize;
        const params = new URLSearchParams();
        params.set("page", String(catalogPage));
        params.set("limit", String(limit));

        if (searchInput && searchInput.value.trim()) {
            params.set("search", searchInput.value.trim());
        }

        if (categorySelect && categorySelect.value) {
            params.set("category", categorySelect.value);
        }
        if (subcategorySelect && subcategorySelect.value) {
            params.set("subcategory", subcategorySelect.value);
        }
        if (marcaSelect && marcaSelect.value) {
            params.set("marca", marcaSelect.value);
        }
        if (supermarketSelect && supermarketSelect.value) {
            params.set("supermarket", supermarketSelect.value);
        }
        if (priceMinEl && priceMinEl.value !== "") {
            params.set("precio_min", priceMinEl.value);
        }
        if (priceMaxEl && priceMaxEl.value !== "") {
            params.set("precio_max", priceMaxEl.value);
        }
        if (sortSelect && sortSelect.value) {
            params.set("sort", sortSelect.value);
        }

        if (activeFilter === "offers") {
            params.set("only_with_price", "1");
        }

        const endpoint = "/api/products/catalog?" + params.toString();

        if (skeletonEl) {
            skeletonEl.hidden = false;
            skeletonEl.innerHTML = '<div class="products-skeleton__grid">' + Array(8)
                .fill('<div class="products-skeleton__card"></div>')
                .join("") + "</div>";
        }
        if (productsGrid) {
            productsGrid.style.opacity = "0.5";
        }

        try {
            const response = await ApiClient.get(endpoint);
            allProducts = response.products || [];
            catalogTotal = Number(response.total) || 0;
            catalogTotalPages = Number(response.totalPages) || 1;
            catalogPage = Number(response.page) || catalogPage;

            if (response.categories) {
                fillCategoryOptions(response.categories);
            }

            renderPagination();
            renderProducts();
        } catch (error) {
            console.error("Error al cargar productos:", error);
            if (productsGrid) {
                productsGrid.innerHTML = "<p class=\"products-empty\">No se pudieron cargar los productos.</p>";
            }
            if (paginationEl) {
                paginationEl.innerHTML = "";
            }
        } finally {
            if (skeletonEl) {
                skeletonEl.hidden = true;
                skeletonEl.innerHTML = "";
            }
            if (productsGrid) {
                productsGrid.style.opacity = "1";
            }
        }
    }

    function scheduleSearchReload() {
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }
        searchDebounceTimer = setTimeout(function () {
            loadProducts(1);
        }, 250);
    }

    // Carga los mejores precios y tambien actualiza el grid de supermercados
    async function loadFeatured() {
        try {
            const response = await ApiClient.get("/api/products/best-prices");
            featuredProducts = response.prices || [];
            renderFeatured(featuredProducts);
            renderSupermarkets(featuredProducts);
            if (!catalogMeta) {
                renderSupermarketOptions(featuredProducts);
            }
            renderProducts();
        } catch (error) {
            console.error("Error al cargar productos destacados:", error);
            if (featuredGrid) {
                featuredGrid.innerHTML = "<p class=\"products-empty\">No se pudieron cargar los mejores precios.</p>";
            }
        }
    }

    // Descarga los datos visuales de cada supermercado (logo, color, emoji)
    async function loadSources() {
        try {
            const response = await ApiClient.get("/api/products/sources");
            updateSupermarketVisuals(response.sources || []);
        } catch (error) {
            console.error("Error al cargar las fuentes de supermercados:", error);
            supermarketVisuals = {};
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", function () {
            scheduleSearchReload();
        });
    }

    if (categorySelect) {
        categorySelect.addEventListener("change", function () {
            fillSubcategoryOptions();
            loadProducts(1);
        });
    }

    if (subcategorySelect) {
        subcategorySelect.addEventListener("change", function () {
            loadProducts(1);
        });
    }

    if (marcaSelect) {
        marcaSelect.addEventListener("change", function () {
            loadProducts(1);
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", function () {
            loadProducts(1);
        });
    }

    if (priceMinEl) {
        priceMinEl.addEventListener("change", function () {
            loadProducts(1);
        });
    }

    if (priceMaxEl) {
        priceMaxEl.addEventListener("change", function () {
            loadProducts(1);
        });
    }

    if (supermarketSelect) {
        supermarketSelect.addEventListener("change", function () {
            loadProducts(1);
        });
    }

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            filterButtons.forEach(function (item) {
                item.classList.remove("active");
            });

            button.classList.add("active");
            activeFilter = button.getAttribute("data-filter") || "all";
            loadProducts(1);
        });
    });

    // Punto de inicio de la pagina: primero fuentes, luego catalogo, luego precios
    async function initPage() {
        await loadSources();
        await loadMetaFilters();
        await loadProducts(1);
        await loadFeatured();
    }

    initPage();
});
