document.addEventListener("DOMContentLoaded", function () {
    const settingsForm = document.getElementById("settingsForm");

    if (!settingsForm) {
        return;
    }

    var LS_KEY = "ls_settings";

    function loadFromLocal() {
        try {
            return JSON.parse(localStorage.getItem(LS_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    function saveToLocal(data) {
        try {
            var current = loadFromLocal();
            Object.keys(data).forEach(function (k) {
                if (data[k] !== undefined && data[k] !== null) {
                    current[k] = data[k];
                }
            });
            localStorage.setItem(LS_KEY, JSON.stringify(current));
        } catch (e) {}
    }

    async function settingsT(keyPath) {
        const lang = SessionManager.getCurrentLanguage();
        const tr = await TranslationManager.loadTranslations(lang);
        return TranslationManager.getTranslatedValue(tr, keyPath.split(".")) || keyPath;
    }

    const tabs = document.querySelectorAll(".tab-button");
    const contents = document.querySelectorAll(".tab-content");

    const languageInput = document.getElementById("language");
    const postalCodeInput = document.getElementById("postalCode");
    const cardNumberInput = document.getElementById("cardNumber");
    const cardNameInput = document.getElementById("cardName");

    const saveButton = document.getElementById("saveSettings");
    const backButton = document.getElementById("backToHome");

    function activateTab(tabId) {
        tabs.forEach(function (tab) {
            tab.classList.remove("active");
        });

        contents.forEach(function (content) {
            content.classList.remove("active");
            content.style.display = "none";
        });

        const tabActiva = document.querySelector("[data-tab='" + tabId + "']");
        const contenidoActivo = document.getElementById(tabId + "-tab");

        if (tabActiva) {
            tabActiva.classList.add("active");
        }

        if (contenidoActivo) {
            contenidoActivo.style.display = "block";
            contenidoActivo.classList.add("active");
        }
    }

    async function loadSettings() {
        try {
            const response = await ApiClient.get("/api/settings/me");
            const ajustes = response.settings || {};
            saveToLocal(ajustes);

            if (languageInput) {
                languageInput.value = ajustes.language || SessionManager.getCurrentLanguage();
            }

            if (postalCodeInput) {
                postalCodeInput.value = ajustes.postal_code || "";
            }

            if (cardNameInput) {
                cardNameInput.value = ajustes.card_name || "";
            }

            if (cardNumberInput && ajustes.card_last4) {
                cardNumberInput.value = "**** **** **** " + ajustes.card_last4;
            }
        } catch (error) {
            if (error.message === "No autenticado") {
                var local = loadFromLocal();

                if (languageInput) {
                    languageInput.value = local.language || SessionManager.getCurrentLanguage();
                }

                if (postalCodeInput) {
                    postalCodeInput.value = local.postal_code || "";
                }

                if (cardNameInput) {
                    cardNameInput.value = local.card_name || "";
                }
                return;
            }

            console.error("Error al cargar ajustes:", error);
        }
    }

    async function saveSettings(event) {
        event.preventDefault();

        var rawCard = cardNumberInput ? cardNumberInput.value.replace(/\s/g, "") : "";
        if (rawCard.indexOf("*") >= 0) {
            rawCard = "";
        }

        const datos = {
            language: languageInput ? languageInput.value : "es",
            postalCode: postalCodeInput ? postalCodeInput.value.trim() : "",
            cardNumber: rawCard,
            cardName: cardNameInput ? cardNameInput.value.trim() : ""
        };

        saveToLocal({
            language: datos.language,
            postal_code: datos.postalCode,
            card_name: datos.cardName
        });

        try {
            await ApiClient.put("/api/settings/me", datos);
            await SessionManager.setLanguage(datos.language);
            await AppModal.alert(await settingsT("settings.messages.success"));
            window.location.href = "./index.html";
        } catch (error) {
            if (error.message === "No autenticado") {
                await SessionManager.setLanguage(datos.language);
                await AppModal.alert(await settingsT("settings.messages.success"));
                window.location.href = "./index.html";
                return;
            }

            await AppModal.alert(error.message || (await settingsT("settings.messages.save_error")));
        }
    }

    tabs.forEach(function (tab) {
        tab.addEventListener("click", function (event) {
            event.preventDefault();
            const tabId = tab.getAttribute("data-tab");
            activateTab(tabId);
        });
    });

    if (backButton) {
        backButton.addEventListener("click", function () {
            window.location.href = "./index.html";
        });
    }

    settingsForm.addEventListener("submit", function (event) {
        saveSettings(event);
    });

    if (saveButton) {
        saveButton.addEventListener("click", function (event) {
            saveSettings(event);
        });
    }

    const detectLocationBtn = document.getElementById("detectLocation");
    if (detectLocationBtn) {
        detectLocationBtn.addEventListener("click", async function () {
            await AppModal.alert(await settingsT("settings.messages.geo_pending"));
        });
    }

    activateTab("location");
    loadSettings();
});
