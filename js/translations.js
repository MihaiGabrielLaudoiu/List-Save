// Gestor de traducciones
const TranslationManager = {
    // Cache de traducciones
    translationsCache: {},

    // Obtener el idioma guardado
    getCurrentLanguage() {
        return SessionManager.getCurrentLanguage();
    },

    // Cargar traducciones
    async loadTranslations(lang) {
        try {
            // Si ya están en caché, devolverlas
            if (this.translationsCache[lang]) {
                console.log('Usando traducciones en caché para:', lang);
                return this.translationsCache[lang];
            }

            console.log('Cargando traducciones para:', lang);
            const response = await fetch(`translations/${lang}.json`);
            
            if (!response.ok) {
                console.warn(`No se pudo cargar el idioma ${lang}, intentando con español...`);
                if (lang !== 'es') {
                    return this.loadTranslations('es');
                }
                throw new Error('Error cargando traducciones');
            }

            const translations = await response.json();
            // Guardar en caché
            this.translationsCache[lang] = translations;
            return translations;
        } catch (error) {
            console.error('Error loading translations:', error);
            if (lang !== 'es') {
                console.log('Intentando cargar traducciones en español por defecto...');
                return this.loadTranslations('es');
            }
            return null;
        }
    },

    // Obtener valor traducido
    getTranslatedValue(translations, keys) {
        if (!translations || !keys) return null;
        
        let value = translations;
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                console.warn(`Clave de traducción no encontrada: ${keys.join('.')}`);
                return null;
            }
        }
        return value;
    },

    // Traducir la página
    async translatePage(lang = this.getCurrentLanguage()) {
        console.log('Traduciendo página al idioma:', lang);
        const translations = await this.loadTranslations(lang);
        
        if (!translations) {
            console.error('No se pudieron cargar las traducciones');
            return;
        }

        // Traducir elementos con data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const keys = element.getAttribute('data-i18n').split('.');
            const value = this.getTranslatedValue(translations, keys);

            if (value) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    if (element.getAttribute('placeholder')) {
                        element.placeholder = value;
                    }
                } else if (element.tagName === 'META') {
                    element.content = value;
                } else {
                    element.textContent = value;
                }
            }
        });

        // Traducir atributos alt
        document.querySelectorAll('[data-i18n-alt]').forEach(element => {
            const keys = element.getAttribute('data-i18n-alt').split('.');
            const value = this.getTranslatedValue(translations, keys);
            if (value) element.alt = value;
        });

        // Traducir atributos title
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const keys = element.getAttribute('data-i18n-title').split('.');
            const value = this.getTranslatedValue(translations, keys);
            if (value) element.title = value;
        });

        // Traducir placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const keys = element.getAttribute('data-i18n-placeholder').split('.');
            const value = this.getTranslatedValue(translations, keys);
            if (value) element.placeholder = value;
        });

        // Actualizar el atributo lang del HTML
        document.documentElement.lang = lang;
        console.log('Traducción completada');
    },

    // Cambiar el idioma
    async setLanguage(lang) {
        if (!lang) return;
        
        try {
            console.log('Cambiando idioma a:', lang);
            
            // Actualizar el idioma en SessionManager
            await SessionManager.setLanguage(lang);
            
            // Traducir la página
            await this.translatePage(lang);
            
            // Actualizar el selector de idioma si existe
            const languageSelect = document.getElementById('language');
            if (languageSelect) {
                languageSelect.value = lang;
            }
            
            console.log('Idioma cambiado correctamente');
        } catch (error) {
            console.error('Error al cambiar el idioma:', error);
            throw error;
        }
    }
};

// Inicializar traducciones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando sistema de traducciones...');
    try {
        const currentLang = TranslationManager.getCurrentLanguage();
        console.log('Idioma actual:', currentLang);
        await TranslationManager.translatePage(currentLang);
    } catch (error) {
        console.error('Error al inicializar traducciones:', error);
    }
}); 