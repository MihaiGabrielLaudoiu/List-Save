// Pagina Mi Lista: varias listas con nombre, tabla estilo nota y mejor tienda/precio
document.addEventListener("DOMContentLoaded", function () {
    var tableBody = document.getElementById("list-tbody");
    var addInput = document.getElementById("add-item-input");
    var addButton = document.getElementById("add-item-btn");
    var suggestionsBox = document.getElementById("add-item-suggestions");
    var listTabsEl = document.getElementById("list-tabs");
    var listTitleEl = document.getElementById("list-title");
    var btnNewList = document.getElementById("btn-new-list");
    var btnRenameList = document.getElementById("btn-rename-list");
    var btnDeleteList = document.getElementById("btn-delete-list");

    var selectedProductId = null;
    var latestSuggestions = [];
    var searchTimeout = null;
    var cabeceras = [];
    var activeCabeceraId = null;
    var activeCat = "";
    var lastListItems = [];
    var wizardMeta = null;
    var wizardStep = 0;
    var wizardCat = "";
    var wizardSub = "";

    var listWizardTiles = document.getElementById("list-wizard-tiles");
    var listWizardStepLabel = document.getElementById("list-wizard-step-label");
    var listWizardReset = document.getElementById("list-wizard-reset");
    var listTfoot = document.getElementById("list-tfoot");
    var listTotalAmount = document.getElementById("list-total-amount");

    async function t(keys) {
        var lang = typeof SessionManager !== "undefined" ? SessionManager.getCurrentLanguage() : "es";
        var tr = await TranslationManager.loadTranslations(lang);
        var parts = keys.split(".");
        var v = TranslationManager.getTranslatedValue(tr, parts);
        return v || keys;
    }

    function productMatchesCat(productCategoria, chip) {
        if (!chip) {
            return true;
        }
        var c = (productCategoria || "").toLowerCase();
        if (chip === "lacteos") {
            return c.indexOf("lacteo") >= 0;
        }
        if (chip === "carnes") {
            return c.indexOf("carne") >= 0 || c.indexOf("pollo") >= 0 || c.indexOf("aves") >= 0;
        }
        if (chip === "frutas") {
            return c.indexOf("fruta") >= 0;
        }
        if (chip === "verduras") {
            return c.indexOf("verdura") >= 0 || c.indexOf("hortaliza") >= 0 || c.indexOf("fruta-verdura") >= 0;
        }
        if (chip === "panaderia") {
            return c.indexOf("pan") >= 0 || c.indexOf("boller") >= 0;
        }
        if (chip === "bebidas") {
            return c.indexOf("bebida") >= 0 || c.indexOf("agua") >= 0;
        }
        if (chip === "higiene") {
            return c.indexOf("higiene") >= 0;
        }
        if (chip === "limpieza") {
            return c.indexOf("limpieza") >= 0;
        }
        return c.indexOf(chip) >= 0;
    }

    function formatEuro(value) {
        if (value === null || value === undefined || value === "") {
            return null;
        }
        var n = Number(value);
        if (isNaN(n)) {
            return null;
        }
        return n.toFixed(2) + " \u20AC";
    }

    async function loadCabeceras() {
        try {
            var data = await ApiClient.get("/api/lists/cabeceras");
            cabeceras = data.cabeceras || [];
            var stored = typeof ListContext !== "undefined" ? ListContext.getCabeceraId() : null;
            if (stored && cabeceras.some(function (c) { return c.cabecera_id === stored; })) {
                activeCabeceraId = stored;
            } else if (cabeceras.length > 0) {
                activeCabeceraId = cabeceras[0].cabecera_id;
                if (typeof ListContext !== "undefined") {
                    ListContext.setCabeceraId(activeCabeceraId);
                }
            } else {
                activeCabeceraId = null;
            }
            renderTabs();
            syncTitle();
        } catch (err) {
            if (err.message === "No autenticado") {
                window.location.href = "./login.html";
                return;
            }
            console.error(err);
            await AppModal.alert(await t("my_list_page.err_load_lists"));
            cabeceras = [];
            activeCabeceraId = null;
            renderTabs();
            syncTitle();
        }
    }

    function syncTitle() {
        var c = cabeceras.find(function (x) { return x.cabecera_id === activeCabeceraId; });
        if (listTitleEl && c) {
            listTitleEl.textContent = c.nombre;
        }
    }

    function renderTabs() {
        if (!listTabsEl) {
            return;
        }
        var html = cabeceras.map(function (c) {
            var isActive = c.cabecera_id === activeCabeceraId;
            var del =
                cabeceras.length > 1
                    ? "<button type=\"button\" class=\"list-tab__close\" data-cabecera-id=\"" +
                      c.cabecera_id +
                      "\" aria-label=\"cerrar\">&times;</button>"
                    : "";
            return (
                "<div class=\"list-tab-row" +
                (isActive ? " list-tab-row--active" : "") +
                "\" data-cabecera-id=\"" +
                c.cabecera_id +
                "\">" +
                "<button type=\"button\" class=\"list-tab__main\">" +
                escapeHtml(c.nombre) +
                "</button>" +
                del +
                "</div>"
            );
        }).join("");
        listTabsEl.innerHTML = html;
        updateToolbar();

        listTabsEl.querySelectorAll(".list-tab-row").forEach(function (row) {
            row.addEventListener("click", function (e) {
                if (e.target.closest(".list-tab__close")) {
                    return;
                }
                var id = Number(row.getAttribute("data-cabecera-id"));
                if (id !== activeCabeceraId) {
                    activeCabeceraId = id;
                    if (typeof ListContext !== "undefined") {
                        ListContext.setCabeceraId(id);
                    }
                    renderTabs();
                    syncTitle();
                    loadMyList();
                }
            });
        });

        listTabsEl.querySelectorAll(".list-tab__close").forEach(function (btn) {
            btn.addEventListener("click", async function (e) {
                e.stopPropagation();
                var id = Number(btn.getAttribute("data-cabecera-id"));
                var msg = await t("my_list_page.delete_list_confirm");
                if (!(await AppModal.confirm(msg))) {
                    return;
                }
                try {
                    await ApiClient.delete("/api/lists/cabeceras/" + id);
                    if (id === activeCabeceraId) {
                        activeCabeceraId = null;
                    }
                    await loadCabeceras();
                    await loadMyList();
                } catch (err) {
                    await AppModal.alert(err.message || (await t("my_list_page.err_generic")));
                }
            });
        });
    }

    function updateToolbar() {
        if (btnDeleteList) {
            btnDeleteList.disabled = cabeceras.length <= 1;
            btnDeleteList.setAttribute("aria-disabled", cabeceras.length <= 1 ? "true" : "false");
        }
    }

    function escapeHtml(s) {
        if (!s) {
            return "";
        }
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    async function loadMyList() {
        if (!activeCabeceraId) {
            await loadCabeceras();
        }
        if (!activeCabeceraId) {
            if (tableBody) {
                tableBody.innerHTML =
                    "<tr><td colspan=\"7\" class=\"shopping-table__empty\">" +
                    (await t("my_list_page.empty")) +
                    "</td></tr>";
            }
            return;
        }
        try {
            var response = await ApiClient.get("/api/lists/mine?cabecera_id=" + activeCabeceraId);
            lastListItems = response.items || [];
            renderList(lastListItems);
        } catch (error) {
            if (error.message === "No autenticado") {
                window.location.href = "./login.html";
                return;
            }
            console.error("Error al cargar la lista:", error);
            await AppModal.alert(await t("my_list_page.err_generic"));
        }
    }

    async function renderList(items) {
        if (!tableBody) {
            return;
        }
        var filtered = items.filter(function (item) {
            return productMatchesCat(item.categoria, activeCat);
        });

        if (filtered.length === 0) {
            var emptyMsg = await t("my_list_page.empty");
            tableBody.innerHTML =
                "<tr><td colspan=\"7\" class=\"shopping-table__empty\">" + emptyMsg + "</td></tr>";
            if (listTfoot) {
                listTfoot.hidden = true;
            }
            return;
        }

        var noPrice = await t("my_list_page.no_price");
        var noStore = await t("my_list_page.no_store");
        var removeLabel = await t("my_list_page.remove");

        var sumTotal = 0;
        var html = filtered
            .map(function (item) {
                var unit = Number(item.mejor_precio);
                var qty = Number(item.cantidad) || 1;
                var hasUnit = !isNaN(unit) && unit > 0;
                var lineTotal = hasUnit ? unit * qty : null;
                if (lineTotal != null && !isNaN(lineTotal)) {
                    sumTotal += lineTotal;
                }
                var precioUnit = formatEuro(item.mejor_precio);
                var precioLinea = lineTotal != null ? formatEuro(lineTotal) : noPrice;
                var tienda = item.mejor_tienda ? escapeHtml(item.mejor_tienda) : noStore;
                var minusDisabled = qty <= 1 ? " disabled" : "";
                return (
                    "<tr>" +
                    "<td>" +
                    escapeHtml(item.nombre) +
                    "</td>" +
                    "<td class=\"qty-cell\"><div class=\"qty-controls\">" +
                    "<button type=\"button\" class=\"shopping-table__qty-btn qty-minus\" data-list-id=\"" +
                    item.list_id +
                    "\" data-cantidad=\"" +
                    qty +
                    "\"" +
                    minusDisabled +
                    " aria-label=\"-\">−</button>" +
                    "<span class=\"shopping-table__qty-val\">" +
                    qty +
                    "</span>" +
                    "<button type=\"button\" class=\"shopping-table__qty-btn qty-plus\" data-list-id=\"" +
                    item.list_id +
                    "\" data-cantidad=\"" +
                    qty +
                    "\" aria-label=\"+\">+</button></div></td>" +
                    "<td>" +
                    escapeHtml(item.marca || "—") +
                    "</td>" +
                    "<td class=\"shopping-table__price\">" +
                    (precioUnit ? precioUnit : noPrice) +
                    "</td>" +
                    "<td class=\"shopping-table__price shopping-table__line-total\">" +
                    precioLinea +
                    "</td>" +
                    "<td class=\"shopping-table__store\"><strong>" +
                    tienda +
                    "</strong></td>" +
                    "<td><div class=\"actions\">" +
                    "<button type=\"button\" class=\"button button--secondary delete-item\" data-list-id=\"" +
                    item.list_id +
                    "\">" +
                    removeLabel +
                    "</button></div></td>" +
                    "</tr>"
                );
            })
            .join("");

        tableBody.innerHTML = html;
        if (listTfoot && listTotalAmount) {
            listTfoot.hidden = false;
            listTotalAmount.textContent = sumTotal > 0 ? sumTotal.toFixed(2) + " \u20AC" : noPrice;
        }
        bindListActions();
    }

    async function persistQty(listId, newQty) {
        try {
            await ApiClient.put("/api/lists/mine/" + listId, { cantidad: newQty });
            await loadMyList();
            await loadCabeceras();
        } catch (error) {
            await AppModal.alert(await t("my_list_page.err_qty_update"));
        }
    }

    function bindListActions() {
        document.querySelectorAll(".delete-item").forEach(function (button) {
            button.addEventListener("click", async function () {
                var listId = Number(button.getAttribute("data-list-id"));
                try {
                    await ApiClient.delete("/api/lists/mine/" + listId);
                    await loadMyList();
                    await loadCabeceras();
                } catch (error) {
                    await AppModal.alert(await t("my_list_page.err_delete_product"));
                }
            });
        });

        document.querySelectorAll(".qty-plus").forEach(function (button) {
            button.addEventListener("click", function () {
                var listId = Number(button.getAttribute("data-list-id"));
                var q = Number(button.getAttribute("data-cantidad")) || 1;
                persistQty(listId, q + 1);
            });
        });

        document.querySelectorAll(".qty-minus").forEach(function (button) {
            button.addEventListener("click", function () {
                if (button.disabled) {
                    return;
                }
                var listId = Number(button.getAttribute("data-list-id"));
                var q = Number(button.getAttribute("data-cantidad")) || 1;
                if (q <= 1) {
                    return;
                }
                persistQty(listId, q - 1);
            });
        });
    }

    async function loadWizardMeta() {
        try {
            wizardMeta = await ApiClient.get("/api/products/catalog-meta");
        } catch (e) {
            wizardMeta = null;
            console.error(e);
        }
    }

    function renderWizardStep0() {
        wizardStep = 0;
        wizardCat = "";
        wizardSub = "";
        if (!listWizardTiles || !listWizardStepLabel) {
            return;
        }
        listWizardStepLabel.textContent = "";
        if (!wizardMeta || !wizardMeta.categories || wizardMeta.categories.length === 0) {
            listWizardTiles.innerHTML =
                "<span class=\"list-add-wizard__tile\" style=\"cursor:default;opacity:0.75\">" +
                "Sin categorias en el catalogo" +
                "</span>";
            return;
        }
        listWizardTiles.innerHTML = wizardMeta.categories
            .map(function (c) {
                return (
                    "<button type=\"button\" class=\"list-add-wizard__tile\" data-wizard-cat=\"" +
                    escapeHtml(c) +
                    "\">" +
                    escapeHtml(c) +
                    "</button>"
                );
            })
            .join("");
        listWizardTiles.querySelectorAll("[data-wizard-cat]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                wizardCat = btn.getAttribute("data-wizard-cat") || "";
                renderWizardStep1();
            });
        });
    }

    function renderWizardStep1() {
        wizardStep = 1;
        if (!listWizardTiles || !listWizardStepLabel) {
            return;
        }
        listWizardStepLabel.textContent = wizardCat;
        var subs =
            wizardMeta && wizardMeta.subcategoriesByCat && wizardMeta.subcategoriesByCat[wizardCat]
                ? wizardMeta.subcategoriesByCat[wizardCat]
                : [];
        var buttons = [];
        buttons.push(
            "<button type=\"button\" class=\"list-add-wizard__tile\" data-wizard-sub=\"\">(Todos)</button>"
        );
        subs.forEach(function (s) {
            buttons.push(
                "<button type=\"button\" class=\"list-add-wizard__tile\" data-wizard-sub=\"" +
                escapeHtml(s) +
                "\">" +
                escapeHtml(s) +
                "</button>"
            );
        });
        listWizardTiles.innerHTML = buttons.join("");
        listWizardTiles.querySelectorAll("[data-wizard-sub]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                wizardSub = btn.getAttribute("data-wizard-sub") || "";
                loadWizardProducts();
            });
        });
    }

    async function loadWizardProducts() {
        wizardStep = 2;
        if (!listWizardTiles || !listWizardStepLabel) {
            return;
        }
        listWizardStepLabel.textContent = wizardCat + (wizardSub ? " · " + wizardSub : "");
        listWizardTiles.innerHTML = "<span class=\"list-add-wizard__tile\" style=\"cursor:wait\">…</span>";
        try {
            var url =
                "/api/products/list-wizard-products?categoria=" +
                encodeURIComponent(wizardCat) +
                (wizardSub ? "&subcategoria=" + encodeURIComponent(wizardSub) : "");
            var data = await ApiClient.get(url);
            var items = data.items || [];
            if (items.length === 0) {
                listWizardTiles.innerHTML =
                    "<span class=\"list-add-wizard__tile\" style=\"cursor:default\">Sin productos</span>";
                return;
            }
            listWizardTiles.innerHTML = items
                .map(function (p) {
                    var pr = formatEuro(p.mejor_precio);
                    var ti = p.mejor_tienda ? escapeHtml(p.mejor_tienda) : "—";
                    return (
                        "<button type=\"button\" class=\"list-add-wizard__tile\" style=\"text-align:left\" data-add-id=\"" +
                        p.id_producto +
                        "\">" +
                        "<strong>" +
                        escapeHtml(p.nombre) +
                        "</strong> · " +
                        escapeHtml(p.marca || "") +
                        "<br><small>" +
                        (pr || "?") +
                        " · " +
                        ti +
                        "</small></button>"
                    );
                })
                .join("");
            listWizardTiles.querySelectorAll("[data-add-id]").forEach(function (btn) {
                btn.addEventListener("click", async function () {
                    var pid = Number(btn.getAttribute("data-add-id"));
                    if (!activeCabeceraId) {
                        await loadCabeceras();
                    }
                    if (!activeCabeceraId) {
                        await AppModal.alert(await t("my_list_page.msg_no_active_list"));
                        return;
                    }
                    try {
                        await ApiClient.post("/api/lists/mine", {
                            product_id: pid,
                            cantidad: 1,
                            cabecera_id: activeCabeceraId
                        });
                        await loadCabeceras();
                        await loadMyList();
                        renderWizardStep0();
                    } catch (err) {
                        await AppModal.alert(await t("my_list_page.err_add_product"));
                    }
                });
            });
        } catch (err) {
            listWizardTiles.innerHTML =
                "<span class=\"list-add-wizard__tile\" style=\"color:#b91c1c\">Error al cargar</span>";
        }
    }

    function hideSuggestions() {
        if (!suggestionsBox) {
            return;
        }
        suggestionsBox.innerHTML = "";
        suggestionsBox.hidden = true;
    }

    function selectSuggestion(product) {
        if (!addInput || !product) {
            return;
        }
        addInput.value = product.nombre;
        selectedProductId = product.id_producto;
        hideSuggestions();
    }

    function renderSuggestions(products) {
        if (!suggestionsBox) {
            return;
        }
        latestSuggestions = products;
        if (products.length === 0) {
            suggestionsBox.innerHTML =
                '<div class="add-item__suggestion add-item__suggestion--empty">No se encontraron coincidencias.</div>';
            suggestionsBox.hidden = false;
            return;
        }
        var html = products.slice(0, 6).map(function (product) {
            var brand = product.marca ? product.marca : "Sin marca";
            return (
                '<button type="button" class="add-item__suggestion" data-product-id="' +
                product.id_producto +
                '">' +
                '<span class="add-item__suggestion-name">' +
                escapeHtml(product.nombre) +
                "</span>" +
                '<span class="add-item__suggestion-meta">' +
                escapeHtml(brand) +
                "</span></button>"
            );
        }).join("");
        suggestionsBox.innerHTML = html;
        suggestionsBox.hidden = false;
        suggestionsBox.querySelectorAll(".add-item__suggestion[data-product-id]").forEach(function (button) {
            button.addEventListener("click", function () {
                var productId = Number(button.getAttribute("data-product-id"));
                var product = latestSuggestions.find(function (item) {
                    return item.id_producto === productId;
                });
                selectSuggestion(product);
            });
        });
    }

    async function searchCatalog(query) {
        if (!query) {
            selectedProductId = null;
            hideSuggestions();
            return;
        }
        try {
            var catalog = await ApiClient.get("/api/products/catalog?search=" + encodeURIComponent(query));
            renderSuggestions(catalog.products || []);
        } catch (error) {
            console.error("No se pudo buscar en el catalogo:", error);
            hideSuggestions();
        }
    }

    async function addByName() {
        var name = addInput ? addInput.value.trim() : "";
        if (!name) {
            await AppModal.alert(await t("my_list_page.msg_type_product"));
            return;
        }
        if (!activeCabeceraId) {
            await loadCabeceras();
        }
        if (!activeCabeceraId) {
            await AppModal.alert(await t("my_list_page.msg_no_active_list"));
            return;
        }
        try {
            var productId = selectedProductId;
            if (!productId) {
                var catalog = await ApiClient.get("/api/products/catalog?search=" + encodeURIComponent(name));
                if (!catalog.products || catalog.products.length === 0) {
                    await AppModal.alert(await t("my_list_page.msg_product_not_found"));
                    return;
                }
                productId = catalog.products[0].id_producto;
            }
            await ApiClient.post("/api/lists/mine", {
                product_id: productId,
                cantidad: 1,
                cabecera_id: activeCabeceraId
            });
            addInput.value = "";
            selectedProductId = null;
            latestSuggestions = [];
            hideSuggestions();
            await loadCabeceras();
            await loadMyList();
        } catch (error) {
            await AppModal.alert(await t("my_list_page.err_add_product"));
        }
    }

    if (addInput) {
        addInput.addEventListener("input", function () {
            var query = addInput.value.trim();
            selectedProductId = null;
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            searchTimeout = setTimeout(function () {
                searchCatalog(query);
            }, 180);
        });
        addInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                if (!selectedProductId && latestSuggestions.length > 0) {
                    selectSuggestion(latestSuggestions[0]);
                    return;
                }
                addByName();
            }
        });
    }

    document.addEventListener("click", function (event) {
        if (!addInput || !suggestionsBox) {
            return;
        }
        if (!addInput.contains(event.target) && !suggestionsBox.contains(event.target)) {
            hideSuggestions();
        }
    });

    if (addButton) {
        addButton.addEventListener("click", function () {
            addByName();
        });
    }

    var listCats = document.getElementById("list-cats");
    if (listCats) {
        listCats.querySelectorAll(".cat-chip").forEach(function (chip) {
            chip.addEventListener("click", function () {
                listCats.querySelectorAll(".cat-chip").forEach(function (c) {
                    c.classList.remove("active");
                });
                chip.classList.add("active");
                activeCat = chip.getAttribute("data-cat") || "";
                renderList(lastListItems);
            });
        });
    }

    if (btnNewList) {
        btnNewList.addEventListener("click", async function () {
            var def = await t("my_list_page.new_list_prompt");
            var nombre = await AppModal.prompt(def, "");
            if (nombre == null || !nombre.trim()) {
                return;
            }
            try {
                var created = await ApiClient.post("/api/lists/cabeceras", { nombre: nombre.trim() });
                activeCabeceraId = created.cabecera_id;
                if (typeof ListContext !== "undefined") {
                    ListContext.setCabeceraId(activeCabeceraId);
                }
                await loadCabeceras();
                await loadMyList();
            } catch (e) {
                await AppModal.alert(e.message || (await t("my_list_page.err_generic")));
            }
        });
    }

    if (btnRenameList) {
        btnRenameList.addEventListener("click", async function () {
            if (!activeCabeceraId) {
                return;
            }
            var c = cabeceras.find(function (x) { return x.cabecera_id === activeCabeceraId; });
            var def = await t("my_list_page.rename_prompt");
            var nombre = await AppModal.prompt(def, c ? c.nombre : "");
            if (nombre == null || !nombre.trim()) {
                return;
            }
            try {
                await ApiClient.put("/api/lists/cabeceras/" + activeCabeceraId, { nombre: nombre.trim() });
                await loadCabeceras();
                syncTitle();
            } catch (e) {
                await AppModal.alert(e.message || (await t("my_list_page.err_generic")));
            }
        });
    }

    if (btnDeleteList) {
        btnDeleteList.addEventListener("click", async function () {
            if (!activeCabeceraId || cabeceras.length <= 1) {
                return;
            }
            var msg = await t("my_list_page.delete_list_confirm");
            if (!(await AppModal.confirm(msg))) {
                return;
            }
            try {
                await ApiClient.delete("/api/lists/cabeceras/" + activeCabeceraId);
                activeCabeceraId = null;
                if (typeof ListContext !== "undefined") {
                    ListContext.setCabeceraId(null);
                }
                await loadCabeceras();
                if (cabeceras.length > 0) {
                    activeCabeceraId = cabeceras[0].cabecera_id;
                    ListContext.setCabeceraId(activeCabeceraId);
                }
                renderTabs();
                syncTitle();
                await loadMyList();
            } catch (e) {
                await AppModal.alert(e.message || (await t("my_list_page.err_generic")));
            }
        });
    }

    if (listWizardReset) {
        listWizardReset.addEventListener("click", function () {
            renderWizardStep0();
        });
    }

    async function init() {
        if (typeof TranslationManager !== "undefined") {
            await TranslationManager.translatePage();
        }
        await loadWizardMeta();
        renderWizardStep0();
        await loadCabeceras();
        await loadMyList();
    }

    init();
});
