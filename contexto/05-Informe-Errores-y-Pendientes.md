# TourneyFy — Informe de Errores y Trabajo Pendiente para el MVP

Basado en lectura directa del código (fuente de verdad) al 10/08/2026, más las confirmaciones dadas por el autor sobre los puntos ambiguos. Se separa en **errores concretos** (algo está roto o va a romperse) y **pendientes de alcance** (funcionalidad prevista en la propuesta original que todavía no existe).

> **Actualización 27/08/2026 — confrontación código vs informe:** varios hallazgos marcados como 🔴 en la versión del 10/08 ya están resueltos en el repo actual (ver títulos ~~tachados~~ + etiqueta ✅ RESUELTO). Se añade §4 *Matriz Crítica* sin borrar el histórico; el histórico se conserva para trazabilidad. Leyenda: ~~tachado~~ = cerrado/verificado en código; 🟡 = parcialmente resuelto; 🔴/🟠 sin tacha = aún abierto.

---

## 1. Errores concretos (por severidad)

### ~~🔴 CRÍTICO — `teams.service.js#findTeamMembers` usa `User` sin importarlo~~ — ✅ RESUELTO (27/08/2026)
```js
// backend/src/services/teams.service.js
import Team from '../models/TeamsModel.js';
// ❌ falta: import User from '../models/UsersModels.js';
...
export const findTeamMembers = async (teamId) => {
  ...
  return User.find({ _id: { $in: ids }, isDeleted: false }).select('-hashedPassword');
  // ReferenceError: User is not defined
};
```
**Confirmado en producción** (captura de consola en Render): `GET /api/teams/:id/members` devuelve **500** de forma consistente, 17+ errores repetidos durante un solo login (uno por cada equipo a sincronizar).

**Impacto en cadena:**
- `userSync.js` llama a este endpoint por cada equipo del usuario durante el login. Al fallar, `fetchJSON` solo loguea un warning y sigue — el login no se rompe, pero **los miembros de los equipos nunca se escriben en Dexie** en esa sincronización.
- Esto explica el segundo síntoma reportado (imagen 1): la lista de `LineUp` en `Team.jsx` muestra nombres pero **sin `username`** — son datos remanentes de una sincronización anterior (o de un seed inicial) que ya estaban incompletos, y como el endpoint nunca responde bien, tampoco se pueden refrescar/completar.

**Corrección:** agregar `import User from '../models/UsersModels.js';` en `teams.service.js`. Una línea. Después conviene verificar con datos reales que el seed de usuarios efectivamente carga `username` para todos los registros — si el problema de `username` vacío persiste después del fix, el origen está en los datos de seed, no en el código.

> **27/08/2026 — Verificado:** `backend/src/services/teams.service.js:2` ya contiene `import User from '../models/UsersModel.js';` — el `ReferenceError` no reproduce. Queda pendiente validar en staging que `GET /teams/:id/members` devuelva `username` completo (si sigue vacío, es dato de seed).

---

### ~~🔴 CRÍTICO — Ninguna ruta usa `authMiddleware.js`~~ — ✅ RESUELTO (27/08/2026)
`authenticateToken`, `isAdmin`, `isSelf` están completamente implementados pero **no se importan en ningún archivo de `routes/`**. Resultado: cualquiera puede editar cualquier usuario/equipo/torneo (`PUT /users/:id`, `PUT /teams/:id`, etc.) sin token, sin ser ese usuario, sin ser `ADMIN`. Confirmado como pendiente real por el autor (no es un olvido de lectura). Se detalla como ítem de alcance en la sección 2, pero se marca también acá porque es, hoy, una vulnerabilidad activa si el backend está desplegado (y lo está — Render).

---

### ~~🔴 ALTO — Estructura `Match.round.roundId` sin identidad real que referenciar~~ — ✅ RESUELTO (27/08/2026 — ADR-008 Opción 1)
`roundSchema` tenía `{ _id: false }`; `Match.round.roundId` era `ObjectId ref: 'Round'` (modelo inexistente). Nada en el backend generaba ese `roundId` — dependía de que quien armara el `POST /matches` inventara un id. El índice Dexie `[tournamentId+round.roundId]` heredaba el problema.

> **27/08/2026 — Resuelto:** `backend/src/models/TournamentsModel.js:21-28` ya sin `{_id:false}` (Mongoose genera `_id`); `backend/src/models/MatchesModel.js:29` ya sin `ref:'Round'`; `backend/src/services/tournaments.service.js:addRound` y `backend/src/services/matches.service.js:create` validan pertenencia; `frontend/src/lib/db.js:28-38` bump Dexie v3; migración `backend/scripts/migrate-rounds-adr008.js` para datos existentes.

---

### ~~🟠 MEDIO — Dos formatos de error del backend conviviendo~~ — ✅ RESUELTO (27/08/2026 — P2)
`handle.js` devolvía `{ error: { type, message, code } }` para `AppError`, pero `{ error: "<string>" }` para `ValidationError`/`CastError`/`requireDB()`/`error.status`. El frontend leía `body.error?.message` asumiendo objeto.

> **27/08/2026 — Resuelto:** `backend/src/utils/handle.js:13-20` ahora normaliza `error.status` → `ErrorType` mapeado + `ValidationError/CastError` → `VALIDATION_ERROR` + fallback → `INTERNAL_ERROR` con `error.message || defaultMessage`. `backend/src/config/db.js:20-24` `requireDB()` ahora lanza `AppError(INTERNAL_ERROR, 'Base de datos no disponible')`. `backend/src/index.js:59-79` ya estaba unificado y queda como referencia. Contrato backend→frontend ahora siempre es `{ error: { type, message, code } }`.

---

### ~~🟠 MEDIO — Ningún `fetch` del frontend envía el JWT~~ — ✅ RESUELTO (27/08/2026)
Ya cubierto en ADR-011/009: el token se guarda pero nunca se adjunta. Aunque hoy no importa porque el backend tampoco lo exige (ver el ítem crítico de arriba), es la otra mitad del mismo problema y hay que resolverlas juntas: no sirve proteger rutas si el cliente no manda el header, ni sirve mandar el header si nada lo verifica.

