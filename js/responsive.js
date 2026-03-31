document.addEventListener("DOMContentLoaded", function () {
    const hamburger = document.querySelector(".hamburger");
    const menuPpal = document.querySelector(".menuppal");
    const headerNav = document.querySelector(".header__nav");

    function toggleMenu(event) {
        hamburger.classList.toggle("is-active");
        menuPpal.classList.toggle("is_active");
        const layers = hamburger.querySelectorAll("._layer");
        layers.forEach((layer) => {
            layer.classList.toggle("active");
        });
        event.preventDefault();
    }

    if (!hamburger.querySelector("._layer")) {
        for (let i = 0; i < 3; i++) {
            const layer = document.createElement("div");
            layer.className = "_layer";
            hamburger.appendChild(layer);
        }
    }

    function updateMenuVisibility() {
        const isLargeScreen = window.innerWidth >= 1441;
        if (isLargeScreen) {
            headerNav.style.display = "block";
            hamburger.style.display = "none";
            menuPpal.classList.remove("is_active");
            hamburger.classList.remove("is-active");
        } else {
            headerNav.style.display = "none";
            hamburger.style.display = "block";
        }
    }

    updateMenuVisibility();
    window.addEventListener("resize", updateMenuVisibility);
    hamburger.addEventListener("click", toggleMenu);

    function closeMenu() {
        hamburger.classList.remove("is-active");
        menuPpal.classList.remove("is_active");
    }

    menuPpal.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (e) => {
        if (!hamburger.contains(e.target) && !menuPpal.contains(e.target)) {
            closeMenu();
        }
    });

    function moveAuthButtons() {
        const authButtons = document.getElementById("auth-buttons");
        const menuPpal = document.querySelector(".menuppal ul");
        if (!authButtons || !menuPpal) return;
        let mobileAuthButtons = document.querySelector(".auth-buttons-mobile");
        if (!mobileAuthButtons) {
            mobileAuthButtons = document.createElement("div");
            mobileAuthButtons.className = "auth-buttons-mobile";
            mobileAuthButtons.innerHTML = authButtons.innerHTML;
            menuPpal.parentNode.insertBefore(mobileAuthButtons, menuPpal.nextSibling);
        }
        function updateAuthButtonsVisibility() {
            const isLargeScreen = window.innerWidth >= 1441;
            const isLoggedIn = SessionManager.checkSession();
            if (isLoggedIn) {
                authButtons.style.display = "none";
                mobileAuthButtons.style.display = "none";
                return;
            }
            if (isLargeScreen) {
                authButtons.style.display = "flex";
                mobileAuthButtons.style.display = "none";
            } else {
                authButtons.style.display = "none";
                mobileAuthButtons.style.display = "flex";
            }
        }
        updateAuthButtonsVisibility();
        window.addEventListener("resize", updateAuthButtonsVisibility);
    }

    moveAuthButtons();
});