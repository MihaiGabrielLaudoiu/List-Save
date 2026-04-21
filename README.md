# List & Save (Node.js + MySQL)

Aplicacion web para comparar precios de supermercados y gestionar listas privadas de compra.

## Stack real del proyecto

- Frontend: HTML + JS (carpeta raiz y `js/`)
- Backend: Node.js + Express (carpeta `backend/` + `server.js`)
- Base de datos: MySQL
- Acceso a datos: `mysql2` con consultas preparadas (`consultaDatos(sql, params)`)

## Requisitos

- Node.js 18 o superior
- MySQL 8 o superior

## Configuracion inicial

1. Instalar dependencias:

```bash
npm install
```

1. Crear archivo de entorno a partir del ejemplo:

```bash
copy .env.example .env
```

1. Ajustar valores de `.env` (host, usuario, password, nombre de base de datos, clave JWT).

1. Crear la base de datos desde cero (el `schema.sql` hace `DROP DATABASE IF EXISTS list_save` y la vuelve a crear). Desde la raiz del proyecto:

```bash
mysql -u root -p < backend/db/schema.sql
mysql -u root -p < backend/db/seed.sql
```

En Windows PowerShell, si `mysql` no esta en el PATH, usa la ruta completa al cliente de MySQL.

**Importante:** no quedan archivos de migracion en `backend/db/`; el esquema completo vive solo en `schema.sql`.

## Ejecucion

- Desarrollo:

```bash
npm run dev
```

- Produccion local:

```bash
npm start
```

Servidor por defecto: `http://localhost:3000`

## Sincronizacion de precios (Mercadona, Carrefour, Eroski)

No se ejecuta al arrancar el servidor. Opciones:

- Desde el comparador (usuario autenticado): boton que llama a `POST /api/products/sync`.
- Desde consola en el servidor: `npm run sync:mercados` (equivale a `node backend/run-sync-cli.js`).

El seed deja datos de ejemplo; la sync inserta nuevas filas en `Precios` y actualiza catalogo segun las fuentes activas en `backend/utils/supermarket-sources.js`.

## API principal

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
- Productos:
  - `GET /api/products/sources`
  - `GET /api/products/catalog`
  - `GET /api/products/best-prices`
  - `GET /api/products/comparator-options`
  - `POST /api/products/sync` (requiere sesion; actualiza precios desde APIs/scraping)
- Lista privada:
  - `GET /api/lists/mine`
  - `POST /api/lists/mine`
  - `PUT /api/lists/mine/:listId`
  - `DELETE /api/lists/mine/:listId`
- Ajustes:
  - `GET /api/settings/me`
  - `PUT /api/settings/me`

## Supermercados elegidos para el TFG

Para no complicar el proyecto desde el inicio, la base queda preparada con tres fuentes y una estrategia simple por cada una:

- Mercadona: prioridad 1, integracion por API JSON no oficial (wh=mad1).
- Carrefour: prioridad 2, integracion por API interna JSON.
- Eroski: prioridad 3, scraping con Playwright headless.

La configuracion central de estas fuentes esta en `backend/utils/supermarket-sources.js` y el frontend la consume desde `GET /api/products/sources`.

## Estructura para imagen, emoji y comparacion inteligente

Se ha creado una capa de normalizacion para que la comparacion no dependa del nombre exacto de cada tienda:

- Archivo: `backend/utils/product-normalizer.js`
- Calcula automaticamente:
  - `categoria_normalizada`
  - `nombre_comparable`
  - `clave_comparable`
  - `emoji_sugerido`
  - `imagen_resuelta`

Esto permite que ejemplos como `PanCasa` y `Pan` se agrupen bajo una clave comparable comun cuando no haya EAN.

## Nota de alcance

El CRUD de listas y ajustes es el nucleo del TFG. La comparacion usa datos en MySQL; la sync opcional rellena y versiona precios sin bloquear el arranque del servidor.