> **27/08/2026 — Verificado:** `frontend/src/utils/apiFetch.js:10-11` ya adjunta `Authorization: Bearer <token>` en cada request; `frontend/src/data/tournaments.js:5` y `frontend/src/data/matches.js:76` y `frontend/src/data/userSync.js:7` migraron a `apiFetch`. `apiFetch.js:15-18` además maneja `401 → logout + redirect`. El gap describió el estado al 10/08, hoy cerrado. Queda `frontend/src/api/api.js` (axios) huérfano sin consumidores — candidato a borrar.

---

### 🟡 BAJO — Escrituras offline inconsistentes fuera de `updateMatchSheet`
Solo `updateMatchSheet()` respeta el patrón "si estoy offline, encolo". `createTournament()` (y por extensión cualquier alta desde `CreateTournament.jsx`) hace `fetch` directo sin chequear `navigator.onLine`; si no hay conexión, el `catch` del componente muestra el error de red tal cual, no ofrece guardar localmente y sincronizar después — rompe la promesa central del proyecto ("nunca perder una carga por falta de señal") para el caso de alta de torneos. Lo mismo aplicaría a cualquier alta de equipo/usuario si se llegara a hacer en cancha sin señal.

---

### ~~🟡 BAJO — Duplicación de capa de auth (`AuthService.js`/`api.js` vs `data/auth.js`)~~ — ✅ RESUELTO (27/08/2026)
Ya resuelto por decisión (ADR-011), queda pendiente solo la ejecución: integrar el interceptor de `api.js` y borrar `AuthService.js`.

> **27/08/2026 — Verificado:** `frontend/src/services/AuthService.js` ya no existe en el árbol; canónico es `frontend/src/data/auth.js` + `frontend/src/utils/apiFetch.js`. `frontend/src/api/api.js:24-28` permanece huérfano (axios interceptor) — borrar o documentar como deprecado cierra el ítem por completo.

---

### 🟡 BAJO — Código huérfano / inconsistencias menores
- `data/seedDexie.js`: función completa, sin ningún `import` en el árbol de la app; usa además `VITE_API_BASE_URL` (sin sufijo de modo), rompiendo el patrón de `env.js`. Candidato a borrar si `syncUserEnvironment()` lo reemplazó a propósito.
- `Tournament.applications[]` (resumen embebido) nunca se actualiza desde el backend al crear/editar una `Application` real — queda siempre vacío salvo que alguien lo llene a mano.
- `User.applications[]` — mismo caso, nunca se hace `$push` al crear una solicitud.
- `CreateTournament.jsx` tiene una lista `FORMATS` hardcodeada de 4 formatos en vez de consultar `sportsConfig.rulesConfig.format.allowed` del deporte elegido — el manifiesto multideporte diseñado para esto no se usa acá.
- `Team.discipline` es `String` libre, no `ObjectId → SportsConfig`; funciona por convención de nombres, no por integridad referencial.
- Sin tests automatizados en todo el repo (ni backend ni frontend) — no bloquea el MVP funcional pero es una deuda a tener en el radar antes de escalar.
- CORS del backend (`app.use(cors())`) sin restricción de origen — aceptable en desarrollo, a endurecer antes de un despliegue "real" más allá de la demo académica.
- No hay verificación de que `JWT_SECRET` esté seteado antes de arrancar el server; si falta, falla recién en el primer login con un error poco claro.

---

## 2. Trabajo pendiente para completar el MVP (por área)

### Autenticación y autorización
- [x] ~~Integrar `api/api.js` (interceptor Bearer) dentro de `data/auth.js`, deprecar `AuthService.js` (decisión ya tomada, ADR-011).~~ — ✅ hecho 27/08 (ver §1)
- [x] ~~Aplicar `authenticateToken` en las rutas que corresponda (mínimo: todo `PUT`/`POST` de recursos sensibles), y `isSelf`/`isAdmin` donde ya están pensados (edición de usuario, por ejemplo).~~ — ✅ hecho 27/08: `users.routes.js:12`, `teams.routes.js:7`, `tournaments.routes.js:12`, `matches.routes.js:7`, `applications.routes.js:7`, `fields.routes.js:7` ya usan `router.use(authenticateToken)`; `sports.routes.js` queda público a propósito.
- [ ] Definir y construir el endpoint de validación de sesión (`GET /api/auth/session` o similar) descripto en `Auth.md`, para poder detectar tokens expirados al reconectar.

### Flujo de inscripción a torneos (solicitudes)
- Backend completo (`Application` model + CRUD), **cero UI**. Confirmado como pendiente real por el autor. Falta:
  - [ ] Formulario para que un capitán solicite inscribir su equipo a un torneo (`POST /applications`).
  - [ ] Vista para el organizador: lista de solicitudes `PENDIENTE` de su torneo (`GET /tournaments/:id/applications`), con acción de aprobar/rechazar (`PUT /applications/:id`).
  - [ ] Al aprobar, conectar con `POST /tournaments/:id/participants` (hoy son dos flujos totalmente desacoplados — se puede agregar un participante directo sin pasar nunca por una solicitud aprobada).
  - [ ] Validar `maxRegistrations` y evitar duplicados al agregar un participante.

### Generación de fixture / partidos
- Los tres documentos de planificación (`Ruta.md`, `Canvas de Planificación`, ambos PDF) marcan la generación automática de fixture (Round Robin, y en menor medida brackets) como un objetivo central. Hoy:
  - [ ] No existe ningún endpoint ni botón "Generar fixture" — los partidos se cargan uno por uno vía `POST /matches` con `round.roundId`/`round.number`/`field` armados a mano.
  - [ ] El algoritmo de Round Robin está documentado en pseudocódigo en `Canvas_de_Planificación` pero no está portado a código real en ningún lado del repo provisto.
  - [x] ~~Falta, además, resolver primero ADR-008 (identidad de `Round`) antes de poder generar partidos de forma confiable referenciando su ronda.~~ — ✅ resuelto 27/08 (Opción 1 embebida con _id)

