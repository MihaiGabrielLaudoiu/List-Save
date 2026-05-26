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

---

## 2026-05-26 — Feature #1 + Rediseño mi-lista + Fix CTA

**Feature #1 completada:** `html { font-size: 18px }` en `_normalize.scss`, body hereda vía `1rem`.

**Fix texto gris CTA:** Eliminado duplicado `.cta__text { color: #4a5568 }` en `_components.scss` que sobreescribía el blanco correcto en la sección azul de index.html.

**Rediseño mi-lista.html:**
- Creado `scss/_milista.scss` — diseño bloc de notas con Nunito, fondo crema, líneas azules, margen rojo, esquina doblada
- Eliminadas 499 líneas de CSS inline del HTML (norma del proyecto)
- Añadido a `scss/main.scss` con `@use 'milista'`
- Compilado correcto a `css/main.css` (fix: antes se compilaba a `scss/main.css`)
- Corregido `init.sh` para compilar al destino correcto

**Ficheros alterados:** `scss/_milista.scss` (nuevo), `scss/main.scss`, `css/main.css`, `mi-lista.html`, `init.sh`

**Deploy:** servidor 192.168.1.128 → git reset --hard + docker compose restart ✓

**Próxima tarea:** feature #2 — revisar y arreglar footer en todas las páginas
