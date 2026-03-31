// Logica compartida del header: menu de usuario y boton de contraste
// Este script se carga en todas las paginas que tienen header

// Abre o cierra el menu desplegable del icono de usuario
function handleUserIconClick(event) {
    event.stopPropagation();

    const userMenu = document.getElementById("user-menu");
    const userIcon = document.querySelector(".header__user");

    if (!userMenu || !userIcon) {
        return;
    }

    // Toggle: si esta abierto lo cerramos, y al reves
    userMenu.classList.toggle("is-visible");
    userIcon.classList.toggle("active");
}

// Cierra el menu del usuario quitando las clases que lo hacen visible
function closeUserMenu() {
    const userMenu = document.getElementById("user-menu");
    const userIcon = document.querySelector(".header__user");

    if (userMenu) {
        userMenu.classList.remove("is-visible");
    }

    if (userIcon) {
        userIcon.classList.remove("active");
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    const userIcon = document.querySelector(".header__user");
    const botonesLogout = document.querySelectorAll("[onclick=\"cerrarSesion()\"]");
    const contrastToggle = document.getElementById("contrast-toggle");

    if (userIcon) {
        userIcon.addEventListener("click", handleUserIconClick);
    }

    // Cerramos el menu si el usuario hace clic en cualquier otro sitio de la pagina
    document.addEventListener("click", function (event) {
        const userMenu = document.getElementById("user-menu");
        const icon = document.querySelector(".header__user");

        if (!userMenu || !icon) {
            return;
        }

        if (!userMenu.contains(event.target) && !icon.contains(event.target)) {
            closeUserMenu();
        }
    });

    // Quitamos el onclick del HTML y ponemos un listener limpio
    // Esto es mejor practica que usar onclick inline en el HTML
    botonesLogout.forEach(function (boton) {
        boton.removeAttribute("onclick");
        boton.addEventListener("click", function () {
            SessionManager.logout();
        });
    });

    // Boton de alto contraste: guarda la preferencia en localStorage
    if (contrastToggle) {
        const guardado = localStorage.getItem("highContrast");

        if (guardado === "true") {
            document.documentElement.setAttribute("data-high-contrast", "true");
            document.documentElement.setAttribute("data-theme", "dark");
        }

        contrastToggle.addEventListener("click", function () {
            const valorActual = document.documentElement.getAttribute("data-high-contrast");
            const estaActivado = valorActual === "true";

            if (estaActivado) {
                document.documentElement.removeAttribute("data-high-contrast");
                document.documentElement.removeAttribute("data-theme");
                localStorage.setItem("highContrast", "false");
            } else {
                document.documentElement.setAttribute("data-high-contrast", "true");
                document.documentElement.setAttribute("data-theme", "dark");
                localStorage.setItem("highContrast", "true");
            }
        });
    }

    // Comprobamos la sesion y actualizamos el header segun si hay usuario o no
    if (typeof SessionManager !== "undefined") {
        await SessionManager.refreshSession();
        updateUIForLoggedUser();
    }
});

window.handleUserIconClick = handleUserIconClick;
window.cerrarSesion = function () {
    SessionManager.logout();
};