### Estadísticas de torneo
- [ ] `TournamentStats.jsx` es un placeholder explícito. Falta el componente polimórfico (mencionado en el propio texto del placeholder) que lea `sportConfig.validEvents` y agregue `match.keyEvents` por torneo (goleadores, tarjetas, etc.).

### Sistema Suizo
- [ ] `TournamentStandings.jsx` deriva a `UnderConstruction` para `format === 'SWISS'`. Sin implementación de emparejamiento suizo ni de tabla asociada.

### Gestión de canchas (Fields)
- [ ] Backend CRUD completo, cero pantallas. Falta al menos un listado/alta simple para que el organizador pueda elegir una cancha real al crear un partido, en vez de tipear `field.fieldId`/`field.name` a mano.

### Sincronización en background (cache-first real)
- [ ] Hoy el "cache-first + stale-while-revalidate" descripto en las notas (`cache_first_y_cosillas.md`) solo se cumple parcialmente: hay pull inicial en el login, pero ninguna pantalla dispara un refresh en segundo plano al entrar. Un usuario logueado hace días no ve datos nuevos del servidor hasta volver a loguearse. Falta implementar el refresh puntual por pantalla (o, alternativamente, evaluar si conviene reabrir la puerta a algo tipo TanStack Query solo para esta necesidad puntual, revisando el ADR-004).
- [ ] Extender `syncQueue`/`pushSync` a más acciones offline (creación de torneos, equipos, aplicaciones), hoy limitado a partidos.

### Empaquetado móvil (Capacitor)
- [ ] No se encontró evidencia de que el proyecto Capacitor esté inicializado (`android/`, `capacitor.config.*`). Si el objetivo del MVP incluye el `.apk` instalable mencionado en la propuesta de cátedra, falta ese paso de empaquetado, además de las pruebas correspondientes en dispositivo real (para validar que Dexie/IndexedDB efectivamente persiste dentro del WebView de Capacitor tal como se documentó como ventaja).

### Descubrimiento de torneos públicos
- [ ] Hoy el pull inicial solo trae los torneos donde el usuario ya participa (`GET /users/:id/tournaments`). No hay pantalla ni endpoint pensado para "explorar" torneos públicos (`status: PUBLICADO`) de los que el usuario todavía no es parte, necesario para que exista un punto de entrada al flujo de inscripción del punto anterior.

### Manifiesto por deporte, aplicado de punta a punta
- [ ] `CreateTournament.jsx` debería filtrar `FORMATS` según `sportsConfig.rulesConfig.format.allowed` del deporte elegido, y mostrar/ocultar campos de reglas (`subsLimit`, `tieBreakerRules`, `specialRules`) según los `supported: true/false` de cada uno, tal como está diseñado en el modelo pero no consumido todavía.

### Experiencia de Usuario (UI/UX) y Navegación
- [ ] **Completar la Página de Perfil (`Profile.jsx`):**
  - Actualmente `Profile.jsx` está incompleto y no presenta la información del modelo de usuario (ej. deportes de interés, roles, datos de contacto/perfil extendido). Debe reflejar todos los campos relevantes de `User.js`.
- [ ] **Rediseñar el Landing del Dashboard (`/dashboard`):**
  - La ruta `/dashboard` muestra una pantalla vacía con un saludo genérico ("Hola <mail>"). Se debe reemplazar por una vista landing con propósito funcional claro (por ejemplo, redirigir por defecto a "Mis Torneos" o mostrar una vista resumida de actividad/mis equipos/mis torneos).
- [ ] **Pestaña "Mis Solicitudes" en el Dashboard:**
  - Agregar una vista/pestaña dentro del dashboard donde el usuario (jugador o capitán) pueda ver el listado de todas las solicitudes de inscripción que envió (ya sea a título personal o en representación de su equipo), mostrando el estado en tiempo real (Pendiente, Aprobada, Rechazada), torneo destino y notas del organizador.
- [ ] **Rediseño de Vista de Torneos no iniciados / Exploración previa a inscripción:**
  - Cuando un usuario abre o explora un torneo que aún no ha comenzado o del cual no es participante, no debe ver la pestaña general vacía con rondas en blanco.
  - Debe mostrar una vista landing/perfil del torneo con la información clave (instructivo, fechas, cupos, deporte, reglas) y un botón destacado para inscribirse. La vista de gestión/dashboard interno del torneo debe quedar reservada para participantes e inscriptos.

---

## 3. Resumen ejecutivo (para priorizar) — histórico 10/08 (se conserva)

| Prioridad | Ítem | Tipo |
|---|---|---|
| 1 | ~~Fix `import User` en `teams.service.js`~~ — ✅ resuelto | Bug de una línea, alto impacto |
| 2 | ~~Resolver ADR-008 (identidad de `Round`)~~ — ✅ resuelto 27/08 | Decisión de diseño bloqueante |
| 3 | ~~Unificar formato de error en `handle.js`~~ — ✅ resuelto 27/08 | Bug de contrato API |
| 4 | ~~Auth end-to-end (token viaja + rutas protegidas)~~ — ✅ resuelto | Seguridad, dos mitades ya identificadas |
| 5 | UI de solicitudes de inscripción | Feature core de MVP, sin nada de frontend |
| 6 | Generación de fixture | Feature core de MVP, sin nada de backend/frontend |
| 7 | Resto (stats, suizo, fields UI, refresh en background, Capacitor) | Completar alcance / pulido |

---

## 4. Matriz Crítica — actualización 27/08/2026 (confrontación código vs informe)

> Esta sección **no reemplaza** §1-§3; los deja como histórico. Acá se resume qué cambió, qué sigue roto y qué es lo más urgente ahora, con referencia a archivo:línea.

### 4.1 Qué se cerró desde el 10/08

