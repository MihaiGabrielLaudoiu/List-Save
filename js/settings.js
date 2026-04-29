document.addEventListener("DOMContentLoaded", function () {
    const settingsForm = document.getElementById("settingsForm");

    if (!settingsForm) {
        return;
    }

    async function settingsT(keyPath) {
        const lang = SessionManager.getCurrentLanguage();
        const tr = await TranslationManager.loadTranslations(lang);
        return TranslationManager.getTranslatedValue(tr, keyPath.split(".")) || keyPath;
    }

    // Elementos de las pestanas y sus contenidos
    const tabs = document.querySelectorAll(".tab-button");
    const contents = document.querySelectorAll(".tab-content");

    // Campos del formulario de ajustes
    const languageInput = document.getElementById("language");
    const postalCodeInput = document.getElementById("postalCode");
    const cardNumberInput = document.getElementById("cardNumber");
    const cardNameInput = document.getElementById("cardName");

    const saveButton = document.getElementById("saveSettings");
    const backButton = document.getElementById("backToHome");

    // Activa la pestana que se le pasa y oculta las demas
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

    // Carga los ajustes del usuario desde el servidor y rellena el formulario
    async function loadSettings() {
        try {
            const response = await ApiClient.get("/api/settings/me");
            const ajustes = response.settings || {};

            if (languageInput) {
                languageInput.value = ajustes.language || SessionManager.getCurrentLanguage();
            }

            if (postalCodeInput) {
                postalCodeInput.value = ajustes.postal_code || "";
            }

            if (cardNameInput) {
                cardNameInput.value = ajustes.card_name || "";
            }

            // Si tiene tarjeta guardada mostramos solo los ultimos 4 digitos con asteriscos
            if (cardNumberInput && ajustes.card_last4) {
                cardNumberInput.value = "**** **** **** " + ajustes.card_last4;
            }
        } catch (error) {
            if (error.message === "No autenticado") {
                window.location.href = "./login.html";
                return;
            }

            console.error("Error al cargar ajustes:", error);
        }
    }

    // Recoge los datos del formulario y los manda al servidor
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

        try {
            await ApiClient.put("/api/settings/me", datos);
            // Cambiamos el idioma en la pagina tambien para que se vea de inmediato
            await SessionManager.setLanguage(datos.language);
            await AppModal.alert(await settingsT("settings.messages.success"));
            window.location.href = "./index.html";
        } catch (error) {
            await AppModal.alert(error.message || (await settingsT("settings.messages.save_error")));
        }
    }

    // Ponemos el listener de click a cada pestana
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

    // Boton para detectar ubicacion automaticamente (pendiente de implementar)
    const detectLocationBtn = document.getElementById("detectLocation");
    if (detectLocationBtn) {
        detectLocationBtn.addEventListener("click", async function () {
            await AppModal.alert(await settingsT("settings.messages.geo_pending"));
        });
    }

    // Abrimos la primera pestana por defecto y cargamos los datos
    activateTab("location");
    loadSettings();
});
