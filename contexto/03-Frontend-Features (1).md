# TourneyFy — Frontend: Features e Implementación (consumo de la API)

## Arquitectura de capas

```
pages/*.jsx
   │  usan hooks para leer estado reactivo
   ▼
hooks/use*.js          (useLiveQuery sobre Dexie — SIEMPRE leen de Dexie, nunca directo de la API)
   │
   ▼
lib/db.js              (instancia única de Dexie, versión 2, 8 stores)
   ▲
   │  se escribe acá desde:
data/*.js               (helpers CRUD de Dexie: get/put/bulkPut/delete + funciones que hablan con la API)
   │
   ▼
fetch() → {API}/...     (VITE_API_BASE_URL_{MODE}, resuelto por utils/env.js)
```

**Regla de oro del proyecto:** ningún componente lee la API directamente. Todo pasa por Dexie. Un componente que necesita datos "frescos" del servidor los pide a través de una función de `data/*.js` que hace `fetch` y **después** escribe el resultado en Dexie (`putX`/`bulkPutX`); el componente se entera porque su `useLiveQuery` reacciona al cambio en IndexedDB, no porque reciba la respuesta del `fetch` directamente en el componente (excepto en formularios de alta, ver más abajo).

---

## Resolución de entorno / base URL

`utils/env.js`:
```js
const mode = import.meta.env.VITE_APP_MODE || 'local_test'
getApiBaseUrl() → import.meta.env[`VITE_API_BASE_URL_${mode.toUpperCase()}`]
```
Todas las variables de entorno relevantes deben llamarse `VITE_API_BASE_URL_LOCAL_TEST`, `VITE_API_BASE_URL_PRODUCTION`, etc. según el valor de `VITE_APP_MODE`.

⚠️ Excepción encontrada: `data/seedDexie.js` usa `import.meta.env.VITE_API_BASE_URL` (sin sufijo de modo) con fallback a `http://localhost:3000/api`, rompiendo el patrón. Ver informe de errores — parece código huérfano, no se encontró ningún import de `seedDexie()` en el árbol de la app.

---

## Autenticación (estado real del flujo)

1. `Login.jsx` valida el formulario (regex de email, contraseña ≥6) y llama a `data/auth.js#login(email, password)`.
2. `login()` hace `POST /users/login`, guarda `token` y `currentUserId` en `localStorage`, escribe el usuario en Dexie (`putUser`, que le saca `hashedPassword` si vino) y dispara `syncUserEnvironment(usuario.id)` — el pull inicial completo.
3. `Register.jsx` repite básicamente el mismo flujo pero además hace primero `POST /users` para crear la cuenta, y trae `GET /sports` para armar el paso 2 del wizard (selección de deportes de interés).
4. `useAuth()` (hook) lee `token` y `currentUserId` de `localStorage`. Realiza una verificación proactiva de expiración del JWT (comparando `exp` contra `Date.now()`): si expiró, purga las claves y desloguea inmediatamente. Si está activo, hace `useLiveQuery` sobre `db.users.get(userId)` y expone `{ user, isLoggedIn }`.
5. `ProtectedRoute.jsx` envuelve las rutas privadas en `App.jsx` y redirige a `/login` preservando la ruta de origen en `location.state` si no hay sesión activa.
6. `Navbar.jsx` evalúa `isLoggedIn` para renderizar condicionalmente los ítems: cuando no hay sesión, la barra solo ofrece `Explorar` (`/torneos`), `Login` y `Registrarse`, protegiendo la UI contra pantallas negras.
7. `apiFetch.js` intercepta respuestas `401` o `403` por token vencido/inválido y redirige a `/login` ejecutando `logout()`.

**Lo que falta para que esto sea autenticación real (ver ADR-009/011 y el informe de errores):** ningún `fetch` de `data/*.js` adjunta `Authorization: Bearer <token>`, y el backend no exige ese header en ninguna ruta. El JWT hoy solo sirve para que el cliente sepa "el login fue válido en ese instante"; no protege nada después.

### `syncUserEnvironment(userId)` — el pull inicial (`data/userSync.js`)

Es la pieza más importante del consumo de API en todo el frontend. Se ejecuta una sola vez, al login/registro:

1. `GET /users/:id` → `putUser`
2. En paralelo: `GET /users/:id/tournaments` y `GET /users/:id/teams`
3. Si hay torneos: `bulkPutTournaments`, junta los `sportConfigId` usados y trae `GET /sports` filtrando localmente los que aplican → `bulkPutSports`
4. Junta los `teamId` de `tournament.participantes[]` que todavía no tiene, los trae uno por uno con `GET /teams/:id` y los agrega al array de equipos
5. `bulkPutTeams` con todos los equipos (los del usuario + los rivales de sus torneos)
6. Por cada equipo, `GET /teams/:id/members` (⚠️ **este paso falla hoy en producción**, ver informe de errores) → `bulkPutUsers` con la unión deduplicada de todos los miembros
7. `GET /matches` (trae **todos** los partidos de la base, sin filtro server-side) y filtra en el cliente solo los que pertenecen a los torneos del usuario → `bulkPutMatches`

