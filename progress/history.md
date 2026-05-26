# Historial de progreso — List & Save

## 2026-05-25 — Rediseño completo UI (sesiones anteriores)

**Ficheros alterados:**
- `mi-lista.html` — rediseño completo a estilo bloc de notas pautado (Kalam+Nunito), modal nueva lista, toast con animación, tabs, chips de categoría, grid mobile 2 filas, búsqueda con sugerencias
- `comparador.html` — rediseño visual con estilo etiqueta de precio; estilos movidos a `_comparator.scss`
- `scss/_comparator.scss` — reescrito con nuevo diseño (variables SCSS, BEM anidado, dark mode)
- `scss/_components.scss` — fix `.cta__text` duplicado (gris sobre azul); fix `products-search__icon` centrado vertical
- `scss/main.css` — recompilado
- `js/fab-global.js` — desactivado (botón + flotante inútil en todas las páginas)
- `sql/002_seed_precios.sql` — creado con 45 INSERTs (15 productos × 3 supermercados)

**Tests añadidos:** ninguno (no existían tests en el proyecto)

**Estado CI:** `npm run check` → OK

---

## 2026-05-26 — Inicialización marco Harness Engineering

**Ficheros creados:**
- `features.json` — lista de tareas pendientes del proyecto
- `init.sh` — script de inicialización y verificación de entorno
- `progress/history.md` — este fichero (memoria externa del agente)

**Próxima tarea:** feature #1 — aumentar fuente base global