| # | Hallazgo original | Evidencia de cierre | Riesgo residual |
|---|---|---|
| C1 | `teams.service.js` sin `import User` | `backend/src/services/teams.service.js:2` ya importa; `findTeamMembers:55-61` operativo | Bajo — validar seed `username` en staging |
| C2 | Rutas sin `authMiddleware` | `backend/src/routes/users.routes.js:3,12`, `teams.routes.js:3,7`, `tournaments.routes.js:8,12`, `matches.routes.js:3,7`, `applications.routes.js:3,7`, `fields.routes.js:3,7` con `authenticateToken` | Medio — ver C5 |
| C3 | Frontend no manda JWT | `frontend/src/utils/apiFetch.js:10-11` Bearer + `frontend/src/data/tournaments.js:5`, `matches.js:76`, `userSync.js:7` vía `apiFetch` | Bajo |
| C4 | Duplicación `AuthService` | `frontend/src/services/AuthService.js` eliminado; canónico `data/auth.js` + `utils/apiFetch.js` | Bajo — borrar `api/api.js` huérfano |
| ~~C5-parcial | Doble formato error | `backend/src/index.js:59-79` handler global ya normaliza `ValidationError`/`CastError` a `{error:{type,code}}` | Medio — `backend/src/utils/handle.js:13-17` aún devuelve `{error:string}` en camino `handle()` → dos contratos siguen conviviendo según entry-point~~ — ✅ RESUELTO 27/08 | `backend/src/utils/handle.js:13-20` + `backend/src/config/db.js:20-24` unificados — C5 cerrado |

### 4.2 Nuevo hallazgo crítico introducido por el fix de auth (no estaba en informe 10/08)

**🔴 CRÍTICO — `userSync` + `apiFetch 401 → logout` puede dejar Dexie a medio poblar**
- **Dónde:** `frontend/src/utils/apiFetch.js:15-18` hace `logout()` + `window.location.href='/login'` ante cualquier `401`. `frontend/src/data/userSync.js:96-98` lanza N `GET /teams/:id/members` en `Promise.all` ya protegidos.
- **Escenario:** token expira a mitad del pull inicial → primer `401` redirige y el resto de `Promise.all` queda abortado → `bulkPut` parcial (torneos sí, miembros no) → UI `Team.jsx` vuelve a mostrar `LineUp` incompleto aunque el bug C1 esté fixeado.
- **Ajuste sugerido (no implementado aún):** durante `syncUserEnvironment` no redirigir en cada `401` individual; acumular errores, hacer un único `logout` al final, o usar flag `isSyncing` para suprimir redirect hasta completar `bulkPut`. Alternativa: endpoint `POST /sync/pull` atómico en vez de N fetches.

### 4.3 Qué sigue abierto y es bloqueante (sin cambios)

| Prioridad | Ítem | Por qué es crítico ahora | Dónde tocar |
|---|---|---|---|
| ~~**P1** | **ADR-008: `roundSchema { _id:false }` + `Match.round.roundId ref:'Round'` inexistente** | Sin identidad estable no hay fixture confiable ni índice Dexie `[tournamentId+round.roundId]` (`frontend/src/lib/db.js:12`) ni `getMatchesByTournamentAndRound` (`frontend/src/data/matches.js:17-22`) | `backend/src/models/TournamentsModel.js:21-29` quitar `{_id:false}`; migrar `backend/src/models/MatchesModel.js:29`; reindexar Dexie~~ — ✅ RESUELTO 27/08 |
| ~~**P2** | **Unificar formato de error** | `handle.js:13-17` vs `index.js:66-74` → frontend lee `json.error?.message` y a veces es `string` → mensaje genérico oculta “DB no disponible” | `backend/src/utils/handle.js:13-17` envolver `error.status`/`ValidationError` en `AppError`/`ErrorType`~~ — ✅ RESUELTO 27/08 |
| **P3** | **Offline para alta de torneos (y resto de altas)** | Solo `updateMatchSheet` (`frontend/src/data/matches.js:70-92`) encola; `CreateTournament.jsx:102` `createTournament()` hace `apiFetch` directo sin `enqueue(CREATE_TOURNAMENT)` → rompe promesa offline-first | `frontend/src/data/tournaments.js:4-10` + `CreateTournament.jsx:76-109` replicar patrón `navigator.onLine ? apiFetch : enqueue` (infra `syncQueue.js:61-62` ya soporta `CREATE_TOURNAMENT`) |
| **P4** | **Validar inscripción al agregar participante** | `POST /tournaments/:id/participants` (`backend/src/routes/tournaments.routes.js:16`) no valida duplicado ni `maxRegistrations` ni `Application APROBADA` → bypass del flujo | `backend/src/services/tournaments.service.js` `postParticipant` |
| **P5** | **UI inscripción + descubrimiento** | Sin `GET /tournaments?status=PUBLICADO` ni pantallas, el flujo `Application` (`backend/src/services/applications.service.js:36-53` completo) no es usable | Nuevo `pages/ExploreTournaments`, `pages/TournamentApplications`; `frontend/src/data/applications.js:35-40` ya tiene helpers Dexie |
| **P6** | **Generador de fixture** | Sin endpoint/batch, partidos se cargan a mano con `roundId` inventado (depende de P1) | `backend/src/services/fixtures.service.js` nuevo + `POST /tournaments/:id/fixture` |
| **P7** | **Stale-while-revalidate mínimo** | Pull solo al login `frontend/src/data/auth.js:19` → usuario días logueado no ve novedades | Hook `useTournamentWithRefresh` (`apiFetch` + `updatedAt` compare) o reevaluar ADR-004 |

Resto (Stats `TournamentStats.jsx:1-38` placeholder, Suizo `TournamentStandings.jsx:25`, Fields UI, manifiesto `CreateTournament.jsx:27-32` hardcode, `CORS` `index.js:33`, `JWT_SECRET` check, tests) sigue pendiente no bloqueante — ver §2.

### 4.4 Cómo leer el documento de ahora en más

- Títulos ~~tachados~~ = cerrados y verificados en código al 27/08 — se mantienen para trazabilidad, no se borran.
- Checkboxes `[x] ~~tarea~~` en §2 = pendientes del 10/08 que ya no aplican.
- §4 es la fuente de verdad para priorizar el próximo sprint; §1-§3 quedan como histórico del 10/08.

---

### 4.5 Actualización 09/09/2026 — Resolución de Pantallas en Blanco: Asincronismo de React vs Dexie (`Invalid key provided`) y URLs rotas

