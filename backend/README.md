# TourneyFy — Backend

## Scripts disponibles

| Comando | Acción |
|---------|--------|
| `npm run dev` | Inicia el servidor con **nodemon** (recarga automática en cada cambio) |
| `npm start` | Inicia el servidor en **producción** sin recarga |
| `npm run db:generate` | Genera los archivos JSON de seed desde `generateTestData.js` |
| `npm run db:seed` | Inserta los JSON en MongoDB usando upserts (no limpia primero) |
| `npm run db:reset` | Limpia todas las colecciones con `deleteMany()` y luego inserta los JSON |

### `npm run dev` / `npm start`

Ejecutan `src/index.js`. El server se conecta a MongoDB y levanta Express en el puerto `PORT` (5000 por defecto).

### `npm run db:generate`

**Fuente:** `src/seeds/generateTestData.js`

Lee las constantes de `src/seeds/ids.js` y genera datos sintéticos con IDs fijos. Escribe archivos JSON en:

```
src/seeds/
├── users/              → batch-01.json, batch-02.json … (lotes de 50)
├── teams/              → f7.json, basquet.json
├── fields/             → fields.json
├── tournaments/        → copa-utn-f7.json, liga-basquet.json
├── applications/       → applications.json
├── matches/            → copa-utn-f7.json, liga-basquet.json
```

**Datos generados:** 253 usuarios, 24 equipos, 3 canchas, 2 torneos, 24 solicitudes, 23 partidos.

### `npm run db:seed`

**Fuente:** `src/seed.js`

Lee cada archivo JSON de `src/seeds/` y hace un **upsert** (`findOneAndUpdate` con `{ upsert: true }`) por documento. No elimina datos existentes, solo agrega/actualiza.

### `npm run db:reset`

**Flags:** `--reset`

Idéntico a `db:seed` pero antes recorre todas las colecciones y ejecuta `.deleteMany({})`, dejando la base de datos limpia antes de insertar. Es el comando recomendado para regenerar datos desde cero.

**Secuencia completa:** `deleteMany()` → upserts → `mongoose.disconnect()` automático en `finally`.

### Dependencias

- **express** — servidor web
- **mongoose** — ODM para MongoDB
- **cors** — middleware de CORS
- **dotenv** — variables de entorno
- **nodemon** (dev) — recarga automática
