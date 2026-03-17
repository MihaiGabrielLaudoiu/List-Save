// Modales reutilizables (sustituyen alert / confirm / prompt del navegador)
(function () {
    var dialogEl = null;
    var titleEl = null;
    var messageEl = null;
    var fieldWrap = null;
    var inputEl = null;
    var actionsEl = null;
    var lastFocus = null;
    var keyHandler = null;
    var resolvePromise = null;
    var pendingMode = null;

    function labelText(key, fallback) {
        if (typeof TranslationManager === "undefined" || !TranslationManager.getTranslatedValue) {
            return fallback;
        }
        var lang =
            typeof SessionManager !== "undefined" && SessionManager.getCurrentLanguage
                ? SessionManager.getCurrentLanguage()
                : "es";
        var cache = TranslationManager.translationsCache && TranslationManager.translationsCache[lang];
        if (!cache) {
            return fallback;
        }
        var v = TranslationManager.getTranslatedValue(cache, ["modal", key]);
        return v || fallback;
    }

    function finish(result) {
        if (keyHandler) {
            document.removeEventListener("keydown", keyHandler);
            keyHandler = null;
        }

        if (dialogEl && dialogEl.open) {
            dialogEl.close();
        }

        if (fieldWrap) {
            fieldWrap.hidden = true;
        }

        var fn = resolvePromise;
        var mode = pendingMode;
        resolvePromise = null;
        pendingMode = null;

        if (lastFocus && typeof lastFocus.focus === "function") {
            try {
                lastFocus.focus();
            } catch (e) {
                /* ignorar */
            }
        }
        lastFocus = null;

        if (!fn) {
            return;
        }

        if (mode === "prompt") {
            fn(result);
        } else if (mode === "confirm") {
            fn(!!result);
        } else {
            fn();
        }
    }

    function ensureDom() {
        if (dialogEl) {
            return;
        }

        dialogEl = document.createElement("dialog");
        dialogEl.id = "app-modal-dialog";
        dialogEl.className = "app-modal";
        dialogEl.setAttribute("aria-modal", "true");

        dialogEl.innerHTML =
            '<div class="app-modal__panel">' +
            '<button type="button" class="app-modal__close" aria-label="Cerrar">&times;</button>' +
            '<h2 class="app-modal__title" id="app-modal-title"></h2>' +
            '<p class="app-modal__message" id="app-modal-message"></p>' +
            '<div class="app-modal__field" id="app-modal-field" hidden>' +
            '<input type="text" id="app-modal-input" class="app-modal__input" autocomplete="off" />' +
            "</div>" +
            '<div class="app-modal__actions" id="app-modal-actions"></div>' +
            "</div>";

        document.body.appendChild(dialogEl);

        titleEl = dialogEl.querySelector("#app-modal-title");
        messageEl = dialogEl.querySelector("#app-modal-message");
        fieldWrap = dialogEl.querySelector("#app-modal-field");
        inputEl = dialogEl.querySelector("#app-modal-input");
        actionsEl = dialogEl.querySelector("#app-modal-actions");

        dialogEl.addEventListener("cancel", function (ev) {
            ev.preventDefault();
            if (pendingMode === "prompt") {
                finish(null);
            } else if (pendingMode === "confirm") {
                finish(false);
            } else {
                finish();
            }
        });

        dialogEl.querySelector(".app-modal__close").addEventListener("click", function () {
            if (pendingMode === "prompt") {
                finish(null);
            } else if (pendingMode === "confirm") {
                finish(false);
            } else {
                finish();
            }
        });
    }

    function wireEnterSubmit() {
        keyHandler = function (ev) {
            if (ev.key === "Enter" && pendingMode === "prompt" && document.activeElement === inputEl) {
                ev.preventDefault();
                finish(inputEl.value);
            }
        };
        document.addEventListener("keydown", keyHandler);
    }

    function openDialog(title, message, showInput, defaultValue, buttons) {
        ensureDom();

        lastFocus = document.activeElement;

        titleEl.textContent = title || "";
        messageEl.textContent = message || "";

        if (showInput) {
            fieldWrap.hidden = false;
            inputEl.value = defaultValue != null ? String(defaultValue) : "";
        } else {
            fieldWrap.hidden = true;
        }

        actionsEl.innerHTML = "";
        buttons.forEach(function (btn) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = btn.primary ? "button button--primary" : "button button--secondary";
            b.textContent = btn.label;
            b.addEventListener("click", btn.onClick);
            actionsEl.appendChild(b);
        });

        if (showInput) {
            wireEnterSubmit();
        }

        if (typeof dialogEl.showModal === "function") {
            dialogEl.showModal();
        } else {
            dialogEl.setAttribute("open", "");
            dialogEl.style.position = "fixed";
            dialogEl.style.zIndex = "10050";
            dialogEl.style.top = "50%";
            dialogEl.style.left = "50%";
            dialogEl.style.transform = "translate(-50%, -50%)";
            dialogEl.style.margin = "0";
            dialogEl.style.border = "none";
            dialogEl.style.background = "transparent";
        }

        window.setTimeout(function () {
            if (showInput) {
                inputEl.focus();
                inputEl.select();
            } else {
                var firstBtn = actionsEl.querySelector("button");
                if (firstBtn) {
                    firstBtn.focus();
                }
            }
        }, 10);
    }

    function alert(message, options) {
        options = options || {};
        return new Promise(function (resolve) {
            resolvePromise = resolve;
            pendingMode = "alert";
            var ok = labelText("ok", "Aceptar");
            openDialog(options.title || labelText("notice", "Aviso"), message, false, null, [
                {
                    label: ok,
                    primary: true,
                    onClick: function () {
                        finish();
                    }
                }
            ]);
        });
    }

    function confirm(message, options) {
        options = options || {};
        return new Promise(function (resolve) {
            resolvePromise = resolve;
            pendingMode = "confirm";
            var yes = options.confirmLabel || labelText("confirm", "Confirmar");
            var no = options.cancelLabel || labelText("cancel", "Cancelar");
            openDialog(options.title || labelText("confirm_title", "Confirmar accion"), message, false, null, [
                {
                    label: no,
                    primary: false,
                    onClick: function () {
                        finish(false);
                    }
                },
                {
                    label: yes,
                    primary: true,
                    onClick: function () {
                        finish(true);
                    }
                }
            ]);
        });
    }

    function prompt(message, defaultValue, options) {
        options = options || {};
        return new Promise(function (resolve) {
            resolvePromise = resolve;
            pendingMode = "prompt";
            var ok = labelText("ok", "Aceptar");
            var cancel = labelText("cancel", "Cancelar");
            openDialog(options.title || labelText("input_title", "Entrada"), message, true, defaultValue, [
                {
                    label: cancel,
                    primary: false,
                    onClick: function () {
                        finish(null);
                    }
                },
                {
                    label: ok,
                    primary: true,
                    onClick: function () {
                        finish(inputEl.value);
                    }
                }
            ]);
        });
    }

    window.AppModal = {
        alert: alert,
        confirm: confirm,
        prompt: prompt
    };
})();