#### El Desafío
Al acceder a torneos tanto desde el listado público (`/torneos`) como desde el dashboard o URL directa (`/tournament/:id`), la aplicación quedaba en una pantalla en blanco con dos errores en la consola:
1. `Uncaught TypeError: Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>` en `dexie-react-hooks`.
2. `Failed to load resource: the server responded with a status of 404 ()` intentando solicitar IDs de MongoDB (ej. `60c72b2f9b1d8b2bad000021`) como si fuesen rutas locales de imágenes.

#### Raíz del Problema: El choque entre el Render Síncrono de React y el Asincronismo de Dexie
- **React no espera:** El ciclo de vida de componentes funcionales en React es estrictamente síncrono. Cuando un componente monta (Render #1), debe retornar JSX de inmediato; no puede "pausar" la ejecución a la espera de llamadas asíncronas a la base de datos local.
- **`useLiveQuery` en el Render Inicial:** Hooks como `useAuth()` se suscriben a IndexedDB mediante Dexie. En el primer microsegundo (Render #1), la consulta asíncrona a la base de datos aún no finalizó. Por diseño, `useLiveQuery` retorna `undefined` inicialmente para permitir que React dibuje un estado inicial.
- **La reacción en cadena fatal:** Componentes como `TournamentPage` invocaban hooks dependientes: `useApplicationsByApplicant(user?._id)`. Al ser `user === undefined` en Render #1, se pasaba `undefined` como argumento. Dentro del hook, la consulta `db.applications.where('applicantId').equals(userId)` evaluaba con `equals(undefined)`. Dexie valida las claves síncronamente y lanza un `TypeError` fatal en vez de omitir la búsqueda. Esto destruía el árbol de componentes antes de que la consulta inicial del usuario pudiera resolverse y notificar el cambio de estado.
- **La "libreta telefónica" de React (Patrón Observador):** La actualización asíncrona se basa en suscripciones/eventos, no en bucles insistentes (*polling*). Cuando la consulta a IndexedDB finalmente resuelve en background, Dexie emite un evento que actualiza el estado interno del hook y notifica a React para despertar y re-renderizar (Render #2) con los datos cargados. Si la app crashea en el Render #1 por una excepción no capturada de Dexie, esa notificación nunca se procesa.
- **Pantalla en blanco por guardia nula:** Sumado a lo anterior, la condición `if (!user || !tournament) return null;` en `TournamentPage.jsx` provocaba una pantalla totalmente en blanco en vez de mostrar un spinner de carga o un mensaje de error si el torneo no existía o tardaba en sincronizar.

#### Solución Implementada
1. **Blindaje de Hooks contra claves inválidas:**
   - Se aplicaron cláusulas de guarda en todos los hooks de Dexie (`useApplications.js`, `useMatches.js`, `useTeams.js`, `useUsers.js`, `useSportsConfig.js`).
   - Si los parámetros requeridos (`userId`, `tournamentId`, `sportConfigId`, etc.) son falsy/undefined durante el Render #1, los hooks devuelven inmediatamente colecciones seguras vacías (`[]` o `null`) sin disparar consultas inválidas en Dexie.
2. **Resiliencia en `TournamentPage.jsx`:**
   - Se removió el `return null` silencioso.
   - Se implementó un estado de carga explícito con `CircularProgress` mientras Dexie resuelve o mientras se trae el torneo del backend si no existía en la caché local (`fetchTournament(id)`).
   - Se integró `ErrorDisplay` para torneos no encontrados (404 controlado).
3. **Protección de imágenes en `CompetitorPhoto.jsx`:**
   - Se incorporó validación estricta de protocolo en URLs (`http://`, `https://`, `data:`) para evitar que identificadores o cadenas vacías disparen peticiones HTTP relativas que devuelvan 404 en el servidor web.
   - Se agregó captura de error `onError` en el tag `<img>` para degradar suavemente al avatar con la inicial del equipo/participante.
4. **Enrutamiento del Servidor para SPA (Vercel `rewrites`):**
   - En una SPA (Single Page Application) que usa enrutamiento en el cliente (React Router), las rutas internas (ej. `/dashboard/tournaments`) son virtuales. Al recargar la página directamente con F5, el servidor web (Vercel) buscaba una carpeta física o archivo HTML en esa ruta y devolvía un HTTP 404 real del servidor, quebrando además el historial de navegación.
   - Se añadió la configuración estándar de reescritura en `frontend/vercel.json` (`"source": "/(.*)", "destination": "/index.html"`) para que cualquier petición HTTP devuelva el `index.html` raíz y delegue el enrutamiento a React Router.

### 4.6 Desafío: El "Spinner Infinito" en `TournamentPage` y la falsa alarma de datos faltantes en Dexie (09/09/2026)

#### Síntoma
Al hacer clic en una tarjeta de torneo desde "Mis Torneos" (`/dashboard/tournaments` -> `/tournament/:id`), la pantalla quedaba bloqueada indefinidamente mostrando el dial verde de carga (`CircularProgress`), sin renderizar jamás el detalle del torneo ni un error.

#### Raíz del Problema: Ambigüedad en el valor por defecto de `useTournament` y disparo prematuro de red
1. **El valor por defecto engañoso:** En `useTournaments.js`, el hook estaba definido como:
   ```javascript
   export function useTournament(id) {
     return useLiveQuery(() => (id ? db.tournaments.get(id) : null), [id], null)
   }
   ```
   Al tener `null` como 3er argumento (`defaultResult`), en el **Render #1** (síncrono, mientras IndexedDB aún lee del disco de forma asíncrona), el hook retornaba `null`.
2. **Disparo prematuro del fallback de red:** En `TournamentPage.jsx`, un `useEffect` evaluaba:
   ```javascript
   if (tournament === undefined || !tournament) {
     setLoadingBackend(true)
     fetchTournament(id)
   }
   ```
   Como `tournament` valía `null` en el milisegundo cero, la condición se cumplía de inmediato. Se ponía `loadingBackend = true` y se disparaba una petición HTTP por internet hacia el backend (`onrender.com`).
3. **El bloqueo por Cold-Start de Render:**
   En los tiers gratuitos de Render, los servidores se suspenden tras inactividad y tardan entre 50 y 90 segundos en arrancar (*cold start*), o la petición puede quedar colgada.
   Aunque 5 milisegundos después Dexie resolvía con éxito y encontraba el torneo en IndexedDB, la condición de render:
   ```javascript
   if (tournament === undefined || loadingBackend) return <CircularProgress />
   ```
   mantenía la pantalla rehén del spinner hasta que la petición HTTP finalizara. El usuario veía un spinner interminable para abrir un torneo que **ya existía localmente**.

#### Solución Implementada
1. **Tri-estado explícito en `useTournament`:**
   Se configuró el valor por defecto de `useLiveQuery` en `undefined`:
   - `tournament === undefined`: Dexie está ejecutando la lectura asíncrona local (dura ~2-5 ms).
   - `tournament === null`: Dexie completó la lectura y confirmó que el torneo **no existe** en la base de datos local.
   - `tournament === { ... }`: Torneo encontrado en Dexie.
2. **Activación de red únicamente ante cache-miss comprobado:**
   En `TournamentPage.jsx`, el `fetchTournament(id)` ahora solo se dispara si `tournament === null` (es decir, Dexie terminó y no lo encontró) y usando un `useRef(false)` para garantizar que no se reitere en bucle infinito.
3. **UI no bloqueante (Offline-First):**
   Si el torneo está en Dexie, se dibuja en pantalla de forma inmediata. El spinner solo se muestra mientras Dexie hace su micro-lectura inicial (`undefined`) o si verdaderamente no estaba en la base local y se depende de la respuesta del servidor (`tournament === null && loadingBackend`).

---

### 4.7 Actualización 19/10/2026 — Rediseño de Navegación del Torneo: Panel de Ajustes en Barra Superior y "Danger Zone"

#### El Desafío de Diseño y UX
En `TournamentPage.jsx`, la barra superior de acciones acumulaba botones exclusivos de administración del torneo (*"Publicar torneo"*, *"Iniciar torneo"*, *"Finalizar torneo"*, *"Generar Fixture"*, *"Solicitudes"*), ensuciando la interfaz pública para visitantes y jugadores.
Por otro lado, incorporar una 6ta pestaña en la barra de navegación inferior móvil rompía el límite recomendado de usabilidad táctil (3 a 5 items) y arruinaba la simetría del botón central elevado y destacado de **Fixture**.

#### Solución Implementada
1. **Conservación de la Barra Inferior (5 Pestañas Claras):**
   - La barra inferior se mantiene idéntica para todos los usuarios: *Posiciones*, *Equipos*, *Fixture* (centro elevado), *Estadísticas* y *Anuncios*.
   - Se preserva el muro de *Anuncios* para la comunidad (permitiendo que a futuro el organizador redacte comunicados directamente desde ese feed).
2. **Botón de Ajustes ⚙️ en la Barra Superior:**
   - En `Navbar.jsx` y `TournamentNavbar.jsx` se agregó soporte de `rightAction`.
   - Se renderiza un botón **"Ajustes"** en el header superior, visible **únicamente cuando el usuario autenticado es el organizador del torneo** (`isOrganizer`).
   - Al tocarlo, activa la sección `'admin'`, y al tocar cualquier pestaña inferior se regresa con fluidez a la vista general.
3. **Limpieza de la Cabecera de `TournamentPage.jsx`:**
   - Se removieron todos los botones de gestión dispersos.
   - La cabecera ahora solo muestra el chip de estado del torneo (`BORRADOR`, `PUBLICADO`, `EN_CURSO`, etc.) y, para jugadores no inscriptos, el CTA contextual (*"Inscribirme"*, *"Solicitud pendiente"* o *"Ya inscripto"*).
4. **Nuevo Componente `TournamentAdminSettings.jsx`:**
   - **Solicitudes de Inscripción:** Tarjeta con contador en tiempo real de solicitudes pendientes (`[X pendientes]`) y acceso directo a `/torneos/:id/solicitudes`.
   - **Sorteo y Fixture:** Estado de participantes y botón de generación de fixture con validación de mínimo 2 participantes.
   - **Publicación de Borrador:** Botón destacado para pasar el torneo a `PUBLICADO` si está en borrador.
   - **Danger Zone (Estilo GitHub):**
     - Recuadro rojo con título y advertencia visual.
     - Acción **"Despublicar torneo"**: pasa el torneo a estado Borrador (ocultándolo del catálogo público).
     - Diálogo modal de confirmación obligatorio para prevenir clics accidentales.
5. **Persistencia Inmediata en Dexie tras Sorteo:**
   - En `frontend/src/data/tournaments.js#generateFixture`, se incorporó la llamada a `bulkPutMatches(json.data.matches)` para guardar de inmediato los partidos generados en IndexedDB, logrando que el fixture se refleje al instante en pantalla sin requerir recarga.

---

### 4.8 Desafío: Error 400 Bad Request en la Generación de Fixture (Desacople Schema ADR-012 vs `fixture.service.js`) (19/10/2026)

#### Síntoma
Al presionar el botón "Generar Fixture" desde el frontend desplegado en Vercel, la petición HTTP `POST /api/tournaments/:id/fixture` fallaba con error **400 (Bad Request)** en el servidor de Render (`https://gestor-torneos.onrender.com`).

#### Raíz del Problema
1. **Renombre de Schema en ADR-012:**
   El modelo `TournamentsModel.js` definió el subdocumento `ParticipantSnapshotSchema` con `participantId: { type: Schema.Types.ObjectId, required: true }`. Al no declarar la propiedad `teamId`, Mongoose descartaba el campo `teamId` por defecto al hidratar subdocumentos.
2. **Acceso obsoleto en `fixture.service.js`:**
   En las líneas 167-168 de `fixture.service.js`, al construir los documentos de `Match`, el código leía:
   `teamId: match.home.teamId` y `teamId: match.away.teamId`.
   Al estar `teamId` ausente en el snapshot, ambos evaluaban como `undefined`.
3. **Validación estricta de `MatchesModel.js`:**
   `MatchCompetitorSchema` define `teamId: { type: Schema.Types.ObjectId, required: true }`.
   Al intentar ejecutar `Match.insertMany(matchDocs, { session })`, Mongoose abortaba la transacción lanzando:
   `ValidationError: Match validation failed: competitors.0.teamId: Path 'teamId' is required., competitors.1.teamId: Path 'teamId' is required.`
4. **Mapeo a 400 en `handle.js`:**
   El middleware central `backend/src/utils/handle.js` atrapa cualquier `ValidationError` de Mongoose y lo retorna automáticamente con status `400` y tipo `VALIDATION_ERROR`.
5. **Datos desactualizados en MongoDB:**
   Los torneos sembrados inicialmente tenían `"teamId"` en los JSON pero no `"participantId"`, por lo que al hidratarse quedaban sin ningún ID válido.

#### Solución Implementada
1. **Lectura Resiliente con Fallback en `fixture.service.js`:**
   Se actualizó la extracción del ID del competidor:
   ```javascript
   const homeId = match.home?.participantId ?? match.home?.teamId ?? match.home?._id;
   const awayId = match.away?.participantId ?? match.away?.teamId ?? match.away?._id;
   ```
   Se valida que ambos IDs existan antes de armar los documentos (lanzando `AppError` con mensaje claro si faltaran), y se pueblan tanto `participantId` como `teamId` en cada competidor.
2. **Compatibilidad en Schemas de Mongoose:**
   - En `TournamentsModel.js`: se agregó `teamId` a `ParticipantSnapshotSchema` para tolerar documentos históricos.
   - En `MatchesModel.js`: se agregó `participantId` a `MatchCompetitorSchema`.
3. **Migración de Base de Datos:**
   - Se actualizó el script `backend/scripts/migrate-participants-participantId.js` para resolver IDs faltantes a partir del nombre del equipo en `Team.findOne({ name: displayNameSnapshot })`.
   - Se ejecutó la migración actualizando 26 snapshots de participantes en la base de datos de MongoDB.
4. **Despliegue Continuo a Render:**
   - Los cambios fueron fusionados a la rama `dev` y pusheados al repositorio remoto para activar el redeploy automático del servicio backend en Render.

---

### 4.9 Actualización 22/10/2026 — Acceso de Invitados (Navbar Condicional, Rutas Protegidas) y Ciclo de Vida de Sesión por Expiración de Token

#### Síntomas y Desafíos Reportados
1. **Acceso de Invitados y Pantallas Negras sin Salida:**
   - En la sección pública de exploración (`/torneos`), un usuario no autenticado podía visualizar el dashboard completo, pero al hacer clic en los accesos de *Equipos*, *Torneos*, *Perfil* o *Ajustes*, la pantalla quedaba completamente negra sin controles ni posibilidad de regresar.
   - Requerimiento: La sección `/torneos` y las vistas públicas de torneos deben seguir siendo accesibles sin loguearse, pero las secciones privadas no deben mostrarse ni permitir acceso desautenticado.
2. **Sesión "Fantasma" por Token Expirado y Falso Fallo de Sincronización:**
   - Un usuario logueado como organizador de un torneo (con fixture generado en el backend) no visualizaba los partidos en la pestaña de Fixture tras expirar su token.
   - En `authMiddleware.js`, ante un token expirado/inválido en `jwt.verify`, el servidor respondía erróneamente con código HTTP `403 FORBIDDEN` (en vez de `401 UNAUTHORIZED`).
   - El cliente (`apiFetch.js`) solo interceptaba `401` para disparar el logout. Al recibir `403`, la petición fallaba en silencio en el `try/catch` de `userSync.js`, manteniendo al usuario con apariencia de "logueado" en `localStorage`, pero sin poder descargar partidos (`/matches`) ni datos frescos a Dexie.

#### Solución Implementada

1. **Rutas Protegidas en el Cliente (`ProtectedRoute.jsx` y `App.jsx`):**
   - Se creó el componente `frontend/src/components/ProtectedRoute.jsx` que verifica `isLoggedIn` vía `useAuth()`. Si el usuario no tiene sesión activa, redirige inmediatamente a `/login` preservando la ruta previa en `state.from`.
   - En `App.jsx`, se envolvieron todas las rutas privadas (`/dashboard`, `/dashboard/tournaments`, `/dashboard/teams`, `/dashboard/profile`, `/dashboard/config`, inscripciones y gestión de solicitudes).
   - Se mantuvieron públicas las rutas de descubrimiento (`/torneos`, `/tournament/:id`, `/user/:userId`).

2. **Renderizado Condicional de Navegación (`Navbar.jsx` y `config/navigation.js`):**
   - Se definió `publicDashboardNavItems` en `frontend/src/config/navigation.js`: cuando no hay sesión, la barra (tanto superior desktop como bottom-navigation mobile) solo muestra:
     - **Explorar** (`/torneos`)
     - **Login** (`/login`)
     - **Registrarse** (`/register`)
   - Se eliminaron los botones a rutas privadas cuando no hay sesión, y el clic en el logo `TourneyFy` redirige a `/torneos` o `/` en lugar de `/dashboard/tournaments`.

3. **Detección Proactiva de Token Expirado (`useAuth.js`):**
   - En `frontend/src/hooks/useAuth.js`, se añadió la función `isTokenExpired(token)` que decodifica el payload JWT y compara el timestamp `exp` con `Date.now()`.
   - Si el token guardado en `localStorage` ya expiró, el hook purga automáticamente `token` y `currentUserId`, retornando `isLoggedIn: false` antes de que la aplicación realice llamadas fallidas de red.

4. **Normalización de Código HTTP y Cierre Automático de Sesión (`apiFetch.js` y `authMiddleware.js`):**
   - En `backend/src/middlewares/authMiddleware.js`, se corrigió el error de verificación de JWT para responder con `ErrorType.UNAUTHORIZED` (`401`) cuando el token no es válido o está expirado.
   - En `frontend/src/utils/apiFetch.js`, se interceptan tanto respuestas `401` como `403` por expiración de token, invocando `logout()` y redirigiendo inmediatamente a `/login` para evitar estados inconsistentes.

---

### 4.10 Actualización 22/10/2026 — Mejora de Planilla de Partidos: Atribución a Jugadores, Opción Sin Especificar y Descarte de Autogol

#### Contexto y Decisión de Diseño
- **Problema detectado:** Al modelar eventos como `AUTO_GOL`, se producía una inconsistencia de pertenencia: la acción física la comete el jugador de un equipo, pero el incremento de marcador favorece al equipo rival. Asignar el evento al equipo infractor sumaba el gol erróneamente a su propio tanteador, y asignarlo al rival impedía seleccionar al autor o le otorgaba un gol a favor en la tabla individual de goleadores.
- **Toma de Decisión (Principio de Genericidad y Simplicidad):**
  1. Se eliminó el evento artificial `AUTO_GOL` de la configuración deportiva (`futbol7.json`).
  2. Todo gol se registra genéricamente como `GOL` a favor del equipo beneficiado.
  3. Si el gol fue en contra o no tiene autor identificado, el operador selecciona la opción **"Sin especificar / Equipo"** en el selector de jugador.
  4. Los goles con jugador identificado acumulan en la tabla de goleadores individuales (`playerScorers`), mientras que los goles sin especificar acumulan únicamente en el marcador del partido y en la tabla general de equipos (`scorers`).


---

### 4.11 Actualización 26/10/2026 — Corrección de Error "roundId no pertenece al torneo indicado" al Guardar Planilla

#### Contexto del Error Detectado en Producción
- **Síntoma:** Al finalizar o corregir la planilla de un partido desde la interfaz web (Vercel) conectada al backend (Render), al presionar **"GUARDAR PLANILLA"** se mostraba un cartel de error rojo: *`roundId no pertenece al torneo indicado`*. Sin embargo, en el entorno local (IndexedDB / Dexie) la vista se actualizaba reflejando los eventos agregados.
- **Causa Raíz:**
  1. **Actualización optimista de Dexie:** `frontend/src/data/matches.js:updateMatchSheet` escribe primero en Dexie (`await putMatch(data)`) antes de realizar la petición de red, dando la impresión visual de que los cambios se guardaron localmente.
  2. **Envío de claves inmutables en el PUT:** La función `buildMatchUpdatePayload` enviaba todo el objeto del partido (`...rest`), incluyendo `tournamentId` y `round` (`{ roundId, number }`).
  3. **Validación restrictiva en `matches.service.js:update`:** El backend contenía una verificación que consultaba `Tournament.findOne({ _id: tournamentId, 'rounds._id': roundId })`. Si los datos provenían de seeds iniciales donde los subdocumentos de `Tournament.rounds` tenían `_id` autogenerados distintos a los que tenían los partidos en su propiedad `round.roundId`, la validación fallaba con `400 Bad Request` y el backend rechazaba el guardado.

#### Solución Técnica Implementada
1. **Frontend (`frontend/src/data/matches.js`):** Se limpió `buildMatchUpdatePayload` para extraer y descartar `_id`, `tournamentId` y `round`. Al actualizar la planilla solo deben viajar datos propios del resultado y eventos (`status`, `keyEvents`, `competitors`, `result`, `sportConfigId`). Al no enviar `round`, el backend no ejecuta validaciones de cambio de ronda.
2. **Backend (`backend/src/services/matches.service.js`):**
   - Se modificó `update` para que la verificación de existencia de ronda solo se ejecute si realmente hay un intento de mutar la ronda o el torneo (`isRoundChanging || isTournamentChanging`). Si el partido continúa en su jornada asignada, la operación no se bloquea.
   - Se incorporó un fallback: si la ronda se modifica pero el `roundId` difiere a nivel de ObjectId respecto al subdocumento, se busca por `roundNumber` y se auto-resuelve el `_id` real de la ronda.
3. **Script de Reconciliación (`backend/scripts/migrate-rounds-adr008.js`):** Se actualizó para permitir la sincronización bidireccional entre los `_id` de las rondas del torneo y los `round.roundId` de los partidos en bases de datos existentes.

#### Estado y Verificación
- Integrado en ramas `dev`, `main` y `fix/match-sheet-round-validation` con build de producción validado exitosamente.


---

### 4.12 Actualización 26/10/2026 — Validación de Rango de Minutos en Planilla de Partido y Pendiente de Duración por Deporte

#### Contexto y Problema Detectado
- En la carga de eventos minuto a minuto de `MatchSheetDialog`, el campo de texto de minuto permitía ingresar valores negativos (ej. `-5`) o números arbitrariamente gigantes sin límite (ej. `23123123`).
- Ni en el componente frontend ni en el esquema Mongoose (`MatchesModel.js`) ni en el validador del servicio (`matches.service.js`) existía una restricción que evitara números menores a cero o valores fuera de escala.

#### Solución Implementada
1. **Frontend (`MatchSheetDialog.jsx`):**
   - Se configuró el `TextField` con `slotProps={{ htmlInput: { min: 0, max: 999, step: 1 } }}` y saneamiento en `onChange` para restringir la entrada a enteros entre 0 y 999.
   - En `handleAddDetailedEvent`, se agregaron validaciones explícitas (`m < 0` o `m > 999`) mostrando un mensaje de error si el usuario intenta ingresar un valor fuera de rango.
2. **Backend (`MatchesModel.js` y `matches.service.js`):**
   - En `MatchesModel.js`, se añadió `min: 0, max: 999` a la propiedad `minute` de `MatchEventSchema`.
   - En `matches.service.js:validate`, se agregó la validación para que cualquier evento en `keyEvents` contenga un minuto numérico entre 0 y 999.

#### Pendiente para Próximos Sprints / Roadmap
- **Parametrización de Duración Reglamentaria por Deporte y Torneo:**
  Actualmente se utilizó un límite superior amplio (`999`) para permitir prórrogas y adaptarse genéricamente a deportes de distinta duración. Queda registrado para futuras versiones incorporar en `SportsConfig.sportProps` o en `Tournament.rules` la duración reglamentaria del partido (ej. 50' para Fútbol 7, 90' para Fútbol 11, 40' para Básquet FIBA, etc.) y una regla de tolerancia para tiempos extra/suplementarios.
