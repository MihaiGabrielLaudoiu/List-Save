// Banner RGPD: solo guarda la eleccion en localStorage (no toca la cookie de sesion HttpOnly)
(function () {
    var STORAGE_CHOICE = "listandsave_cookie_choice";
    var STORAGE_ANALYTICS = "listandsave_analytics";

    function loadHotjar() {
        if (window.__listandsaveHotjarLoaded) {
            return;
        }
        window.__listandsaveHotjarLoaded = true;
        (function (h, o, t, j, a, r) {
            h.hj =
                h.hj ||
                function () {
                    (h.hj.q = h.hj.q || []).push(arguments);
                };
            h._hjSettings = { hjid: 5301097, hjsv: 6 };
            a = o.getElementsByTagName("head")[0];
            r = o.createElement("script");
            r.async = 1;
            r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
            a.appendChild(r);
        })(window, document, "https://static.hotjar.com/c/hotjar-", ".js?sv=");
    }

    function hideBanner(el) {
        if (el && el.parentNode) {
            el.parentNode.removeChild(el);
        }
    }

    function showBanner() {
        if (localStorage.getItem(STORAGE_CHOICE)) {
            return;
        }

        var wrap = document.createElement("div");
        wrap.className = "cookie-banner";
        wrap.setAttribute("role", "dialog");
        wrap.setAttribute("aria-label", "Cookies");
        wrap.innerHTML =
            '<div class="cookie-banner__inner">' +
            '<p class="cookie-banner__text" data-i18n="cookies.banner.text"></p>' +
            '<div class="cookie-banner__actions">' +
            '<a class="cookie-banner__link" href="./cookies.html" data-i18n="cookies.banner.policy"></a>' +
            '<button type="button" class="button button--secondary cookie-banner__reject" data-i18n="cookies.banner.reject"></button>' +
            '<button type="button" class="button button--primary cookie-banner__accept" data-i18n="cookies.banner.accept"></button>' +
            "</div></div>";

        document.body.appendChild(wrap);

        if (typeof TranslationManager !== "undefined" && TranslationManager.translatePage) {
            TranslationManager.translatePage();
        }

        wrap.querySelector(".cookie-banner__accept").addEventListener("click", function () {
            localStorage.setItem(STORAGE_CHOICE, "accepted");
            localStorage.setItem(STORAGE_ANALYTICS, "true");
            loadHotjar();
            hideBanner(wrap);
        });

        wrap.querySelector(".cookie-banner__reject").addEventListener("click", function () {
            localStorage.setItem(STORAGE_CHOICE, "rejected");
            localStorage.setItem(STORAGE_ANALYTICS, "false");
            hideBanner(wrap);
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        if (localStorage.getItem(STORAGE_ANALYTICS) === "true") {
            loadHotjar();
        }
        showBanner();
    });
})();
