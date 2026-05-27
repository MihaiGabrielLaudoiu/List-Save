// Gestiona la sesion del usuario en el frontend
// Se encarga de saber si hay alguien logueado y de cerrar sesion
const SessionManager = {
    // Aqui guardamos los datos del usuario cuando esta logueado, null si no lo esta
    currentUser: null,

    // Llama al backend para ver si la sesion sigue activa
    // Actualiza currentUser con los datos que devuelve el servidor
    async refreshSession() {
        try {
            const response = await ApiClient.get("/api/auth/me");
            this.currentUser = response.user;

            // Guardamos el idioma del usuario en localStorage para que no se pierda
            if (response.user && response.user.language) {
                localStorage.setItem("language", response.user.language);
            }

            return this.currentUser;
        } catch (error) {
            // Si falla (sesion caducada, no logueado, etc.) devolvemos null
            this.currentUser = null;
            return null;
        }
    },

    // Devuelve los datos del usuario actual sin hacer llamada al servidor
    checkSession() {
        return this.currentUser;
    },

    // Cierra la sesion: avisa al servidor y redirige al login
    async logout() {
        const idiomaActual = this.getCurrentLanguage();

        try {
            await ApiClient.post("/api/auth/logout", {});
        } catch (error) {
            // Si el servidor no responde, seguimos cerrando sesion de todas formas
            console.warn("No se pudo cerrar sesion en servidor:", error);
        }

        this.currentUser = null;
        // Guardamos el idioma para que no cambie al volver a entrar
        localStorage.setItem("language", idiomaActual);
        window.location.href = "./login.html";
    },

    // Obtiene el idioma activo: primero mira localStorage, luego el usuario, por defecto 'es'
    getCurrentLanguage() {
        const idiomaGuardado = localStorage.getItem("language");

        if (idiomaGuardado) {
            return idiomaGuardado;
        }

        if (this.currentUser && this.currentUser.language) {
            return this.currentUser.language;
        }

        return "es";
    },

    // Cambia el idioma activo y lo guarda en el servidor si hay sesion
    async setLanguage(lang) {
        if (!lang) {
            return;
        }

        localStorage.setItem("language", lang);

        // Solo mandamos al servidor si el usuario esta logueado
        if (this.currentUser) {
            try {
                await ApiClient.put("/api/settings/me", {
                    language: lang
                });
                this.currentUser.language = lang;
            } catch (error) {
                console.warn("No se pudo guardar el idioma en servidor:", error);
            }
        }

        // Traducimos la pagina al nuevo idioma si el modulo de traducciones esta cargado
        if (typeof TranslationManager !== "undefined") {
            await TranslationManager.translatePage(lang);
        }
    },

    // Actualiza los ajustes del usuario (idioma, codigo postal, etc.)
    async updateUserSettings(settings) {
        if (!this.currentUser) {
            throw new Error("No autenticado");
        }

        await ApiClient.put("/api/settings/me", settings);
    }
};

function updateUIForLoggedUser() {
    const userData = SessionManager.checkSession();
    const authButtons = document.getElementById("auth-buttons");
    const authButtonsMobile = document.querySelector(".auth-buttons-mobile");
    const userMenu = document.getElementById("user-menu");
    const userIcon = document.querySelector(".header__user");
    const userName = document.querySelector(".header__user-name");

    if (userData) {
        if (authButtons) {
            authButtons.style.display = "none";
        }

        if (authButtonsMobile) {
            authButtonsMobile.style.display = "none";
        }

        if (userMenu) {
            userMenu.style.removeProperty("display");
        }

        if (userIcon) {
            userIcon.style.removeProperty("display");
        }

        if (userName) {
            userName.textContent = userData.fullname || userData.email || "Mi cuenta";
        }
    } else {
        if (authButtons) {
            authButtons.style.display = ""; // deja que CSS/media queries controlen la visibilidad
        }

        if (authButtonsMobile) {
            authButtonsMobile.style.display = "";
        }

        if (userMenu) {
            userMenu.style.display = "none";
        }

        if (userIcon) {
            userIcon.style.display = "none";
        }
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    if (!localStorage.getItem("language")) {
        localStorage.setItem("language", "es");
    }

    await SessionManager.refreshSession();
    updateUIForLoggedUser();

    const languageSelect = document.getElementById("language");
    if (languageSelect) {
        languageSelect.value = SessionManager.getCurrentLanguage();
    }
});

window.SessionManager = SessionManager;
window.updateUIForLoggedUser = updateUIForLoggedUser;
window.cerrarSesion = function () {
    SessionManager.logout();
};