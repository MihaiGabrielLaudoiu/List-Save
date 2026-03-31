(function () {
    document.addEventListener("DOMContentLoaded", function () {
        if (window.location.pathname.indexOf("comparador.html") !== -1) {
            return;
        }

        var a = document.createElement("a");
        a.href = "./comparador.html";
        a.className = "fab-global";
        a.setAttribute("data-i18n-title", "fab.comparator_tooltip");

        var span = document.createElement("span");
        span.className = "fab-global__icon";
        span.setAttribute("aria-hidden", "true");
        span.textContent = "+";
        a.appendChild(span);

        document.body.appendChild(a);

        if (!window.TranslationManager || !TranslationManager.loadTranslations) {
            return;
        }

        var lang = "es";
        if (window.SessionManager && typeof SessionManager.getCurrentLanguage === "function") {
            lang = SessionManager.getCurrentLanguage();
        }

        TranslationManager.loadTranslations(lang)
            .then(function (tr) {
                var tip = TranslationManager.getTranslatedValue(tr, ["fab", "comparator_tooltip"]);
                if (tip) {
                    a.title = tip;
                }
                var aria = TranslationManager.getTranslatedValue(tr, ["fab", "comparator_aria"]);
                if (aria) {
                    a.setAttribute("aria-label", aria);
                }
            })
            .catch(function () {});
    });
})();
