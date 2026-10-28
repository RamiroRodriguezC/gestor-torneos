# TourneyFy — Documentación de la API (Backend)

Base URL: `{host}/api` (montado en `backend/src/index.js`). Todas las respuestas son JSON.
Patrón de capas: `routes → controller → service → model` (Mongoose). Todos los handlers están envueltos por `utils/handle.js`.

> ⚠️ **Estado real de autenticación (ver ADR-009 / informe de errores):** existe `middlewares/authMiddleware.js` (`authenticateToken`, `isAdmin`, `isSelf`) pero **no está aplicado en ningún router**. Hoy, todos los endpoints listados abajo son de acceso público, sin excepción, más allá de que el login devuelva un JWT. Este documento describe el comportamiento **actual**, no el deseado.

---

## Formato de respuesta

**Éxito**, formato general (`utils/handle.js`):
```json
{ "data": { /* objeto o array */ }, "count": 10 }
```
`count` solo aparece en endpoints que devuelven listas.

**Error — camino controlado** (el servicio lanzó `AppError`):
```json
{ "error": { "type": "TOURNAMENT_NOT_FOUND", "message": "El torneo no existe.", "code": 404 } }
```

**Error — camino NO controlado** (⚠️ formato distinto, ver informe de errores):
```json
{ "error": "Base de datos no disponible" }
```
o, para `ValidationError`/`CastError` de Mongoose:
```json
{ "error": "<mensaje crudo de Mongoose>" }
```
En este segundo camino `error` es un **string**, no un objeto — el frontend que espera `body.error.message` no va a leer nada de ahí. Tenerlo presente al consumir la API.

### Catálogo de `ErrorType` (`constants/errorTypes.js`)

| type | code | Mensaje por defecto |
|---|---|---|
| `USER_NOT_FOUND` | 404 | El usuario no existe o no está disponible. |
| `TEAM_NOT_FOUND` | 404 | El equipo no fue encontrado. |
| `TOURNAMENT_NOT_FOUND` | 404 | El torneo no existe. |
| `SPORT_NOT_FOUND` | 404 | El deporte no fue encontrado. |
| `MATCH_NOT_FOUND` | 404 | El partido no existe. |
| `APPLICATION_NOT_FOUND` | 404 | La solicitud no fue encontrada. |
| `FIELD_NOT_FOUND` | 404 | La cancha no fue encontrada. |
| `VALIDATION_ERROR` | 400 | Datos inválidos. |
| `INVALID_CREDENTIALS` | 400 | Credenciales inválidas. |
| `UNAUTHORIZED` | 401 | Acceso denegado. |
| `FORBIDDEN` | 403 | No tienes permisos. |
| `CONFLICT` | 409 | El recurso ya existe. |
| `INTERNAL_ERROR` | 500 | Error interno del servidor. |

---

## Salud del servicio

### `GET /api/health`
Sin capa de servicio, definido directo en `index.js`. Devuelve estado del proceso, no de la conexión a Mongo.
```json
{ "status": "OK", "environment": "development", "message": "Servidor operativo y agnóstico" }
```

---

## Deportes — `/api/sports`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Lista todas las `SportsConfig` |
| GET | `/:name` | Busca por `name` exacto (ej. `FUTBOL_7`) |

`SportsConfig` (ver modelo de datos para detalle completo) incluye `sportProps`, `validEvents[]` y `rulesConfig`. No tiene endpoints de creación/edición expuestos — se asume que el catálogo de deportes se carga por seed, no desde la UI.

---

## Usuarios — `/api/users`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/login` | `{ email, password }` → `{ message, token, usuario }` |
| GET | `/:id/tournaments` | Torneos donde el usuario participa (por `user.tournaments[]`) |
| GET | `/:id/teams` | Equipos del usuario (por `user.teams[]`) |
| GET | `/` | Lista usuarios activos, sin `hashedPassword` |
| GET | `/:id` | Detalle de usuario |
| POST | `/` | Alta de usuario |
| PUT | `/:id` | Edición de usuario |

**`POST /users/login`** — body:
```json
{ "email": "user@mail.com", "password": "texto-plano" }
```
Respuesta 200:
```json
{
  "message": "Login exitoso",
  "token": "<jwt>",
  "usuario": {
    "id": "...", "name": "...", "lastName": "...", "email": "...",
    "globalRole": "USER", "url_profile_photo": "", "sportsInterests": []
  }
}
```
Errores: `VALIDATION_ERROR` (400, falta email/password), `INVALID_CREDENTIALS` (400, usuario no existe **o** contraseña incorrecta — mismo tipo de error para ambos casos, por diseño, para no filtrar si el email existe).

