document.addEventListener("DOMContentLoaded", function () {
    const root = document.getElementById("home-stores-root");

    if (!root || typeof ApiClient === "undefined") {
        return;
    }

    function escapeAttr(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;");
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/"/g, "&quot;");
    }

    async function load() {
        try {
            const response = await ApiClient.get("/api/products/sources");
            const sources = response.sources || [];

            root.innerHTML = sources
                .map(function (source) {
                    const slug = String(source.slug || "").toLowerCase();
                    const altKey = "stores.alt." + slug;
                    return (
                        '<div class="stores__logo-item">' +
                        '<img src="' +
                        escapeAttr(source.logo) +
                        '" alt="" class="stores__logo-img" data-i18n-alt="' +
                        escapeAttr(altKey) +
                        '">' +
                        "<span>" +
                        escapeHtml(source.nombre) +
                        "</span>" +
                        "</div>"
                    );
                })
                .join("");

            if (typeof TranslationManager !== "undefined" && TranslationManager.translatePage) {
                await TranslationManager.translatePage();
            }
        } catch (error) {
            console.error("No se pudieron cargar los supermercados:", error);
            root.innerHTML = "<p class=\"stores__error\">" + escapeHtml("No se pudieron cargar las fuentes.") + "</p>";
        }
    }

    load();
});
