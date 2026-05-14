document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-main");
    const searchResults = document.getElementById("results-main");
    const priceTableContainer = document.getElementById("price-table-container");
    const priceTable = document.getElementById("price-table");
    const productInfo = document.getElementById("selected-product-info");
    const clearButton = document.getElementById("clear-comparison");
    const noSelectionMsg = document.getElementById("no-selection");

    const syncButton = document.getElementById("sync-prices");
    const syncStatus = document.getElementById("sync-status");

    const subcatChipsRow = document.getElementById("subcat-chips-row");

    const subcatStoreView = document.getElementById("subcat-store-view");
    const subcatStoreGrid = document.getElementById("subcat-store-grid");
    const subcatWinner = document.getElementById("subcat-winner");
    const subcatWinnerBody = document.getElementById("subcat-winner-body");
    const subcatViewTitle = document.getElementById("subcat-view-title");
    const subcatViewBack = document.getElementById("subcat-view-back");

    const FRUIT_RE = /manzana|pl[aá]tano|naranja|pera|uva|mel[oó]n|sand[ií]a/;
    const VEG_RE = /cebolla|tomate|zanahoria|pepino|lechuga|pimiento|calabac[ií]n|patata/;

    let allOptions = [];
    let groupedProducts = {};
    let supermarketVisuals = {};
    let currentCategoryLabel = "";
    let currentSubModeSynthetic = false;
    let activeCategory = "";
    let lastSelectedGroup = null;

    function escapeHtml(value) {
        if (!value) return "";
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function chipMatchesGroup(chipSlug, group) {
        if (!chipSlug) return true;
        const cat = (group.categoria || "").toLowerCase();
        const name = (group.nombre || "").toLowerCase();
        if (chipSlug === "lacteos") return cat.includes("lacteo");
        if (chipSlug === "carnes") return cat.includes("carne");
        if (chipSlug === "panaderia") return cat.includes("panad");
        if (chipSlug === "bebidas") return cat.includes("bebida");
        if (chipSlug === "higiene") return cat.includes("higiene");
        if (chipSlug === "limpieza") return cat.includes("limpieza");
        if (chipSlug === "frutas") {
            return (cat.includes("fruta-verdura") || cat.includes("fruta")) && FRUIT_RE.test(name);
        }
        if (chipSlug === "verduras") {
            return (cat.includes("fruta-verdura") || cat.includes("verdura")) && VEG_RE.test(name);
        }
        return cat.includes(chipSlug);
    }

    function collectCategoriesFromGroups() {
        const set = new Set();
        Object.values(groupedProducts).forEach(function (g) {
            const c = String(g.categoria || g.categoria_normalizada || "").trim();
            if (c) {
                set.add(c);
            }
        });
        return Array.from(set).sort(function (a, b) {
            return a.localeCompare(b, "es");
        });
    }

    function filterGroupsForCategoryLabel(categoryLabel, subLabel) {
        const all = Object.values(groupedProducts);
        let base;
        if (!categoryLabel || categoryLabel === "TODAS") {
            base = all.slice();
        } else {
            const needle = categoryLabel.toLowerCase();
            base = all.filter(function (g) {
                const cat = String(g.categoria || "").toLowerCase();
                const norm = String(g.categoria_normalizada || "").toLowerCase();
                return cat.includes(needle) || norm.includes(needle) || needle.includes(cat);
            });
        }
        if (subLabel) {
            const s = String(subLabel).toLowerCase();
            base = base.filter(function (g) {
                return String(g.subcategoria || "").toLowerCase() === s;
            });
        }
        return base
            .sort(function (a, b) {
                return a.nombre.localeCompare(b.nombre, "es");
            })
            .slice(0, 120);
    }

    function collectSubcategoriesForCategoryLabel(categoryLabel) {
        const set = {};
        if (!categoryLabel || categoryLabel === "TODAS") {
            return [];
        }
        const needle = categoryLabel.toLowerCase();
        Object.values(groupedProducts).forEach(function (g) {
            const cat = String(g.categoria || "").toLowerCase();
            const norm = String(g.categoria_normalizada || "").toLowerCase();
            const match = cat.includes(needle) || norm.includes(needle) || needle.includes(cat);
            if (match && g.subcategoria) {
                set[g.subcategoria] = true;
            }
        });
        return Object.keys(set).sort(function (a, b) {
            return a.localeCompare(b, "es");
        });
    }

    /**
     * Subcategorías reales vienen de Productos.subcategoria (agrupadas en collectSubcategoriesForCategoryLabel).
     * Si no hay filas con subcategoria, inferimos etiquetas cortas desde nombre_comparable/nombre (solo front).
     */
    function inferSyntheticSubForGroup(g) {
        const n = String(g.nombre_comparable || g.nombre || "").toLowerCase();
        const cat = String(g.categoria || "").toLowerCase();
        if (cat.indexOf("lact") >= 0) {
            if (/leche|batido/.test(n)) {
                return "Leche y batidos";
            }
            if (/yogur|yogurt/.test(n)) {
                return "Yogures";
            }
            if (/queso/.test(n)) {
                return "Quesos";
            }
            if (/mantequilla|margarina|nata/.test(n)) {
                return "Mantequilla y nata";
            }
        }
        if (/\b(arroz|lenteja|garbanzo|pasta|fideo)\b/.test(n)) {
            return "Arroz, pasta y legumbres";
        }
        const words = String(g.nombre_comparable || g.nombre || "Otros").trim().split(/\s+/);
        const head = (words[0] || "otros").replace(/[^a-záéíóúüñ0-9-]/gi, "");
        if (!head) {
            return "Otros";
        }
        return head.charAt(0).toUpperCase() + head.slice(1).toLowerCase();
    }

    function collectAllSubcategoryLabels() {
        const set = {};
        Object.values(groupedProducts).forEach(function (g) {
            const raw = g.subcategoria && String(g.subcategoria).trim();
            const label = raw || inferSyntheticSubForGroup(g);
            if (label) {
                set[label] = true;
            }
        });
        return Object.keys(set).sort(function (a, b) {
            return a.localeCompare(b, "es");
        });
    }

    function getSubcategoriesForWizard(cat) {
        if (cat === "TODAS") {
            return { labels: collectAllSubcategoryLabels(), synthetic: true };
        }
        const db = collectSubcategoriesForCategoryLabel(cat);
        if (db.length > 0) {
            return { labels: db.slice(), synthetic: false };
        }
        const groups = filterGroupsForCategoryLabel(cat, null);
        const syn = {};
        groups.forEach(function (g) {
            syn[inferSyntheticSubForGroup(g)] = true;
        });
        const labels = Object.keys(syn).sort(function (a, b) {
            return a.localeCompare(b, "es");
        });
        return { labels: labels, synthetic: true };
    }

    function groupMatchesSubInWizard(g, subLabel, allSubsInCategory, synthetic) {
        if (!allSubsInCategory) {
            return true;
        }
        if (synthetic) {
            return inferSyntheticSubForGroup(g) === subLabel;
        }
        return String(g.subcategoria || "") === subLabel;
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

    function computeFallbackUnitPrice(v) {
        const p = Number(v.precio_actual);
        if (!p || p <= 0 || isNaN(p)) {
            return null;
        }
        const q = Number(v.cantidad_unidad);
        const u = String(v.unidad_medida || "").toLowerCase();
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

    function resolveUnitPriceForVariant(v) {
        const ref = Number(v.precio_referencia);
        const unit = v.unidad_referencia != null ? String(v.unidad_referencia).trim() : "";
        if (ref > 0 && !isNaN(ref) && unit) {
            return { price: ref, unit: normalizeUnitLabel(unit) };
        }
        const fb = computeFallbackUnitPrice(v);
        if (fb && fb.v > 0 && !isNaN(fb.v)) {
            return { price: fb.v, unit: fb.unit };
        }
        return null;
    }

    function formatPriceEs(n) {
        const x = Number(n);
        if (isNaN(x)) {
            return "";
        }
        return x.toFixed(2).replace(".", ",");
    }

    function hideSubcatStoreView() {
        if (subcatStoreView) {
            subcatStoreView.hidden = true;
        }
        if (subcatWinner) {
            subcatWinner.hidden = true;
        }
        if (subcatWinnerBody) {
            subcatWinnerBody.innerHTML = "";
        }
        if (subcatStoreGrid) {
            subcatStoreGrid.innerHTML = "";
        }
    }

    function showSubcatStoreShell(titleText, cat) {
        if (noSelectionMsg) {
            noSelectionMsg.hidden = true;
        }
        if (priceTableContainer) {
            priceTableContainer.hidden = true;
        }
        if (subcatStoreView) {
            subcatStoreView.hidden = false;
        }
        if (subcatViewTitle) {
            subcatViewTitle.textContent = titleText;
        }
        if (cat) {
            renderSubcatChips(cat);
        } else {
            if (subcatChipsRow) {
                subcatChipsRow.hidden = true;
                subcatChipsRow.innerHTML = "";
            }
        }
    }

    function getBestVariantPerSuperForSubcat(cat, subLabel, allSubsInCategory) {
        const synthetic = currentSubModeSynthetic;
        const groupsInCat = filterGroupsForCategoryLabel(cat, null);
        const byStore = {};
        groupsInCat.forEach(function (g) {
            if (!chipMatchesGroup(activeCategory, g)) {
                return;
            }
            if (!groupMatchesSubInWizard(g, subLabel, allSubsInCategory, synthetic)) {
                return;
            }
            g.variantes.forEach(function (v) {
                const store = v.nombre_supermercado;
                const prev = byStore[store];
                if (!prev || Number(v.precio_actual) < Number(prev.precio_actual)) {
                    byStore[store] = v;
                }
            });
        });
        return byStore;
    }

    function showStoreComparisonView(cat, subLabel, allSubsInCategory) {
        const byStore = getBestVariantPerSuperForSubcat(cat, subLabel, allSubsInCategory);
        const picks = Object.keys(byStore).map(function (k) {
            return byStore[k];
        });
        if (picks.length === 0) {
            showToast(comparatorT("wizard_empty", "No hay productos"));
            return;
        }
        let titleBase = cat;
        if (cat === "TODAS") {
            titleBase = comparatorT("wizard_all_categories", "Todas");
        }
        let subPart = "";
        if (allSubsInCategory) {
            subPart = " · " + comparatorT("wizard_all_subs", "Todas las subcategorias");
        } else if (subLabel) {
            subPart = " · " + subLabel;
        }
        showSubcatStoreShell(titleBase + subPart, cat);

        const minTicket = Math.min.apply(
            null,
            picks.map(function (v) {
                return Number(v.precio_actual);
            })
        );

        picks.sort(function (a, b) {
            const ua = resolveUnitPriceForVariant(a);
            const ub = resolveUnitPriceForVariant(b);
            if (ua && ub && ua.unit === ub.unit) {
                return ua.price - ub.price;
            }
            if (ua && !ub) {
                return -1;
            }
            if (!ua && ub) {
                return 1;
            }
            return Number(a.precio_actual) - Number(b.precio_actual);
        });

        if (subcatStoreGrid) {
            subcatStoreGrid.innerHTML = picks
                .map(function (v, index) {
                    return renderComparatorStoreCard(v, index, Number(v.precio_actual) === minTicket);
                })
                .join("");
        }

        bindSubcatStoreAddButtons();
        renderSubcatWinnerBar(picks, minTicket);

        if (subcatWinner) {
            subcatWinner.hidden = false;
        }
    }

    function renderComparatorStoreCard(v, index, isBestTicket) {
        const visual = getSupermarketVisual(v.nombre_supermercado);
        const logoHtml = visual.image
            ? '<img src="' +
              escapeHtml(visual.image) +
              '" alt="" class="comparator-store-card__logo">'
            : '<span class="comparator-store-card__emoji">' + visual.emoji + "</span>";
        const unitInfo = resolveUnitPriceForVariant(v);
        let unitLine = "";
        if (unitInfo) {
            unitLine =
                '<span class="comparator-store-card__unit">' +
                formatPriceEs(unitInfo.price) +
                " € / " +
                escapeHtml(unitInfo.unit) +
                "</span>";
        }
        const baseCls = isBestTicket
            ? "comparator-store-card comparator-store-card--best-ticket"
            : "comparator-store-card";
        return (
            '<article class="' +
            baseCls +
            '" role="listitem" style="--stagger:' +
            index +
            '">' +
            '<div class="comparator-store-card__head">' +
            logoHtml +
            '<span class="comparator-store-card__super">' +
            escapeHtml(v.nombre_supermercado) +
            "</span></div>" +
            '<p class="comparator-store-card__product">' +
            escapeHtml(v.nombre) +
            "</p>" +
            '<div class="comparator-store-card__stats">' +
            '<span class="comparator-store-card__price">' +
            formatPriceEs(v.precio_actual) +
            " €</span>" +
            '<span class="comparator-store-card__format">' +
            formatVariantText(v) +
            "</span>" +
            unitLine +
            "</div>" +
            '<button type="button" class="button button--primary button--sm add-list-btn" data-id="' +
            v.id_producto +
            '"><i class="fas fa-plus"></i> ' +
            escapeHtml(comparatorT("add_to_list", "Añadir a mi lista")) +
            "</button></article>"
        );
    }

    function formatVariantTextPlain(v) {
        if (v.formato) {
            return String(v.formato);
        }
        if (v.cantidad_unidad && v.unidad_medida) {
            return String(v.cantidad_unidad) + " " + v.unidad_medida;
        }
        return v.nombre;
    }

    function renderSubcatWinnerBar(picks, minTicket) {
        if (!subcatWinnerBody || !subcatWinner) {
            return;
        }
        const withUnit = picks
            .map(function (v) {
                return { v: v, u: resolveUnitPriceForVariant(v) };
            })
            .filter(function (x) {
                return x.u;
            });
        if (withUnit.length === 0) {
            const best = picks
                .slice()
                .sort(function (a, b) {
                    return Number(a.precio_actual) - Number(b.precio_actual);
                })[0];
            subcatWinner.className = "comparator-winner comparator-winner--fallback";
            subcatWinnerBody.innerHTML =
                '<div><span class="comparator-winner__label">' +
                escapeHtml(comparatorT("winner_unit_fallback", "Mejor precio de ticket")) +
                '</span><p class="comparator-winner__line">' +
                escapeHtml(best.nombre_supermercado) +
                " · " +
                formatPriceEs(best.precio_actual) +
                " €</p>" +
                '<p class="comparator-winner__hint">' +
                escapeHtml(
                    comparatorT(
                        "winner_no_unit_hint",
                        "No hay datos suficientes para comparar por unidad (€/L, €/kg)."
                    )
                ) +
                "</p></div>";
            return;
        }
        const counts = {};
        withUnit.forEach(function (x) {
            const k = x.u.unit;
            counts[k] = (counts[k] || 0) + 1;
        });
        let modeUnit = null;
        let modeN = 0;
        Object.keys(counts).forEach(function (k) {
            if (counts[k] > modeN) {
                modeN = counts[k];
                modeUnit = k;
            }
        });
        const pool = withUnit.filter(function (x) {
            return x.u.unit === modeUnit;
        });
        let win = pool[0];
        pool.forEach(function (x) {
            if (x.u.price < win.u.price) {
                win = x;
            }
        });
        subcatWinner.className = "comparator-winner";
        subcatWinnerBody.innerHTML =
            '<div><span class="comparator-winner__label">' +
            escapeHtml(comparatorT("winner_by_unit", "Ganador por unidad")) +
            '</span><p class="comparator-winner__line">' +
            escapeHtml(win.v.nombre_supermercado) +
            " · " +
            formatPriceEs(win.u.price) +
            " € / " +
            escapeHtml(win.u.unit) +
            "</p>" +
            '<p class="comparator-winner__hint">' +
            escapeHtml(formatVariantTextPlain(win.v)) +
            " · " +
            escapeHtml(comparatorT("ticket_price", "Precio ticket")) +
            " " +
            formatPriceEs(win.v.precio_actual) +
            " €</p></div>";
    }

    function bindSubcatStoreAddButtons() {
        if (!subcatStoreGrid) {
            return;
        }
        subcatStoreGrid.querySelectorAll(".add-list-btn").forEach(function (btn) {
            btn.addEventListener("click", async function (e) {
                const productId = Number(e.currentTarget.dataset.id);
                try {
                    var body = { product_id: productId, cantidad: 1 };
                    if (typeof ListContext !== "undefined") {
                        var cid = ListContext.getCabeceraId();
                        if (cid) {
                            body.cabecera_id = cid;
                        }
                    }
                    await ApiClient.post("/api/lists/mine", body);
                    showToast(comparatorT("toast_added", "Producto añadido a tu lista"));
                } catch (error) {
                    if (error.message === "No autenticado") {
                        window.location.href = "./login.html";
                    } else {
                        showToast(comparatorT("toast_error", "No se pudo añadir el producto"));
                    }
                }
            });
        });
    }

    function chipSlugToCategoryLabel(slug) {
        if (!slug) return "TODAS";
        var cats = collectCategoriesFromGroups();
        for (var i = 0; i < cats.length; i++) {
            if (chipMatchesGroup(slug, { categoria: cats[i], nombre: "" })) {
                return cats[i];
            }
        }
        return slug;
    }

    function renderSubcatChips(cat) {
        if (!subcatChipsRow) return;
        var pack = getSubcategoriesForWizard(cat === "TODAS" ? "TODAS" : cat);
        if (!pack.labels.length) {
            subcatChipsRow.hidden = true;
            subcatChipsRow.innerHTML = "";
            return;
        }
        currentSubModeSynthetic = pack.synthetic;
        subcatChipsRow.hidden = false;
        subcatChipsRow.innerHTML = "";

        var allChip = document.createElement("span");
        allChip.className = "cat-chip active";
        allChip.textContent = comparatorT("wizard_all_subs", "Todas");
        allChip.addEventListener("click", function () {
            subcatChipsRow.querySelectorAll(".cat-chip").forEach(function (c) { c.classList.remove("active"); });
            allChip.classList.add("active");
            showStoreComparisonView(cat, null, true);
        });
        subcatChipsRow.appendChild(allChip);

        pack.labels.forEach(function (sub) {
            var chip = document.createElement("span");
            chip.className = "cat-chip";
            chip.textContent = sub;
            chip.addEventListener("click", function () {
                subcatChipsRow.querySelectorAll(".cat-chip").forEach(function (c) { c.classList.remove("active"); });
                chip.classList.add("active");
                currentSubModeSynthetic = pack.synthetic;
                showStoreComparisonView(cat, sub, false);
            });
            subcatChipsRow.appendChild(chip);
        });
    }

    function comparatorT(key, fallback) {
        const lang =
            typeof SessionManager !== "undefined" && SessionManager.getCurrentLanguage
                ? SessionManager.getCurrentLanguage()
                : "es";
        const cache =
            typeof TranslationManager !== "undefined" && TranslationManager.translationsCache
                ? TranslationManager.translationsCache[lang]
                : null;
        const v =
            cache && TranslationManager.getTranslatedValue
                ? TranslationManager.getTranslatedValue(cache, ["comparator", key])
                : null;
        return v || fallback;
    }

    function showToast(msg) {
        let el = document.getElementById("toast-comparator");
        if (!el) {
            el = document.createElement("div");
            el.id = "toast-comparator";
            el.className = "toast-ok";
            el.setAttribute("role", "status");
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.classList.add("toast-ok--show");
        clearTimeout(showToast._hideTimer);
        showToast._hideTimer = setTimeout(function () {
            el.classList.remove("toast-ok--show");
        }, 2200);
    }

    async function loadSources() {
        try {
            const response = await ApiClient.get("/api/products/sources");
            const visuals = {};
            (response.sources || []).forEach(function (source) {
                visuals[source.nombre] = {
                    image: source.logo || "",
                    emoji: source.emoji || "🏬",
                    accent: source.color || "#475569"
                };
            });
            supermarketVisuals = visuals;
        } catch (error) {
            console.error("Error al cargar las fuentes:", error);
        }
    }

    function getSupermarketVisual(supermarketName) {
        return supermarketVisuals[supermarketName] || { image: "", emoji: "🏬", accent: "#475569" };
    }

    async function loadOptions() {
        try {
            const response = await ApiClient.get("/api/products/comparator-options");
            allOptions = response.items || [];

            groupedProducts = {};
            allOptions.forEach(function (p) {
                const key = p.clave_comparable;
                if (!groupedProducts[key]) {
                    groupedProducts[key] = {
                        clave: key,
                        nombre: p.nombre_comparable,
                        categoria: p.categoria || p.categoria_normalizada,
                        subcategoria: p.subcategoria || null,
                        imagen: p.imagen_resuelta,
                        emoji: p.emoji_sugerido,
                        variantes: []
                    };
                }
                groupedProducts[key].variantes.push(p);
                if (p.subcategoria && !groupedProducts[key].subcategoria) {
                    groupedProducts[key].subcategoria = p.subcategoria;
                }
            });
        } catch (error) {
            console.error("Error al cargar opciones:", error);
        }
    }

    function renderSearchResults(query) {
        const q = query.toLowerCase().trim();
        searchResults.innerHTML = "";

        if (!q && !activeCategory) {
            searchResults.hidden = true;
            return [];
        }

        const groupsArray = Object.values(groupedProducts);
        const filtered = groupsArray
            .filter(function (g) {
                const matchText =
                    !q ||
                    g.nombre.toLowerCase().includes(q) ||
                    (g.categoria || "").toLowerCase().includes(q);
                const matchChip = chipMatchesGroup(activeCategory, g);
                return matchText && matchChip;
            })
            .slice(0, 8);

        if (filtered.length === 0) {
            searchResults.innerHTML =
                '<div class="comparator__result-item">' +
                escapeHtml(comparatorT("no_results", "No se encontraron productos")) +
                "</div>";
            searchResults.hidden = false;
            return [];
        }

        filtered.forEach(function (group) {
            const div = document.createElement("div");
            div.className = "comparator__result-item";

            const minPrice = Math.min.apply(
                null,
                group.variantes.map(function (v) {
                    return v.precio_actual;
                })
            );

            div.innerHTML =
                '<div class="result-main">' +
                escapeHtml(group.nombre) +
                "</div>" +
                '<div class="result-meta">En ' +
                group.variantes.length +
                " supermercados • Desde " +
                minPrice.toFixed(2) +
                " €</div>";

            div.addEventListener("click", function () {
                selectProduct(group);
                searchResults.hidden = true;
                searchInput.value = "";
            });

            searchResults.appendChild(div);
        });

        searchResults.hidden = false;
        return filtered;
    }

    function formatVariantText(v) {
        if (v.formato) return escapeHtml(v.formato);
        if (v.cantidad_unidad && v.unidad_medida) {
            return escapeHtml(String(v.cantidad_unidad) + " " + v.unidad_medida);
        }
        return escapeHtml(v.nombre);
    }

    function selectProduct(group) {
        hideSubcatStoreView();
        noSelectionMsg.hidden = true;
        priceTableContainer.hidden = false;

        const imgHtml = group.imagen
            ? '<img src="' +
              escapeHtml(group.imagen) +
              '" alt="' +
              escapeHtml(group.nombre) +
              '" class="product-info__img">'
            : '<div class="product-info__emoji">' + escapeHtml(group.emoji) + "</div>";

        // Cabecera del producto: categoria destacada como chip arriba, nombre grande,
        // y metadatos secundarios (marca, formato) debajo en pequeno
        const categoriaChip = group.categoria
            ? '<span class="product-info__category">' + escapeHtml(group.categoria) + "</span>"
            : "";
        const subChip = group.subcategoria
            ? '<span class="product-info__category product-info__category--sub">' +
              escapeHtml(group.subcategoria) +
              "</span>"
            : "";

        const sortedVariants = group.variantes.slice().sort(function (a, b) {
            const refA = a.precio_referencia !== null ? a.precio_referencia : a.precio_actual;
            const refB = b.precio_referencia !== null ? b.precio_referencia : b.precio_actual;
            return refA - refB;
        });

        const best = sortedVariants[0];
        const metaParts = [];
        if (best.marca) {
            metaParts.push(escapeHtml(best.marca));
        }
        metaParts.push(formatVariantText(best));
        const metaLine = metaParts.length
            ? '<p class="product-info__meta">' + metaParts.join(" · ") + "</p>"
            : "";

        productInfo.innerHTML =
            imgHtml +
            '<div class="product-info__text">' +
            categoriaChip +
            subChip +
            '<h2 class="product-info__title">' +
            escapeHtml(group.nombre) +
            "</h2>" +
            metaLine +
            "</div>";

        // Resumen comercial: cuantos supers, mejor precio, ahorro absoluto y porcentual
        // sobre el supermercado mas caro
        const worst = sortedVariants[sortedVariants.length - 1];
        const ahorroAbs = +(worst.precio_actual - best.precio_actual).toFixed(2);
        const ahorroPct = worst.precio_actual > 0
            ? Math.round(((worst.precio_actual - best.precio_actual) / worst.precio_actual) * 100)
            : 0;

        const resumenParts = [];
        resumenParts.push(
            '<div class="comparator-summary__item">' +
                '<i class="fas fa-store comparator-summary__icon"></i>' +
                '<div><span class="comparator-summary__label">' +
                comparatorT("summary_supers", "Supermercados") +
                '</span><span class="comparator-summary__value">' +
                sortedVariants.length +
                "</span></div></div>"
        );
        resumenParts.push(
            '<div class="comparator-summary__item">' +
                '<i class="fas fa-trophy comparator-summary__icon"></i>' +
                '<div><span class="comparator-summary__label">' +
                comparatorT("summary_best", "Mejor precio") +
                '</span><span class="comparator-summary__value">' +
                best.precio_actual.toFixed(2) +
                " € · " +
                escapeHtml(best.nombre_supermercado) +
                "</span></div></div>"
        );
        if (sortedVariants.length > 1 && ahorroAbs > 0) {
            resumenParts.push(
                '<div class="comparator-summary__item comparator-summary__item--accent">' +
                    '<i class="fas fa-piggy-bank comparator-summary__icon"></i>' +
                    '<div><span class="comparator-summary__label">' +
                    comparatorT("summary_save", "Ahorro maximo") +
                    '</span><span class="comparator-summary__value">' +
                    ahorroAbs.toFixed(2) +
                    " € (-" +
                    ahorroPct +
                    "%)</span></div></div>"
            );
        }

        const summaryHtml =
            '<div class="comparator-summary">' + resumenParts.join("") + "</div>";

        const sectionTitle =
            '<h3 class="comparator-section-title">' +
            comparatorT("comparison_title", "Comparativa entre supermercados") +
            "</h3>";

        const cards = sortedVariants
            .map(function (v, index) {
                return renderCartel(v, index === 0, best.precio_actual);
            })
            .join("");

        priceTable.innerHTML =
            summaryHtml +
            sectionTitle +
            '<div class="comparator-cards-grid">' +
            cards +
            "</div>";

        document.querySelectorAll(".add-list-btn").forEach(function (btn) {
            btn.addEventListener("click", async function (e) {
                const productId = Number(e.currentTarget.dataset.id);
                try {
                    var body = { product_id: productId, cantidad: 1 };
                    if (typeof ListContext !== "undefined") {
                        var cid = ListContext.getCabeceraId();
                        if (cid) {
                            body.cabecera_id = cid;
                        }
                    }
                    await ApiClient.post("/api/lists/mine", body);
                    showToast(comparatorT("toast_added", "Producto añadido a tu lista"));
                } catch (error) {
                    if (error.message === "No autenticado") {
                        window.location.href = "./login.html";
                    } else {
                        showToast(comparatorT("toast_error", "No se pudo añadir el producto"));
                    }
                }
            });
        });
        lastSelectedGroup = group;
    }

    function renderCartel(v, isBest, bestPrice) {
        const visual = getSupermarketVisual(v.nombre_supermercado);
        const logoHtml = visual.image
            ? '<img src="' +
              escapeHtml(visual.image) +
              '" alt="' +
              escapeHtml(v.nombre_supermercado) +
              '" class="price-cartel__logo">'
            : '<span class="price-cartel__emoji">' + visual.emoji + "</span>";

        const formatText = formatVariantText(v);

        let priceRefText = "";
        if (v.precio_referencia !== null && v.unidad_referencia) {
            priceRefText =
                '<div class="price-cartel__ref">' +
                v.precio_referencia.toFixed(2) +
                " €/" +
                escapeHtml(v.unidad_referencia) +
                "</div>";
        }

        let offerText = "";
        if (v.precio_oferta !== null && v.precio_oferta !== undefined) {
            offerText =
                '<div class="price-cartel__offer">' +
                escapeHtml(comparatorT("offer_label", "Oferta")) +
                ": " +
                Number(v.precio_oferta).toFixed(2) +
                " €</div>";
        }

        // Diferencia respecto al mejor precio: muestra "Mejor precio" en el primero
        // y "+0,30 € (+15%)" en el resto para que el usuario vea de un vistazo
        // cuanto pierde comprando ahi
        let diffHtml = "";
        if (isBest) {
            diffHtml =
                '<div class="price-cartel__diff price-cartel__diff--best">' +
                escapeHtml(comparatorT("price_badge", "Mejor precio")) +
                "</div>";
        } else if (typeof bestPrice === "number" && bestPrice > 0) {
            const diff = +(v.precio_actual - bestPrice).toFixed(2);
            const pct = Math.round((diff / bestPrice) * 100);
            diffHtml =
                '<div class="price-cartel__diff">+' +
                diff.toFixed(2) +
                " € (+" +
                pct +
                "%)</div>";
        }

        const cardClass = isBest ? "price-cartel price-cartel--best" : "price-cartel";
        const borderStyle = "border-color: " + escapeHtml(visual.accent);
        const superBlock =
            '<div class="price-cartel__super">' + escapeHtml(v.nombre_supermercado) + "</div>";

        return (
            '<div class="' +
            cardClass +
            '" style="' +
            borderStyle +
            '">' +
            '<div class="price-cartel__head">' +
            logoHtml +
            superBlock +
            "</div>" +
            '<div class="price-cartel__format">' +
            formatText +
            "</div>" +
            '<div class="price-cartel__price">' +
            v.precio_actual.toFixed(2) +
            " €</div>" +
            priceRefText +
            offerText +
            diffHtml +
            '<button type="button" class="button button--primary button--sm add-list-btn" data-id="' +
            v.id_producto +
            '"><i class="fas fa-plus"></i> ' +
            escapeHtml(comparatorT("add_to_list", "Añadir a mi lista")) +
            "</button></div>"
        );
    }

    function backFromSubcatStoreView() {
        hideSubcatStoreView();
        if (noSelectionMsg) {
            noSelectionMsg.hidden = false;
        }
        if (priceTableContainer) {
            priceTableContainer.hidden = true;
        }
    }

    if (subcatViewBack) {
        subcatViewBack.addEventListener("click", function () {
            backFromSubcatStoreView();
        });
    }

    document.querySelectorAll(".cat-chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
            document.querySelectorAll(".cat-chip").forEach(function (c) {
                c.classList.remove("active");
            });
            chip.classList.add("active");
            activeCategory = chip.dataset.cat || "";
            renderSearchResults(searchInput.value);
            if (activeCategory) {
                currentCategoryLabel = chipSlugToCategoryLabel(activeCategory);
                showStoreComparisonView(currentCategoryLabel, null, true);
            } else {
                hideSubcatStoreView();
                if (priceTableContainer) priceTableContainer.hidden = true;
                if (noSelectionMsg) noSelectionMsg.hidden = false;
            }
        });
    });

    document.querySelectorAll(".empty-suggestion-chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
            searchInput.value = chip.dataset.query;
            searchInput.focus();
            renderSearchResults(chip.dataset.query);
        });
    });

    searchInput.addEventListener("input", function (e) {
        renderSearchResults(e.target.value);
    });

    searchInput.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") {
            return;
        }
        e.preventDefault();
        const filtered = renderSearchResults(searchInput.value);
        if (filtered.length === 1) {
            selectProduct(filtered[0]);
            searchResults.hidden = true;
            searchInput.value = "";
        }
    });

    document.addEventListener("click", function (e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.hidden = true;
        }
    });

    clearButton.addEventListener("click", function () {
        hideSubcatStoreView();
        priceTableContainer.hidden = true;
        noSelectionMsg.hidden = false;
        searchInput.value = "";
        document.querySelectorAll(".cat-chip").forEach(function (c) {
            c.classList.remove("active");
        });
        document.querySelector('.cat-chip[data-cat=""]').classList.add("active");
        activeCategory = "";
        currentCategoryLabel = "";
    });

    if (syncButton) {
        syncButton.addEventListener("click", async function () {
            const label = document.getElementById("sync-label");
            const originalHtml = syncButton.innerHTML;
            syncButton.disabled = true;
            syncButton.classList.add("comparator__sync-btn--loading");
            if (label) {
                label.textContent = comparatorT("syncing", "Sincronizando...");
            }
            syncStatus.style.display = "none";

            try {
                await ApiClient.post("/api/products/sync");
                syncStatus.innerText = comparatorT("sync_ok", "Precios actualizados");
                syncStatus.style.display = "inline-block";
                syncStatus.style.color = "#16a34a";
                await loadOptions();
                if (activeCategory) {
                    currentCategoryLabel = chipSlugToCategoryLabel(activeCategory);
                    showStoreComparisonView(currentCategoryLabel, null, true);
                }
                const qv = (searchInput && searchInput.value) || "";
                if (qv.trim()) {
                    renderSearchResults(qv);
                }
                if (lastSelectedGroup) {
                    selectProduct(lastSelectedGroup);
                }
            } catch (error) {
                if (error.message === "No autenticado") {
                    window.location.href = "./login.html";
                    return;
                }
                let msg = comparatorT("sync_err", "Error al actualizar");
                if (error.message && error.message.indexOf("Failed to fetch") >= 0) {
                    msg = comparatorT("sync_err_network", "Sin conexion o timeout");
                } else if (error.message) {
                    msg = error.message;
                }
                syncStatus.innerText = msg;
                syncStatus.style.display = "inline-block";
                syncStatus.style.color = "#dc2626";
            } finally {
                syncButton.disabled = false;
                syncButton.classList.remove("comparator__sync-btn--loading");
                syncButton.innerHTML = originalHtml;
                setTimeout(function () {
                    syncStatus.style.display = "none";
                }, 6000);
            }
        });
    }

    function applyQueryFromUrl() {
        let q0 = "";
        try {
            const params = new URLSearchParams(window.location.search);
            q0 = (params.get("q") || "").trim();
        } catch (err) {
            return;
        }
        if (!q0 || !searchInput) {
            return;
        }
        searchInput.value = q0;
        const filtered = renderSearchResults(q0);
        if (filtered.length === 1) {
            selectProduct(filtered[0]);
            searchResults.hidden = true;
        }
    }

    async function init() {
        await loadSources();
        await loadOptions();
        applyQueryFromUrl();
    }

    init();
});