**`POST /users`** — body relevante:
```json
{ "name", "lastName", "username", "email", "hashedPassword", "dateOfBirth", "sportsInterests": [] }
```
El campo se llama `hashedPassword` en el payload de entrada aunque llega en texto plano — el servicio lo hashea con `bcrypt` antes de guardar (ver informe de errores, nomenclatura confusa). Validaciones: `name`, `lastName`, `email` (formato), `dateOfBirth` (fecha válida), `username` (≥3 caracteres), `hashedPassword` requerido. Duplicados de `email` o `username` → `CONFLICT` (409).

**Token JWT** — payload firmado (`generateToken`):
```json
{ "id", "email", "username", "globalRole" }
```
Firmado con `process.env.JWT_SECRET`, expira según `JWT_EXPIRES_IN` (default `1h`). ⚠️ No hay endpoint para refrescar ni invalidar el token.

---

## Equipos — `/api/teams`

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/join` | Unirse a un equipo mediante código de invitación (`{ code }`) |
| GET | `/:id/invite-code` | Obtener código de invitación vigente (solo Capitán o ADMIN) |
| POST | `/:id/regenerate-code` | Regenerar código de invitación (solo Capitán o ADMIN) |
| GET | `/:id/members` | Miembros del equipo (populado sin contraseña) |
| DELETE | `/:id/members/:userId` | Expulsar miembro (Capitán/ADMIN) o abandonar equipo (propio usuario) |
| GET | `/:id/tournaments` | Torneos en los que participó el equipo |
| GET | `/` | Lista equipos activos, con `capitanId` populado (`name lastName url_profile_photo`) |
| GET | `/:id` | Detalle de equipo |
| POST | `/` | Alta de equipo (toma automáticamente `capitanId` del token) |
| PUT | `/:id` | Edición de equipo |

**`POST /teams`** — body: `{ name, discipline, logoURL?, capitanId? }`. Validaciones: `name` (no vacío), `discipline` (valida contra `SportsConfig`), `capitanId` (se autocompleta con `req.user.id`; si es ADMIN puede asignarlo explícitamente). No permite nombres duplicados en la misma disciplina. Agrega automáticamente al creador a `members[]` y actualiza atómicamente `User.teams[]` con rol `CAPITAN`. Inicializa `inviteCode` seguro con 7 días de vigencia.

**`POST /teams/join`** — body: `{ code }`. Busca equipo con `inviteCode.code`, valida que esté activo y no expirado, previene duplicados (no permite unirse si ya es miembro o capitán) y respeta cupo del deporte. Suma al usuario como `MIEMBRO` en `team.members[]` y en `User.teams[]`.

**`GET /teams/:id/invite-code`** — Protegido: solo el capitán o ADMIN. Devuelve `{ code, expiresAt, isActive }`. Si el equipo no tenía código, se le genera uno automáticamente.

**`POST /teams/:id/regenerate-code`** — Protegido: solo el capitán o ADMIN. Invalida el código anterior y genera uno nuevo de 6 caracteres con 7 días de vigencia.

**`DELETE /teams/:id/members/:userId`** — Protegido: capitán, ADMIN o el propio usuario saliendo. Remueve de `team.members[]` y desvincula en `User.teams[]`. No permite expulsar al capitán directamente.

**`GET /teams/:id/members`** — ✅ Operativo. Retorna los usuarios del lineup sin password.

---

## Torneos — `/api/tournaments`

Las sub-rutas anidadas están declaradas **antes** que las genéricas `/:id` para que Express no las capture por error (documentado explícitamente en el propio archivo de rutas).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/:id/participants` | Lista `participantes[]` del torneo |
| POST | `/:id/participants` | Agrega un participante |
| GET | `/:id/rounds` | Lista `rounds[]` del torneo |
| POST | `/:id/rounds` | Agrega una ronda |
| GET | `/:id/applications` | Lista solicitudes (`Application`) de ese torneo |
| GET | `/` | Lista torneos no borrados |
| GET | `/:id` | Detalle de torneo |
| POST | `/` | Alta de torneo |
| PUT | `/:id` | Edición de torneo |

