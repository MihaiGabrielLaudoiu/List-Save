document.addEventListener("DOMContentLoaded", function () {
    var searchInput = document.getElementById("search-main");
    var searchResults = document.getElementById("results-main");
    var priceTableContainer = document.getElementById("price-table-container");
    var priceTable = document.getElementById("price-table");
    var productInfo = document.getElementById("selected-product-info");
    var clearButton = document.getElementById("clear-comparison");
    var noSelectionMsg = document.getElementById("no-selection");
    var syncButton = document.getElementById("sync-prices");
    var syncStatus = document.getElementById("sync-status");
    var subcatChipsRow = document.getElementById("subcat-chips-row");
    var subcatStoreView = document.getElementById("subcat-store-view");
    var subcatStoreGrid = document.getElementById("subcat-store-grid");
    var subcatWinner = document.getElementById("subcat-winner");
    var subcatWinnerBody = document.getElementById("subcat-winner-body");
    var subcatViewTitle = document.getElementById("subcat-view-title");
    var subcatViewBack = document.getElementById("subcat-view-back");

    var allOptions = [];
    var groupedProducts = {};
    var supermarketVisuals = {};
    var activeCategory = "";
    var currentCategoryLabel = "";
    var currentSubModeSynthetic = false;
    var lastSelectedGroup = null;

    var FRUIT_RE = /manzana|pl[aá]tano|naranja|pera|uva|mel[oó]n|sand[ií]a/;
    var VEG_RE = /cebolla|tomate|zanahoria|pepino|lechuga|pimiento|calabac[ií]n|patata/;

    function esc(value) {
        if (!value) return "";
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatPrice(n) {
        var x = Number(n);
        if (isNaN(x)) return "";
        return x.toFixed(2).replace(".", ",");
    }

    function catFromSlug(slug, group) {
        if (!slug) return true;
        var cat = (group.categoria || "").toLowerCase();
        var name = (group.nombre || "").toLowerCase();
        if (slug === "lacteos") return cat.includes("lacteo");
        if (slug === "carnes") return cat.includes("carne");
        if (slug === "panaderia") return cat.includes("panad");
        if (slug === "bebidas") return cat.includes("bebida");
        if (slug === "higiene") return cat.includes("higiene");
        if (slug === "limpieza") return cat.includes("limpieza");
        if (slug === "frutas") return (cat.includes("fruta-verdura") || cat.includes("fruta")) && FRUIT_RE.test(name);
        if (slug === "verduras") return (cat.includes("fruta-verdura") || cat.includes("verdura")) && VEG_RE.test(name);
        return cat.includes(slug);
    }

    function inferSubLabel(g) {
        var n = String(g.nombre_comparable || g.nombre || "").toLowerCase();
        var cat = String(g.categoria || "").toLowerCase();
        if (cat.indexOf("lact") >= 0) {
            if (/leche|batido/.test(n)) return "Leche y batidos";
            if (/yogur|yogurt/.test(n)) return "Yogures";
            if (/queso/.test(n)) return "Quesos";
            if (/mantequilla|margarina|nata/.test(n)) return "Mantequilla y nata";
        }
        if (/\b(arroz|lenteja|garbanzo|pasta|fideo)\b/.test(n)) return "Arroz, pasta y legumbres";
        var words = String(g.nombre_comparable || g.nombre || "Otros").trim().split(/\s+/);
        var head = (words[0] || "otros").replace(/[^a-záéíóúüñ0-9-]/gi, "");
        if (!head) return "Otros";
        return head.charAt(0).toUpperCase() + head.slice(1).toLowerCase();
    }

    function labelForSub(g, synthetic) {
        var raw = g.subcategoria && String(g.subcategoria).trim();
        if (!synthetic && raw) return raw;
        return inferSubLabel(g);
    }

    function collectCategories() {
        var set = {};
        Object.values(groupedProducts).forEach(function (g) {
            var c = String(g.categoria || g.categoria_normalizada || "").trim();
            if (c) set[c] = true;
        });
        return Object.keys(set).sort(function (a, b) { return a.localeCompare(b, "es"); });
    }

    function collectSubs(catLabel) {
        if (!catLabel || catLabel === "TODAS") return [];
        var needle = catLabel.toLowerCase();
        var set = {};
        Object.values(groupedProducts).forEach(function (g) {
            var cat = String(g.categoria || "").toLowerCase();
            var norm = String(g.categoria_normalizada || "").toLowerCase();
            if ((cat.includes(needle) || norm.includes(needle) || needle.includes(cat)) && g.subcategoria) {
                set[g.subcategoria] = true;
            }
        });
        return Object.keys(set).sort(function (a, b) { return a.localeCompare(b, "es"); });
    }

    function filterGroups(catLabel, subLabel) {
        var all = Object.values(groupedProducts);
        var base;
        if (!catLabel || catLabel === "TODAS") {
            base = all.slice();
        } else {
            var needle = catLabel.toLowerCase();
            base = all.filter(function (g) {
                var cat = String(g.categoria || "").toLowerCase();
                var norm = String(g.categoria_normalizada || "").toLowerCase();
                return cat.includes(needle) || norm.includes(needle) || needle.includes(cat);
            });
        }
        if (subLabel) {
            var s = String(subLabel).toLowerCase();
            base = base.filter(function (g) {
                return String(g.subcategoria || "").toLowerCase() === s;
            });
        }
        return base.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, "es"); }).slice(0, 120);
    }

    function getSubsForWizard(cat) {
        if (cat === "TODAS") {
            var set = {};
            Object.values(groupedProducts).forEach(function (g) {
                set[inferSubLabel(g)] = true;
            });
            return { labels: Object.keys(set).sort(function (a, b) { return a.localeCompare(b, "es"); }), synthetic: true };
        }
        var db = collectSubs(cat);
        if (db.length > 0) return { labels: db.slice(), synthetic: false };
        var groups = filterGroups(cat, null);
        var syn = {};
        groups.forEach(function (g) { syn[inferSubLabel(g)] = true; });
        return { labels: Object.keys(syn).sort(function (a, b) { return a.localeCompare(b, "es"); }), synthetic: true };
    }

    function slugToLabel(slug) {
        if (!slug) return "TODAS";
        var cats = collectCategories();
        for (var i = 0; i < cats.length; i++) {
            if (catFromSlug(slug, { categoria: cats[i], nombre: "" })) return cats[i];
        }
        return slug;
    }

    function normalizeUnit(unit) {
        if (!unit) return "";
        var u = String(unit).trim().toLowerCase();
        if (u === "kg" || u.indexOf("kilo") >= 0) return "kg";
        if (u === "l" || u === "litro" || u === "litros") return "L";
        if (u === "100g") return "100 g";
        if (u === "100ml") return "100 ml";
        if (u === "ud") return "ud";
        return String(unit).trim();
    }

    function unitPrice(v) {
        var ref = Number(v.precio_referencia);
        var unit = v.unidad_referencia != null ? String(v.unidad_referencia).trim() : "";
        if (ref > 0 && !isNaN(ref) && unit) return { price: ref, unit: normalizeUnit(unit) };
        var p = Number(v.precio_actual);
        var q = Number(v.cantidad_unidad);
        var m = String(v.unidad_medida || "").toLowerCase();
        if (!p || p <= 0 || !q || q <= 0 || !m) return null;
        if (m === "kg") return { price: p / q, unit: "kg" };
        if (m === "g") return { price: p / (q / 1000), unit: "kg" };
        if (m === "l") return { price: p / q, unit: "L" };
        if (m === "ml") return { price: p / (q / 1000), unit: "L" };
        if (m === "cl") return { price: p / (q / 100), unit: "L" };
        if (m === "ud") return { price: p / q, unit: "ud" };
        return null;
    }

    function formatText(v) {
        if (v.formato) return esc(v.formato);
        if (v.cantidad_unidad && v.unidad_medida) return esc(String(v.cantidad_unidad) + " " + v.unidad_medida);
        return esc(v.nombre);
    }

    function t(key, fallback) {
        var lang = typeof SessionManager !== "undefined" && SessionManager.getCurrentLanguage ? SessionManager.getCurrentLanguage() : "es";
        var cache = typeof TranslationManager !== "undefined" && TranslationManager.translationsCache ? TranslationManager.translationsCache[lang] : null;
        var v = cache && TranslationManager.getTranslatedValue ? TranslationManager.getTranslatedValue(cache, ["comparator", key]) : null;
        return v || fallback;
    }

    function toast(msg) {
        var el = document.getElementById("toast-comparator");
        if (!el) {
            el = document.createElement("div");
            el.id = "toast-comparator";
            el.className = "toast-ok";
            el.setAttribute("role", "status");
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.classList.add("toast-ok--show");
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { el.classList.remove("toast-ok--show"); }, 2200);
    }

    function getVisual(name) {
        return supermarketVisuals[name] || { image: "", emoji: "🏬", accent: "#475569" };
    }

    function hideSubcatView() {
        if (subcatStoreView) subcatStoreView.hidden = true;
        if (subcatWinner) subcatWinner.hidden = true;
        if (subcatWinnerBody) subcatWinnerBody.innerHTML = "";
        if (subcatStoreGrid) subcatStoreGrid.innerHTML = "";
    }

    function showSubcatShell(titleText, cat) {
        if (noSelectionMsg) noSelectionMsg.hidden = true;
        if (priceTableContainer) priceTableContainer.hidden = true;
        if (subcatStoreView) subcatStoreView.hidden = false;
        if (subcatViewTitle) subcatViewTitle.textContent = titleText;
        if (cat) {
            renderSubcatChips(cat);
        } else if (subcatChipsRow) {
            subcatChipsRow.hidden = true;
            subcatChipsRow.innerHTML = "";
        }
    }

    function renderSubcatChips(cat) {
        if (!subcatChipsRow) return;
        var pack = getSubsForWizard(cat === "TODAS" ? "TODAS" : cat);
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
        allChip.textContent = t("wizard_all_subs", "Todas");
        allChip.addEventListener("click", function () {
            subcatChipsRow.querySelectorAll(".cat-chip").forEach(function (c) { c.classList.remove("active"); });
            allChip.classList.add("active");
            showStoreView(cat, null, true);
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
                showStoreView(cat, sub, false);
            });
            subcatChipsRow.appendChild(chip);
        });
    }

    function getBestPerStore(cat, subLabel, allSubs) {
        var groups = filterGroups(cat, null);
        var byStore = {};
        groups.forEach(function (g) {
            if (!catFromSlug(activeCategory, g)) return;
            var gSub = labelForSub(g, currentSubModeSynthetic);
            if (allSubs && subLabel && gSub !== subLabel) return;
            if (!allSubs && subLabel && gSub !== subLabel) return;
            g.variantes.forEach(function (v) {
                var prev = byStore[v.nombre_supermercado];
                if (!prev || Number(v.precio_actual) < Number(prev.precio_actual)) {
                    byStore[v.nombre_supermercado] = v;
                }
            });
        });
        return byStore;
    }

    function showStoreView(cat, subLabel, allSubs) {
        var byStore = getBestPerStore(cat, subLabel, allSubs);
        var picks = Object.keys(byStore).map(function (k) { return byStore[k]; });
        if (picks.length === 0) {
            toast(t("wizard_empty", "No hay productos"));
            return;
        }

        var titleBase = cat === "TODAS" ? t("wizard_all_categories", "Todas") : cat;
        var subPart = allSubs ? " · " + t("wizard_all_subs", "Todas las subcategorias") : subLabel ? " · " + subLabel : "";
        showSubcatShell(titleBase + subPart, cat);

        var minPrice = Math.min.apply(null, picks.map(function (v) { return Number(v.precio_actual); }));

        picks.sort(function (a, b) {
            var ua = unitPrice(a), ub = unitPrice(b);
            if (ua && ub && ua.unit === ub.unit) return ua.price - ub.price;
            if (ua && !ub) return -1;
            if (!ua && ub) return 1;
            return Number(a.precio_actual) - Number(b.precio_actual);
        });

        if (subcatStoreGrid) {
            subcatStoreGrid.innerHTML = picks.map(function (v, i) {
                return storeCard(v, i, Number(v.precio_actual) === minPrice);
            }).join("");
        }

        bindAddButtons(subcatStoreGrid);
        renderWinner(picks, minPrice);
        if (subcatWinner) subcatWinner.hidden = false;
    }

    function storeCard(v, index, isBest) {
        var vis = getVisual(v.nombre_supermercado);
        var logo = vis.image
            ? '<img src="' + esc(vis.image) + '" alt="" class="comparator-store-card__logo">'
            : '<span class="comparator-store-card__emoji">' + vis.emoji + "</span>";
        var ui = unitPrice(v);
        var unitLine = ui ? '<span class="comparator-store-card__unit">' + formatPrice(ui.price) + " € / " + esc(ui.unit) + "</span>" : "";
        var cls = isBest ? "comparator-store-card comparator-store-card--best-ticket" : "comparator-store-card";
        return '<article class="' + cls + '" role="listitem" style="--stagger:' + index + '">' +
            '<div class="comparator-store-card__head">' + logo +
            '<span class="comparator-store-card__super">' + esc(v.nombre_supermercado) + "</span></div>" +
            '<p class="comparator-store-card__product">' + esc(v.nombre) + "</p>" +
            '<div class="comparator-store-card__stats">' +
            '<span class="comparator-store-card__price">' + formatPrice(v.precio_actual) + " €</span>" +
            '<span class="comparator-store-card__format">' + formatText(v) + "</span>" +
            unitLine + "</div>" +
            '<button type="button" class="button button--primary button--sm add-list-btn" data-id="' + v.id_producto +
            '"><i class="fas fa-plus"></i> ' + esc(t("add_to_list", "Añadir a mi lista")) + "</button></article>";
    }

    function renderWinner(picks, minPrice) {
        if (!subcatWinnerBody || !subcatWinner) return;
        var withUnit = picks.map(function (v) { return { v: v, u: unitPrice(v) }; }).filter(function (x) { return x.u; });
        if (withUnit.length === 0) {
            var best = picks.slice().sort(function (a, b) { return Number(a.precio_actual) - Number(b.precio_actual); })[0];
            subcatWinner.className = "comparator-winner comparator-winner--fallback";
            subcatWinnerBody.innerHTML = '<div><span class="comparator-winner__label">' +
                esc(t("winner_unit_fallback", "Mejor precio de ticket")) +
                '</span><p class="comparator-winner__line">' + esc(best.nombre_supermercado) + " · " + formatPrice(best.precio_actual) + " €</p>" +
                '<p class="comparator-winner__hint">' + esc(t("winner_no_unit_hint", "No hay datos suficientes para comparar por unidad.")) + "</p></div>";
            return;
        }
        var counts = {};
        withUnit.forEach(function (x) { counts[x.u.unit] = (counts[x.u.unit] || 0) + 1; });
        var modeUnit = null, modeN = 0;
        Object.keys(counts).forEach(function (k) { if (counts[k] > modeN) { modeN = counts[k]; modeUnit = k; } });
        var pool = withUnit.filter(function (x) { return x.u.unit === modeUnit; });
        var win = pool[0];
        pool.forEach(function (x) { if (x.u.price < win.u.price) win = x; });
        subcatWinner.className = "comparator-winner";
        subcatWinnerBody.innerHTML = '<div><span class="comparator-winner__label">' +
            esc(t("winner_by_unit", "Ganador por unidad")) +
            '</span><p class="comparator-winner__line">' + esc(win.v.nombre_supermercado) + " · " + formatPrice(win.u.price) + " € / " + esc(win.u.unit) + "</p>" +
            '<p class="comparator-winner__hint">' + esc(formatText(win.v)) + " · " + esc(t("ticket_price", "Precio ticket")) + " " + formatPrice(win.v.precio_actual) + " €</p></div>";
    }

    function bindAddButtons(container) {
        if (!container) return;
        container.querySelectorAll(".add-list-btn").forEach(function (btn) {
            btn.addEventListener("click", async function (e) {
                var productId = Number(e.currentTarget.dataset.id);
                try {
                    var body = { product_id: productId, cantidad: 1 };
                    if (typeof ListContext !== "undefined") {
                        var cid = ListContext.getCabeceraId();
                        if (cid) body.cabecera_id = cid;
                    }
                    await ApiClient.post("/api/lists/mine", body);
                    toast(t("toast_added", "Producto añadido a tu lista"));
                } catch (error) {
                    if (error.message === "No autenticado") {
                        window.location.href = "./login.html";
                    } else {
                        toast(t("toast_error", "No se pudo añadir el producto"));
                    }
                }
            });
        });
    }

    function renderResults(query) {
        var q = query.toLowerCase().trim();
        searchResults.innerHTML = "";
        if (!q && !activeCategory) {
            searchResults.hidden = true;
            return [];
        }
        var groups = Object.values(groupedProducts);
        var filtered = groups.filter(function (g) {
            var matchText = !q || g.nombre.toLowerCase().includes(q) || (g.categoria || "").toLowerCase().includes(q);
            var matchChip = catFromSlug(activeCategory, g);
            return matchText && matchChip;
        }).slice(0, 8);

        if (filtered.length === 0) {
            searchResults.innerHTML = '<div class="comparator__result-item">' + esc(t("no_results", "No se encontraron productos")) + "</div>";
            searchResults.hidden = false;
            return [];
        }

        filtered.forEach(function (group) {
            var div = document.createElement("div");
            div.className = "comparator__result-item";
            var minPrice = Math.min.apply(null, group.variantes.map(function (v) { return v.precio_actual; }));
            div.innerHTML = '<div class="result-main">' + esc(group.nombre) + "</div>" +
                '<div class="result-meta">En ' + group.variantes.length + " supermercados · Desde " + minPrice.toFixed(2) + " €</div>";
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

    function selectProduct(group) {
        hideSubcatView();
        noSelectionMsg.hidden = true;
        priceTableContainer.hidden = false;

        var imgHtml = group.imagen
            ? '<img src="' + esc(group.imagen) + '" alt="' + esc(group.nombre) + '" class="product-info__img">'
            : '<div class="product-info__emoji">' + esc(group.emoji) + "</div>";
        var catChip = group.categoria ? '<span class="product-info__category">' + esc(group.categoria) + "</span>" : "";
        var subChip = group.subcategoria
            ? '<span class="product-info__category product-info__category--sub">' + esc(group.subcategoria) + "</span>" : "";

        var sorted = group.variantes.slice().sort(function (a, b) {
            var ra = a.precio_referencia != null ? a.precio_referencia : a.precio_actual;
            var rb = b.precio_referencia != null ? b.precio_referencia : b.precio_actual;
            return ra - rb;
        });

        var best = sorted[0];
        var metaParts = [];
        if (best.marca) metaParts.push(esc(best.marca));
        metaParts.push(formatText(best));
        var metaLine = metaParts.length ? '<p class="product-info__meta">' + metaParts.join(" · ") + "</p>" : "";

        productInfo.innerHTML = imgHtml +
            '<div class="product-info__text">' + catChip + subChip +
            '<h2 class="product-info__title">' + esc(group.nombre) + "</h2>" + metaLine + "</div>";

        var worst = sorted[sorted.length - 1];
        var ahorroAbs = +(worst.precio_actual - best.precio_actual).toFixed(2);
        var ahorroPct = worst.precio_actual > 0 ? Math.round(((worst.precio_actual - best.precio_actual) / worst.precio_actual) * 100) : 0;

        var items = [];
        items.push('<div class="comparator-summary__item"><i class="fas fa-store comparator-summary__icon"></i><div><span class="comparator-summary__label">' +
            t("summary_supers", "Supermercados") + '</span><span class="comparator-summary__value">' + sorted.length + "</span></div></div>");
        items.push('<div class="comparator-summary__item"><i class="fas fa-trophy comparator-summary__icon"></i><div><span class="comparator-summary__label">' +
            t("summary_best", "Mejor precio") + '</span><span class="comparator-summary__value">' +
            best.precio_actual.toFixed(2) + " € · " + esc(best.nombre_supermercado) + "</span></div></div>");
        if (sorted.length > 1 && ahorroAbs > 0) {
            items.push('<div class="comparator-summary__item comparator-summary__item--accent"><i class="fas fa-piggy-bank comparator-summary__icon"></i><div><span class="comparator-summary__label">' +
                t("summary_save", "Ahorro maximo") + '</span><span class="comparator-summary__value">' +
                ahorroAbs.toFixed(2) + " € (-" + ahorroPct + "%)</span></div></div>");
        }

        var cards = sorted.map(function (v, i) { return renderCartel(v, i === 0, best.precio_actual); }).join("");
        priceTable.innerHTML = '<div class="comparator-summary">' + items.join("") + "</div>" +
            '<h3 class="comparator-section-title">' + t("comparison_title", "Comparativa entre supermercados") + "</h3>" +
            '<div class="comparator-cards-grid">' + cards + "</div>";

        bindAddButtons(priceTable);
        lastSelectedGroup = group;
    }

    function renderCartel(v, isBest, bestPrice) {
        var vis = getVisual(v.nombre_supermercado);
        var logo = vis.image
            ? '<img src="' + esc(vis.image) + '" alt="' + esc(v.nombre_supermercado) + '" class="price-cartel__logo">'
            : '<span class="price-cartel__emoji">' + vis.emoji + "</span>";

        var fmtTxt = formatText(v);
        var refLine = "";
        if (v.precio_referencia !== null && v.unidad_referencia) {
            refLine = '<div class="price-cartel__ref">' + v.precio_referencia.toFixed(2) + " €/" + esc(v.unidad_referencia) + "</div>";
        }
        var offerLine = "";
        if (v.precio_oferta !== null && v.precio_oferta !== undefined) {
            offerLine = '<div class="price-cartel__offer">' + esc(t("offer_label", "Oferta")) + ": " + Number(v.precio_oferta).toFixed(2) + " €</div>";
        }
        var diffLine = "";
        if (isBest) {
            diffLine = '<div class="price-cartel__diff price-cartel__diff--best">' + esc(t("price_badge", "Mejor precio")) + "</div>";
        } else if (typeof bestPrice === "number" && bestPrice > 0) {
            var diff = +(v.precio_actual - bestPrice).toFixed(2);
            var pct = Math.round((diff / bestPrice) * 100);
            diffLine = '<div class="price-cartel__diff">+' + diff.toFixed(2) + " € (+" + pct + "%)</div>";
        }

        var cls = isBest ? "price-cartel price-cartel--best" : "price-cartel";
        return '<div class="' + cls + '" style="border-color: ' + esc(vis.accent) + '">' +
            '<div class="price-cartel__head">' + logo +
            '<div class="price-cartel__super">' + esc(v.nombre_supermercado) + "</div></div>" +
            '<div class="price-cartel__format">' + fmtTxt + "</div>" +
            '<div class="price-cartel__price">' + v.precio_actual.toFixed(2) + " €</div>" +
            refLine + offerLine + diffLine +
            '<button type="button" class="button button--primary button--sm add-list-btn" data-id="' + v.id_producto +
            '"><i class="fas fa-plus"></i> ' + esc(t("add_to_list", "Añadir a mi lista")) + "</button></div>";
    }

    if (subcatViewBack) {
        subcatViewBack.addEventListener("click", function () {
            hideSubcatView();
            if (noSelectionMsg) noSelectionMsg.hidden = false;
            if (priceTableContainer) priceTableContainer.hidden = true;
        });
    }

    document.querySelectorAll(".cat-chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
            document.querySelectorAll(".cat-chip").forEach(function (c) { c.classList.remove("active"); });
            chip.classList.add("active");
            activeCategory = chip.dataset.cat || "";
            renderResults(searchInput.value);
            if (activeCategory) {
                currentCategoryLabel = slugToLabel(activeCategory);
                showStoreView(currentCategoryLabel, null, true);
            } else {
                hideSubcatView();
                if (priceTableContainer) priceTableContainer.hidden = true;
                if (noSelectionMsg) noSelectionMsg.hidden = false;
            }
        });
    });

    document.querySelectorAll(".empty-suggestion-chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
            searchInput.value = chip.dataset.query;
            searchInput.focus();
            renderResults(chip.dataset.query);
        });
    });

    searchInput.addEventListener("input", function (e) {
        renderResults(e.target.value);
    });

    searchInput.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        var filtered = renderResults(searchInput.value);
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
        hideSubcatView();
        priceTableContainer.hidden = true;
        noSelectionMsg.hidden = false;
        searchInput.value = "";
        document.querySelectorAll(".cat-chip").forEach(function (c) { c.classList.remove("active"); });
        document.querySelector('.cat-chip[data-cat=""]').classList.add("active");
        activeCategory = "";
        currentCategoryLabel = "";
    });

    if (syncButton) {
        syncButton.addEventListener("click", async function () {
            var label = document.getElementById("sync-label");
            var originalHtml = syncButton.innerHTML;
            syncButton.disabled = true;
            syncButton.classList.add("comparator__sync-btn--loading");
            if (label) label.textContent = t("syncing", "Sincronizando...");
            syncStatus.style.display = "none";

            try {
                await ApiClient.post("/api/products/sync");
                syncStatus.innerText = t("sync_ok", "Precios actualizados");
                syncStatus.style.display = "inline-block";
                syncStatus.style.color = "#16a34a";
                await loadOptions();
                if (activeCategory) {
                    currentCategoryLabel = slugToLabel(activeCategory);
                    showStoreView(currentCategoryLabel, null, true);
                }
                var qv = (searchInput && searchInput.value) || "";
                if (qv.trim()) renderResults(qv);
                if (lastSelectedGroup) selectProduct(lastSelectedGroup);
            } catch (error) {
                if (error.message === "No autenticado") {
                    window.location.href = "./login.html";
                    return;
                }
                var msg = t("sync_err", "Error al actualizar");
                if (error.message && error.message.indexOf("Failed to fetch") >= 0) {
                    msg = t("sync_err_network", "Sin conexion o timeout");
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
                setTimeout(function () { syncStatus.style.display = "none"; }, 6000);
            }
        });
    }

    function applyQueryFromUrl() {
        var q0 = "";
        try { q0 = (new URLSearchParams(window.location.search).get("q") || "").trim(); } catch (e) { return; }
        if (!q0 || !searchInput) return;
        searchInput.value = q0;
        var filtered = renderResults(q0);
        if (filtered.length === 1) {
            selectProduct(filtered[0]);
            searchResults.hidden = true;
        }
    }

    async function loadSources() {
        try {
            var response = await ApiClient.get("/api/products/sources");
            var visuals = {};
            (response.sources || []).forEach(function (s) {
                visuals[s.nombre] = { image: s.logo || "", emoji: s.emoji || "🏬", accent: s.color || "#475569" };
            });
            supermarketVisuals = visuals;
        } catch (e) {
            console.error("Error cargando fuentes:", e);
        }
    }

    async function loadOptions() {
        try {
            var response = await ApiClient.get("/api/products/comparator-options");
            allOptions = response.items || [];
            groupedProducts = {};
            allOptions.forEach(function (p) {
                var key = p.clave_comparable;
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
        } catch (e) {
            console.error("Error cargando opciones:", e);
        }
    }

    async function init() {
        await loadSources();
        await loadOptions();
        applyQueryFromUrl();
    }

    init();
});