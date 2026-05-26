document.addEventListener("DOMContentLoaded", function () {
    var searchInput = document.getElementById("comp-search");
    var clearBtn = document.getElementById("comp-clear");
    var resultsBox = document.getElementById("comp-results");
    var emptyState = document.getElementById("comp-empty");
    var battleArea = document.getElementById("comp-battle");
    var chipsContainer = document.getElementById("comp-chips");

    var allOptions = [];
    var grouped = {};
    var visuals = {};
    var activeCat = "";

    function esc(s) {
        if (!s) return "";
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    function fmtPrice(n) {
        var x = Number(n);
        return isNaN(x) ? "" : x.toFixed(2).replace(".", ",");
    }

    function normUnit(u) {
        if (!u) return "";
        var v = String(u).trim().toLowerCase();
        if (v === "kg" || v.indexOf("kilo") >= 0) return "kg";
        if (v === "l" || v === "litro" || v === "litros") return "L";
        if (v === "100g") return "100 g";
        if (v === "100ml") return "100 ml";
        if (v === "ud") return "ud";
        return String(u).trim();
    }

    function calcUnitPrice(v) {
        var ref = Number(v.precio_referencia);
        var refU = v.unidad_referencia != null ? String(v.unidad_referencia).trim() : "";
        if (ref > 0 && !isNaN(ref) && refU) return { price: ref, unit: normUnit(refU) };
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

    function fmtText(v) {
        if (v.formato) return esc(v.formato);
        if (v.cantidad_unidad && v.unidad_medida) return esc(v.cantidad_unidad + " " + v.unidad_medida);
        return esc(v.nombre);
    }

    var CATEGORY_MAP = {
        "lacteos": ["lact", "leche", "yogur", "nata", "queso", "mantequilla", "kefir", "cuajada", "batido"],
        "carnes": ["carn", "pollo", "ternera", "cerdo", "pavo", "conejo", "cordero", "jamon", "embutido", "salchicha", "hamburguesa", "lomo", "filete"],
        "panaderia": ["panad", "pan ", "bolleria", "croissant", "galleta", "tostada", "harina", "brioche"],
        "bebidas": ["beb", "agua", "refresco", "zumo", "cerveza", "cola", "tonica", "isotonic"],
        "higiene": ["higiene", "champu", "gel de ducha", "desodorante", "dentifrico", "papel higienico", "colonia"],
        "limpieza": ["limpi", "detergente", "lavavajillas", "lejia", "suavizante", "fregasuelos"],
        "frutas": ["fruta", "manzana", "pera", "platano", "naranja", "mandarina", "limon", "sandia", "melon", "uva", "kiwi", "fresa", "cereza"],
        "verduras": ["verd", "tomate", "cebolla", "patata", "lechuga", "zanahoria", "pepino", "calabacin", "berenjena", "pimiento", "ajo"],
        "arroces-pasta": ["arroz", "pasta", "fideo", "lenteja", "garbanzo", "alubia"],
        "aceites-vinagres": ["aceite", "vinagre", "sal marina", "ketchup", "mayonesa", "mostaza", "salsa"],
        "huevos": ["huevo"],
        "conservas": ["conserva", "bonito", "sardina", "esparrago"],
        "congelados": ["congelado", "helado", "pizza"],
        "desayuno": ["cafe", "azucar", "cereal", "miel", "mermelada"],
        "encurtidos": ["pepinillo", "aceituna", "encurtido"],
        "mascota": ["mascota", "perro", "gato", "pienso"],
        "bebe": ["bebe", "panal", "papilla"]
    };

    function catMatch(slug, g) {
        if (!slug) return true;
        var c = String(g.categoria_normalizada || g.categoria || "").toLowerCase();
        var n = String(g.nombre || "").toLowerCase();
        var keywords = CATEGORY_MAP[slug];
        if (keywords) {
            for (var i = 0; i < keywords.length; i++) {
                if (c.indexOf(keywords[i]) >= 0 || n.indexOf(keywords[i]) >= 0) return true;
            }
            return false;
        }
        return c.indexOf(slug) >= 0 || n.indexOf(slug) >= 0;
    }

    function getVisual(name) {
        return visuals[name] || { image: "", emoji: "🏬", accent: "#475569" };
    }

    function toast(msg) {
        var el = document.getElementById("toast-comp");
        if (!el) {
            el = document.createElement("div");
            el.id = "toast-comp";
            el.className = "toast-ok";
            el.setAttribute("role", "status");
            document.body.appendChild(el);
        }
        el.textContent = msg;
        el.classList.add("toast-ok--show");
        clearTimeout(toast._t);
        toast._t = setTimeout(function () { el.classList.remove("toast-ok--show"); }, 2200);
    }

    function addToList(btn) {
        var productId = Number(btn.dataset.id);
        ApiClient.post("/api/lists/mine", {
            product_id: productId,
            cantidad: 1,
            cabecera_id: typeof ListContext !== "undefined" ? ListContext.getCabeceraId() || undefined : undefined
        }).then(function () {
            toast("Producto anadido a tu lista");
        }).catch(function (err) {
            if (err.message === "No autenticado") {
                window.location.href = "./login.html";
            } else {
                toast("No se pudo anadir el producto");
            }
        });
    }

    function renderBattle(group) {
        emptyState.hidden = true;
        battleArea.hidden = false;

        var bySuper = {};
        group.variantes.forEach(function (v) {
            var s = v.nombre_supermercado;
            if (!bySuper[s] || Number(v.precio_actual) < Number(bySuper[s].precio_actual)) {
                bySuper[s] = v;
            }
        });
        var variants = Object.values(bySuper).sort(function (a, b) {
            return Number(a.precio_actual) - Number(b.precio_actual);
        });

        var best = variants[0];
        var worst = variants[variants.length - 1];
        var savings = worst.precio_actual - best.precio_actual;
        var savingsPct = worst.precio_actual > 0 ? Math.round((savings / worst.precio_actual) * 100) : 0;

        var imgHtml = group.imagen
            ? '<img src="' + esc(group.imagen) + '" alt="' + esc(group.nombre) + '" class="comp-battle__product-img">'
            : '<div class="comp-battle__product-emoji">' + (esc(group.emoji) || "\uD83D\uDED2") + "</div>";

        var catLabel = group.categoria_normalizada || group.categoria
            ? '<span class="comp-battle__cat">' + esc(group.categoria_normalizada || group.categoria) + "</span>"
            : "";

        var summaryItems = [
            "<div class=\"comp-battle__stat\"><i class=\"fas fa-store\"></i><div><small>Supermercados</small><strong>" + variants.length + "</strong></div></div>",
            "<div class=\"comp-battle__stat comp-battle__stat--best\"><i class=\"fas fa-trophy\"></i><div><small>Mejor precio</small><strong>" + fmtPrice(best.precio_actual) + " \u20AC</strong></div></div>"
        ];
        if (variants.length > 1 && savings > 0) {
            summaryItems.push("<div class=\"comp-battle__stat comp-battle__stat--save\"><i class=\"fas fa-piggy-bank\"></i><div><small>Ahorro maximo</small><strong>" + fmtPrice(savings) + " \u20AC (-" + savingsPct + "%)</strong></div></div>");
        }

        var cardsHtml = "";
        for (var i = 0; i < variants.length; i++) {
            var v = variants[i];
            var vis = getVisual(v.nombre_supermercado);
            var logo = vis.image ? '<img src="' + esc(vis.image) + '" alt="" class="comp-battle-card__logo">' : '<span class="comp-battle-card__emoji">' + vis.emoji + "</span>";

            var isCheapest = i === 0;
            var isMostExpensive = i === variants.length - 1 && variants.length > 1;

            var cardClass = "comp-battle-card";
            if (isCheapest) cardClass += " comp-battle-card--cheapest";
            else if (isMostExpensive) cardClass += " comp-battle-card--expensive";

            var unitHtml = "";
            var ui = calcUnitPrice(v);
            if (ui) unitHtml = '<span class="comp-battle-card__unit">' + fmtPrice(ui.price) + " \u20AC/" + esc(ui.unit) + "</span>";

            var offerHtml = "";
            if (v.precio_oferta != null && v.precio_oferta !== undefined && Number(v.precio_oferta) > 0) {
                offerHtml = '<span class="comp-battle-card__offer">Oferta ' + Number(v.precio_oferta).toFixed(2) + " \u20AC</span>";
            }

            var diffHtml = "";
            if (isCheapest) {
                diffHtml = '<span class="comp-battle-card__badge comp-battle-card__badge--green">Mas barato</span>';
            } else if (isMostExpensive && variants.length > 2) {
                diffHtml = '<span class="comp-battle-card__badge comp-battle-card__badge--red">Mas caro</span>';
            } else if (!isCheapest) {
                var diff = Number(v.precio_actual) - Number(best.precio_actual);
                var pct = best.precio_actual > 0 ? Math.round((diff / best.precio_actual) * 100) : 0;
                diffHtml = '<span class="comp-battle-card__badge comp-battle-card__badge--red">+' + fmtPrice(diff) + " \u20AC (+" + pct + "%)</span>";
            }

            cardsHtml += '<div class="' + cardClass + '">' +
                '<div class="comp-battle-card__head">' + logo +
                '<span class="comp-battle-card__super">' + esc(v.nombre_supermercado) + "</span></div>" +
                '<div class="comp-battle-card__product-name">' + esc(v.nombre) + "</div>" +
                '<div class="comp-battle-card__format">' + fmtText(v) + "</div>" +
                '<div class="comp-battle-card__price">' + fmtPrice(v.precio_actual) + " \u20AC</div>" +
                unitHtml + offerHtml + diffHtml +
                '<button type="button" class="comp-battle-card__add" data-id="' + v.id_producto + '"><i class="fas fa-plus"></i> Anadir a mi lista</button>' +
                "</div>";

            if (i < variants.length - 1) {
                cardsHtml += '<div class="comp-battle__vs">VS</div>';
            }
        }

        battleArea.innerHTML =
            '<div class="comp-battle__header">' +
                '<button class="comp-battle__back" id="comp-back"><i class="fas fa-arrow-left"></i> Nueva busqueda</button>' +
                '<div class="comp-battle__product">' + imgHtml +
                    '<div class="comp-battle__product-info">' + catLabel +
                        '<h2 class="comp-battle__product-name">' + esc(group.nombre) + "</h2>" +
                    "</div></div>" +
            "</div>" +
            '<div class="comp-battle__summary">' + summaryItems.join("") + "</div>" +
            '<div class="comp-battle__cards">' + cardsHtml + "</div>";

        document.getElementById("comp-back").addEventListener("click", resetView);
        battleArea.querySelectorAll(".comp-battle-card__add").forEach(function (btn) {
            btn.addEventListener("click", function () { addToList(btn); });
        });
    }

    function renderSearch(query) {
        var q = query.toLowerCase().trim();
        resultsBox.innerHTML = "";

        if (!q && !activeCat) {
            resultsBox.hidden = true;
            return;
        }

        var groups = Object.values(grouped).filter(function (g) {
            if (q) {
                var name = (g.nombre || "").toLowerCase().replace(/-/g, ' ');
                var cat  = (g.categoria || "").toLowerCase().replace(/-/g, ' ');
                if (name.indexOf(q) < 0 && cat.indexOf(q) < 0) return false;
            }
            if (activeCat && !catMatch(activeCat, g)) return false;
            return true;
        }).sort(function (a, b) {
            var sa = new Set(a.variantes.map(function(v){ return v.nombre_supermercado; })).size;
            var sb = new Set(b.variantes.map(function(v){ return v.nombre_supermercado; })).size;
            return sb - sa;
        }).slice(0, 8);

        if (groups.length === 0) {
            resultsBox.innerHTML = '<div class="comp-results__empty">No se encontraron productos</div>';
            resultsBox.hidden = false;
            return;
        }

        groups.forEach(function (g) {
            var minP = Math.min.apply(null, g.variantes.map(function (v) { return v.precio_actual; }));
            var uniqueSupers = new Set(g.variantes.map(function (v) { return v.nombre_supermercado; })).size;
            var div = document.createElement("div");
            div.className = "comp-results__item";
            div.innerHTML = '<strong>' + esc(g.nombre) + '</strong><span>En ' + uniqueSupers + ' supers \u00B7 Desde ' + minP.toFixed(2).replace(".", ",") + ' \u20AC</span>';
            div.addEventListener("click", function () {
                renderBattle(g);
                resultsBox.hidden = true;
                searchInput.value = g.nombre;
                clearBtn.hidden = false;
            });
            resultsBox.appendChild(div);
        });
        resultsBox.hidden = false;
    }

    function resetView() {
        battleArea.hidden = true;
        battleArea.innerHTML = "";
        emptyState.hidden = false;
        searchInput.value = "";
        clearBtn.hidden = true;
    }

    searchInput.addEventListener("input", function () {
        clearBtn.hidden = !searchInput.value;
        renderSearch(searchInput.value);
    });

    searchInput.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        var q = searchInput.value.trim().toLowerCase();
        if (!q) return;
        var match = Object.values(grouped).filter(function (g) {
            var nombre = (g.nombre || "").toLowerCase().replace(/-/g, ' ');
            var cat = (g.categoria_normalizada || g.categoria || "").toLowerCase().replace(/-/g, ' ');
            return nombre.indexOf(q) >= 0 || cat.indexOf(q) >= 0;
        });
        if (match.length === 1) {
            renderBattle(match[0]);
            resultsBox.hidden = true;
        }
    });

    clearBtn.addEventListener("click", function () {
        searchInput.value = "";
        clearBtn.hidden = true;
        resultsBox.hidden = true;
        if (battleArea.hidden) emptyState.hidden = false;
    });

    document.addEventListener("click", function (e) {
        if (!searchInput.contains(e.target) && !resultsBox.contains(e.target)) {
            resultsBox.hidden = true;
        }
    });

    chipsContainer.querySelectorAll(".comp-chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
            chipsContainer.querySelectorAll(".comp-chip").forEach(function (c) { c.classList.remove("active"); });
            chip.classList.add("active");
            activeCat = chip.dataset.cat || "";
            renderSearch(searchInput.value);
        });
    });

    document.querySelectorAll(".comp-empty__chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
            searchInput.value = chip.dataset.q;
            clearBtn.hidden = false;
            renderSearch(chip.dataset.q);
        });
    });

    try {
        var urlQ = new URLSearchParams(window.location.search).get("q");
        if (urlQ && urlQ.trim()) {
            searchInput.value = urlQ.trim();
            clearBtn.hidden = false;
        }
    } catch (e) {}

    async function loadSources() {
        try {
            var res = await ApiClient.get("/api/products/sources");
            var v = {};
            (res.sources || []).forEach(function (s) {
                v[s.nombre] = { image: s.logo || "", emoji: s.emoji || "\uD83C\uDFEC", accent: s.color || "#475569" };
            });
            visuals = v;
        } catch (e) {
            console.error("Error cargando fuentes:", e);
        }
    }

    async function loadOptions() {
        try {
            var res = await ApiClient.get("/api/products/comparator-options");
            allOptions = res.items || [];
            grouped = {};
            allOptions.forEach(function (p) {
                var subcat = (p.subcategoria || "").trim().toLowerCase();
                var key = subcat || p.nombre_comparable || p.clave_comparable;
                var displayName = subcat
                    ? subcat.replace(/-/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); })
                    : p.nombre_comparable;
                if (!grouped[key]) {
                    grouped[key] = {
                        clave: key,
                        nombre: displayName,
                        categoria: p.categoria || p.categoria_normalizada,
                        categoria_normalizada: p.categoria_normalizada,
                        subcategoria: subcat || null,
                        imagen: p.imagen_resuelta,
                        emoji: p.emoji_sugerido,
                        variantes: []
                    };
                }
                grouped[key].variantes.push(p);
            });
        } catch (e) {
            console.error("Error cargando opciones:", e);
        }
    }

    async function init() {
        await loadSources();
        await loadOptions();
        if (searchInput.value.trim()) {
            renderSearch(searchInput.value);
        }
    }

    init();
});