**`POST /tournaments`** — validaciones: `title`, `organizerId`, `sportConfigId` requeridos. El resto de los campos (`rules`, `location`, `startDate`, etc.) son opcionales con defaults del schema.

**`POST /tournaments/:id/participants`** — body: `{ teamId, displayNameSnapshot? }`. Hace `$push` directo sobre `participantes[]` y devuelve el array completo actualizado. ⚠️ No valida que el equipo ya esté inscripto (podría duplicarse), ni valida `maxRegistrations`, ni verifica que exista una `Application` `APROBADA` previa — es un alta directa, sin pasar por el flujo de solicitudes (ver informe de pendientes: el flujo de aprobación de inscripción no está conectado en el front).

**`POST /tournaments/:id/rounds`** — body mínimo: `{ roundName, roundNumber, type?, status?, startDate?, endDate? }`. Hace `$push` sobre `rounds[]`. Al no tener `_id` propio el subdocumento (`{ _id: false }` en `roundSchema`), **no hay forma de referenciar esa ronda recién creada desde la respuesta** más que por `roundNumber` — ver ADR-008, decisión abierta.

**`GET /tournaments/:id/applications`** — devuelve las `Application` (colección separada) filtradas por `tournamentId` y `isDeleted: false`. Distinto de `tournament.applications[]` (el resumen embebido que vive en el propio documento de torneo, que hoy nada en el backend mantiene sincronizado — nada hace `$push` sobre `Tournament.applications[]` cuando se crea una `Application`).

---

## Solicitudes de inscripción — `/api/applications`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Lista todas las solicitudes activas |
| GET | `/:id` | Detalle |
| POST | `/` | Crear solicitud |
| PUT | `/:id` | Editar / cambiar estado |

**`POST /applications`** — body: `{ tournamentId, applicantId, participantId, status?, comprobantURL?, notesCapitan? }`. `status` por defecto `PENDIENTE`; validado contra `APPLICATION_STATUS = ['PENDIENTE','APROBADA','RECHAZADA']`.

⚠️ **El backend de este recurso está completo, pero no hay ningún consumidor en el frontend** (ni formulario para crear una solicitud, ni pantalla para que el organizador la apruebe/rechace). Confirmado como pendiente real de MVP — ver informe aparte.

---

## Canchas — `/api/fields`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Lista canchas activas |
| GET | `/:id` | Detalle |
| POST | `/` | Alta |
| PUT | `/:id` | Edición |

`POST /fields` — validaciones: `name`, `address` requeridos. `geoLocalization {lat, lng}` y `amenities[]` opcionales. Sin endpoint de borrado (soft-delete no implementado desde la API, aunque el modelo tiene `isDeleted`).

⚠️ No hay ninguna pantalla de frontend para gestionar canchas — ni alta, ni listado, ni asignación visual a un partido (el campo `Match.field` se completa a mano en el body al crear/editar un partido).

---

## Partidos — `/api/matches`

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Lista todos los partidos activos, con `sportConfigId` populado (`name sportProps.matchExecution`) |
| GET | `/:id` | Detalle |
| POST | `/` | Alta |
| PUT | `/:id` | Edición — es el endpoint que usa `updateMatchSheet()` del frontend para guardar planillas |

**`POST /matches`** — validaciones: `tournamentId`, `round.roundId + round.number`, `field.fieldId + field.name`, `sportConfigId` requeridos. `status` validado contra `MATCH_STATUS`.

⚠️ No existe ningún endpoint para crear partidos en lote a partir de un formato de torneo (round robin, bracket, etc.) — la "generación automática de fixture" descrita como objetivo esencial en ambos PDF de propuesta **no está implementada en el backend**. Ver informe de pendientes.

---

## Cómo lo consume el frontend (resumen — ver documento de Frontend para el detalle)

- Base URL resuelta dinámicamente por `frontend/src/utils/env.js`, según `VITE_APP_MODE` (`local_test` por defecto) → busca `VITE_API_BASE_URL_{MODE}`.
- La mayoría de las llamadas usan `fetch` nativo (`data/*.js`), **sin** header `Authorization`.
- Una minoría (`services/AuthService.js`, hoy sin uso real) pasa por una instancia de `axios` (`api/api.js`) que sí arma el header `Bearer` — ver ADR-011, es la pieza que falta integrar.