Esto define de facto el alcance de qué le sirve la app: **solo se descargan torneos/equipos donde el usuario participa**, no el catálogo completo de torneos públicos de la plataforma (ver informe de pendientes: no hay forma de "descubrir" torneos ajenos).

---

## Modo offline y sincronización

Documentado en profundidad en las notas originales; el resumen operativo real:

- **`OnlineContext`** (`contexts/OnlineContext.jsx`): escucha `online`/`offline` del navegador, expone `isOnline`, `pendingCount`, `justReconnected`, `triggerSync()`. Al reconectar dispara `pushSync()` automáticamente y muestra el cartel verde 4 segundos.
- **`OfflineBanner.jsx`**: cartel amarillo persistente mientras `isOnline === false`; cartel verde temporal al reconectar.
- **`syncQueue.js`**: cola en la store `sync_queue` de Dexie. Cada item: `{ id, action, entity, entityId, payload, createdAt, status }`. `status` ∈ `PENDING | SYNCING | FAILED`.
- **`pushSync.js`**: recorre la cola FIFO, hace el `fetch` correspondiente (`getActionUrl`/`getActionMethod`), y marca `DONE` (borra el item) o `FAILED` (con el mensaje de error, sin reintento automático).
- **Acciones soportadas hoy: solo 4** — `UPDATE_MATCH`, `CREATE_MATCH`, `UPDATE_TOURNAMENT`, `CREATE_TOURNAMENT`. No hay soporte para encolar creación/edición de equipos, aplicaciones, ni canchas offline.
- **Único punto real de la app que respeta el patrón "online → directo / offline → cola" es `updateMatchSheet()`** (`data/matches.js`). El resto de las funciones de escritura (`createTournament` en `data/tournaments.js`, el alta de usuario/equipo, etc.) **hacen `fetch` directo sin chequear `navigator.onLine`** — si no hay conexión, esas operaciones fallan con una excepción sin encolarse. Ver informe de pendientes.

---

## Recorrido de pantallas (features)

### `HomePage` (`/`)
Landing pública: `AuthNavbar` + `HeroBanner` + `Footer`. No consume API.

### `Login` (`/login`) y `Register` (`/register`)
Ver sección de autenticación arriba. `Register` es un wizard de 3 pasos (MUI `Stepper`): datos personales → deportes de interés (chips seleccionables, trae `GET /sports`) → confirmación.

### `Dashboard` (`/dashboard`)
Landing post-login con saludo y botón de logout. Punto de entrada al resto de la navegación (`Navbar` con `dashboardNavItems`: Torneos, Equipos, Perfil, Configuración).

### `Tournaments` (`/dashboard/tournaments`)
Lista los torneos del usuario logueado (`useTournamentsByUser`, 100% Dexie). Botón "Crear Torneo" → `/dashboard/tournaments/create`.

### `CreateTournament` (`/dashboard/tournaments/create`)
Formulario largo (info básica, ubicación, fechas, contacto, extras). Al enviar: `createTournament(payload)` → `POST /tournaments` directo (sin passthrough por `syncQueue` si está offline, ver arriba) → `putTournament(tournament)` en Dexie → navega al detalle. El `<select>` de formato de torneo (`FORMATS`) está **hardcodeado a las 4 opciones del enum global**, sin consultar `sportsConfig.rulesConfig.format.allowed` del deporte elegido — es decir, el manifiesto por deporte que se diseñó para esto no se usa todavía en esta pantalla.

### `Teams` (`/dashboard/teams`) y `Team` (`/dashboard/teams/:id` y `/team/:id`)
- **`Teams.jsx`**: Lista los equipos del usuario logueado (`useTeamsByUser`). Incluye:
  - Botón **"Crear Equipo"**: Abre `CreateTeamModal.jsx` con selector de deportes (filtrando deportes colectivos de `SportsConfig`), campo de nombre con validación en tiempo real, URL de logo opcional y preview del escudo. Al crearlo, actualiza atómicamente Dexie (`db.teams` y `db.users`) y redirige al detalle del equipo.
  - Botón **"Unirme con código"**: Abre `JoinTeamModal.jsx` con input alfanumérico formateado (auto-mayúsculas, monospace). Al validar el código contra `POST /teams/join`, incorpora al usuario como miembro en IndexedDB y navega al equipo.
  - Estado vacío amigable cuando el usuario no pertenece a ningún plantel, con accesos directos a ambas acciones.
- **`Team.jsx`**: Vista de detalle del equipo:
  - **Tarjeta de Invitación:** Exclusiva para el capitán (o admin). Muestra el código alfanumérico generado con CSPRNG Crockford Base32, botón para copiar al portapapeles con feedback tipo snackbar, y botón para regenerar el código en caliente.
  - **Torneos:** Lista los torneos asociados al equipo (`team.tournaments[]`).
  - **LineUp interactivo:** Muestra los jugadores del plantel con su rol (badge especial para el Capitán/Owner). El capitán cuenta con un botón para expulsar miembros no deseados mediante modal de confirmación (`DELETE /teams/:id/members/:userId`). Los miembros regulares cuentan con un botón para "Abandonar equipo" voluntariamente.

