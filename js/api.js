const ApiClient = {
    async request(url, opciones) {
        const config = opciones || {};
        if (!config.method) {
            config.method = "GET";
        }
        config.credentials = "include";
        if (!config.headers) {
            config.headers = {};
        }
        if (!config.headers["Content-Type"] && config.body) {
            config.headers["Content-Type"] = "application/json";
        }

        const response = await fetch(url, config);
        let data = {};
        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (!response.ok) {
            const mensaje = data.message || "Error en la solicitud";
            throw new Error(mensaje);
        }

        return data;
    },

    async get(url) {
        return this.request(url, { method: "GET" });
    },

    async post(url, cuerpo) {
        return this.request(url, {
            method: "POST",
            body: JSON.stringify(cuerpo)
        });
    },

    async put(url, cuerpo) {
        return this.request(url, {
            method: "PUT",
            body: JSON.stringify(cuerpo)
        });
    },

    async delete(url) {
        return this.request(url, { method: "DELETE" });
    }
};

window.ApiClient = ApiClient;