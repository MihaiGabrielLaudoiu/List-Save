// Buscador del hero de la home: redirige al comparador con el termino como query param
document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("search-product");
    const boton = document.querySelector(".search__button");

    if (!input || !boton) {
        return;
    }

    function lanzarBusqueda() {
        const termino = (input.value || "").trim();
        if (!termino) {
            input.focus();
            return;
        }
        const url = "comparador.html?q=" + encodeURIComponent(termino);
        window.location.href = url;
    }

    boton.addEventListener("click", function (event) {
        event.preventDefault();
        lanzarBusqueda();
    });

    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            lanzarBusqueda();
        }
    });
});