### `Profile` (`/dashboard/profile` propio, `/user/:userId` ajeno)
Muestra datos + deportes de interés (resueltos contra `sportsConfig` local). Distingue `profileUser === null` (cargando) de `=== undefined` (no encontrado) para mostrar el estado correcto con `ErrorDisplay`.

### `Config` (`/dashboard/config`)
Placeholder — solo título, sin contenido funcional.

### `TournamentPage` (`/tournament/:id`)
El corazón de la app. Implementa refresco reactivo en segundo plano (*stale-while-revalidate*): lee inmediatamente la copia local de Dexie para evitar pantallas de carga y consulta en paralelo al backend (`fetchTournament`) sincronizando cambios de estado y resultados.

- **Hero Card de Coronación:** Cuando el torneo está `FINALIZADO`, despliega un banner dorado conmemorativo con trofeo 🏆, escudo/foto y nombre oficial del Campeón.
- **Chip de Estado:** Muestra claramente `Torneo: FINALIZADO 🏆`, `Torneo: EN_CURSO`, etc., evitando ambigüedades con las fechas.
- **Navegación:** `TournamentNavbar` con secciones (`config/navigation.js`), estado local `activeSection`, cada una renderiza un componente distinto sin cambiar de ruta:

| Sección | Componente | Estado |
|---|---|---|
| Clasificación | `TournamentStandings` | ✅ funcional para `ROUND_ROBIN` (tabla de posiciones, `computeStandings`) con podio oficial (`🏆 CAMPEÓN`, `🥈 Subcampeón`, `🥉 3° Puesto`) al finalizar y `SINGLE_ELIMINATION`/`DOUBLE_ELIMINATION` (bracket, `BracketTree`) — 🔴 `SWISS` explícitamente placeholder (`UnderConstruction`) |
| Fixture | `TournamentFixture` | ✅ funcional — tabs por ronda con estado dinámico (`(Culminada)`, `(En disputa)`) + destacado de "próximos partidos de mi equipo" |
| Participantes | `TournamentParticipants` | ✅ lista/búsqueda de participantes ya aprobados con snapshots de nombre y logo |
| Estadísticas | `TournamentStats` | ✅ funcional — doble vista de Anotaciones y Disciplina (Por Jugadores y Por Equipos) + KPIs de torneo |
| Ajustes | `TournamentAdminSettings` | ✅ exclusivo organizador — gestión de solicitudes, generación de fixture, inicio de torneo (`EN_CURSO`), progreso de fechas y finalización oficial de certamen |
| Anuncios | — | 🔴 placeholder explícito (`UnderConstruction feature="Anuncios"`) — postergado formalmente fuera del MVP (ADR-016) |

`TournamentStandings` decide el componente a renderizar en base a `tournament.rules?.format`, y **cae a `StandingsTable` por default** si el formato no matchea ninguno de los casos (comportamiento razonable pero no documentado como tal en ningún lado).

### Componentes compartidos reutilizables
- `MatchSheetDialog` y `MatchDetail` — planilla con atribución a jugadores del lineup y opción "Sin especificar / Equipo" (ADR-013 sin AUTO_GOL).
- `MatchCard` — despacha a `MatchCardVersus` según `sportConfigId.sportProps.matchExecution`; **`LEADERBOARD` renderiza `null`** (ningún deporte tipo "todos contra todos cronometrado", ej. golf, tiene UI de partido todavía).
- `CompetitorPhoto`, `Tags` (`UsernameTag`, `SportsTag`), `ErrorDisplay`, `UnderConstruction` — utilitarios consistentes en toda la app.
- `Navbar` — un solo componente parametrizable que sirve tanto para la barra superior de escritorio como para bottom-navigation mobile (`mobileVariant="bottom"`), usado también por `TournamentNavbar`.

---

## Piezas de infraestructura frontend que están escritas pero no conectadas

- **`services/AuthService.js` + `api/api.js`** (axios + interceptor Bearer): sin uso real hoy. Decisión tomada (ADR-011): integrar el interceptor a `data/auth.js` y deprecar `AuthService.js`.
- **`data/seedDexie.js`**: función `seedDexie()` completa (siembra Dexie completo desde la API, con flag `localStorage['dexie-seeded']`), pero no se encontró ningún `import` de este archivo en `main.jsx`/`App.jsx`. Parece haber sido reemplazada por `syncUserEnvironment()` (que es más selectiva: solo trae lo del usuario logueado) y haber quedado sin borrar.
- **`hooks/useApplications.js`**: 4 hooks completos y funcionales sobre la store `applications` de Dexie, pero **ningún componente los importa** — consistente con que el flujo de inscripción no tiene UI (ver informe de pendientes).
- **`hooks/useFields.js`**: ídem, sin consumidores en pantallas.
