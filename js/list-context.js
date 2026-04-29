// Id de la lista activa (cabecera) para añadir productos desde otras páginas
window.ListContext = {
    storageKey: "listandsave_active_cabecera_id",

    getCabeceraId: function () {
        var n = Number(localStorage.getItem(this.storageKey));
        return n > 0 ? n : null;
    },

    setCabeceraId: function (id) {
        if (id && Number(id) > 0) {
            localStorage.setItem(this.storageKey, String(id));
        } else {
            localStorage.removeItem(this.storageKey);
        }
    }
};
