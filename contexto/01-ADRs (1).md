# TourneyFy — Architecture Decision Records (ADR)

> Fuente de verdad: el repositorio y el código ya escrito. Cada ADR se contrastó contra el código real al momento de redactar este documento (10/08/2026). Donde la nota original y el código no coincidían, se marca explícitamente y se resolvió con el autor del proyecto.

Formato: **Contexto → Decisión → Alternativas descartadas → Consecuencias → Estado**

---

## ADR-001 — Plataforma de desarrollo: Web + Capacitor, no Ionic

**Contexto.** La propuesta original de cátedra (`Plan de trabajo` / `Proyecto Seminario`, ambos previos al desarrollo) planteaba un stack MERN clásico con **Ionic** como framework de UI cross-platform sobre React o Angular, para lograr una PWA + app híbrida con una sola base de código.

**Decisión.** Se descartó Ionic. El proyecto final usa **React 19 + Vite** puro para la UI, con **Capacitor** reservado únicamente como contenedor nativo para empaquetar el build web en un `.apk`, sin usar los componentes visuales de Ionic.

**Alternativas descartadas** (documentadas en `Ruta.md` / `Definición de Stack.md`):
- **Ionic (clásico):** descartado por rigidez visual del sistema de componentes, ecosistema de pago en declive, y sobrecarga de directivas/hooks propietarios innecesaria para un MVP de 2 meses.
- **React Native + Expo:** descartado porque no reutiliza HTML/CSS (obliga a `<View>`/`<Text>` en vez de elementos web) y duplicaría la base de código para admins de escritorio vs. usuarios móviles.
- **Flutter (Dart):** descartado por curva de aprendizaje de un lenguaje nuevo (Dart) + arquitectura de widgets, incompatible con el plazo de 2 meses y sin sinergia con la experiencia previa en JS/Node del autor.

**Consecuencias.** Se ganó libertad total de diseño (MUI como librería de componentes) al costo de perder los wrappers nativos que Ionic daba gratis (gestos, transiciones nativas). Capacitor sigue siendo el camino para el `.apk`, pero **no hay evidencia en el repo de que el proyecto Capacitor (`npx cap init/add android`) esté efectivamente inicializado** — no existe carpeta `android/` ni `capacitor.config.*` en el árbol provisto. Ver informe de pendientes.

**Estado.** ✅ Decidido e implementado (frontend). ⚠️ Empaquetado móvil con Capacitor: pendiente de verificar/inicializar.

---

## ADR-002 — Persistencia local offline: Dexie.js (IndexedDB), no SQLite

**Contexto.** El sistema requiere carga de planillas sin conexión en la cancha. Se evaluó SQLite (vía `@capacitor-community/sqlite`) como motor embebido tradicional.

**Decisión.** Se adoptó **Dexie.js** como wrapper sobre IndexedDB.

**Alternativas descartadas:**
- **SQLite:** descartado por ser un motor relacional que exige tablas y columnas fijas, en tensión directa con la necesidad de esquemas flexibles por deporte (`SportsConfig`). Además, requiere plugins nativos comunitarios que complican el build local y el testing en `localhost`.

**Consecuencias.** Dexie permite guardar el mismo JSON que devuelve la API de Mongo sin transformación (`_id` string funciona como PK en ambos lados), a costa de que **Dexie no valida esquema** — cualquier campo anidado viaja "tal cual venga", lo que traslada la responsabilidad de integridad de datos casi enteramente al backend (Mongoose) y a la disciplina del código de la capa `data/*.js`.

**Estado.** ✅ Decidido e implementado. Ver `frontend/src/lib/db.js`.

---

## ADR-003 — Estrategia de lectura: Cache-first + stale-while-revalidate sobre Dexie

**Contexto.** La app nunca debe bloquear la UI esperando al backend; siempre tiene que mostrar algo.

**Decisión.** Toda pantalla lee primero de Dexie (`useLiveQuery`) y, si hay conexión, se dispara en segundo plano un `fetch` a la API que compara `updatedAt` y pisa Dexie solo si el dato del servidor es más nuevo.

**Consecuencias / brecha detectada.** El patrón está **descrito en `cache_first_y_cosillas.md` pero no está implementado de forma genérica en el código**. Lo que existe realmente es:
- Un **pull inicial completo** en el login (`syncUserEnvironment`), que trae usuario, torneos, equipos, miembros, sportsConfig y matches relevantes de una sola vez.
- **No hay refresh en segundo plano por pantalla** (no hay ningún `useEffect` en `TournamentPage.jsx`, `Team.jsx`, `Profile.jsx`, etc. que dispare un `fetch` + comparación de `updatedAt` al entrar a la vista). Los hooks (`useTournament`, `useTeam`, `useMatchesByTournament`...) leen **exclusivamente** de Dexie.
- El único mecanismo real de "traer novedades" es el pull completo del login/registro y el `pushSync()` al reconectar (que sube cambios, no baja cambios nuevos del servidor).

Esto significa que, en la práctica, **un usuario que quede logueado varios días no vuelve a recibir datos nuevos del servidor** salvo que haga logout/login de nuevo. Se documenta como decisión "en progreso" — el diseño está bien pensado en las notas pero el código todavía no lo realiza. Se detalla como pendiente de MVP en el informe aparte.

**Estado.** 🟡 Parcialmente implementado (pull inicial sí, refresh continuo no).

---

## ADR-004 — Estado de servidor: Dexie + `useLiveQuery`, no TanStack Query

**Contexto.** `Canvas_de_Planificación` y `Definición_de_Stack.md` (notas de planificación intermedias) proponían **TanStack Query (React Query)** como capa de manejo de estado asíncrono, cache e invalidación de queries.

**Decisión.** Confirmado con el autor: la idea de TanStack Query se evaluó y **se descartó en favor de Dexie como única fuente de estado del cliente**, tal como quedó asentado en `Implementacion_Dexie.md` y `cache_first_y_cosillas.md`. No hay ninguna dependencia de `@tanstack/react-query` en `package.json`, y toda la reactividad de UI corre por `dexie-react-hooks`.

**Alternativas descartadas.** TanStack Query — hubiese dado invalidación de cache y refetch declarativo "gratis", pero se priorizó tener **una sola fuente de verdad reactiva** (Dexie) en vez de dos sistemas de cache superpuestos (React Query en memoria + Dexie en disco), evitando duplicar la lógica de "qué es lo más fresco".

**Consecuencias.** Se resigna el refetch/invalidation automático que hubiera resuelto gran parte del gap del ADR-003 "gratis". Al no tener TanStack Query, ese refresco hay que construirlo a mano.

**Estado.** ✅ Decidido.

---

## ADR-005 — Modelado polimórfico multideporte vía `competitors[]` / `keyEvents[]`

**Contexto.** El sistema debe soportar deportes con lógicas de partido muy distintas (fútbol 1v1 con goles, golf tipo leaderboard con strokes, etc.) sin re-modelar `Match` por cada deporte nuevo.

**Decisión.**
- Se reemplazaron los campos rígidos `homeTeam` / `awayTeam` (presentes en el primer boceto, `gestorTorneos.mml`) por un array `competitors[]` con `side: HOME|AWAY|NONE`.
- Se reemplazaron eventos tipados por deporte (`redCards[]`, `goals[]` separados, visibles en el `.mml` viejo) por un único array `keyEvents[]` con `eventType` (string libre validado contra `SportsConfig.validEvents.code`) e `incrementScore` genérico.
- El "manifiesto" `SportsConfig` (`sportProps`, `validEvents`, `rulesConfig`) es la fuente de verdad de qué es válido para cada deporte; agregar un deporte nuevo es, en teoría, insertar un documento nuevo en esa colección sin tocar código de modelos.

**Alternativas descartadas.** Modelar una colección/subdocumento distinto por deporte (lo que sugería el primer boceto en `Diseño Entidades` del PDF `Proyecto_Seminario`, con campos ad-hoc como "¿hay tarjeta azul?"). Se descartó por no escalar: cada deporte nuevo hubiese requerido tocar el schema de Mongoose.

**Consecuencias.** El marcador **no se persiste como número**; se computa siempre sumando `incrementScore` de `keyEvents` filtrados por equipo (ver `utils/standings.js` y `matchUtils.js`). Esto es potente pero **caro de leer** (recalcular en cada render) si el volumen de eventos por partido crece.

**Estado.** ✅ Decidido e implementado.

---

## ADR-006 — Patrón Snapshot para nombres/logos/roster

**Contexto.** Si un equipo cambia de nombre o logo después de haberse anotado a un torneo, o si el plantel se modifica luego del cierre de inscripción, no debería afectar la información histórica de un torneo/partido ya jugado o en curso.

**Decisión.** Se "congelan" copias (`displayNameSnapshot`, `logoURLSnapshot`) dentro de `Tournament.participantes[]` y `Match.competitors[]` al momento de la inscripción/creación del partido, en vez de repoblar (`.populate()`) contra `Team` en cada lectura.

**Consecuencias.** Gran ganancia de performance para lectura offline-first (no hace falta reconstruir joins), a costa de que **actualizar un logo de equipo no se propaga retroactivamente** a torneos/partidos ya existentes — es un trade-off consciente y correcto para el caso de uso (histórico deportivo), no un bug.

**Estado.** ✅ Decidido e implementado.

---

## ADR-007 — Renombre `Tournament.dates` → `Tournament.rounds`, `Match.date` → `Match.round`

**Contexto.** Documentado íntegramente en `decision-rounds.md`. El campo `dates` contenía información estructural (jornadas/fases), no fechas puntuales — el nombre inducía a error.

**Decisión.** Renombrado a `rounds`, con dos campos nuevos por ronda: `type` (`ROUND_ROBIN | PLAYOFF_BRACKET | GROUP_STAGE`) y `status` (`SCHEDULED | IN_PROCESS | COMPLETED`). `GROUP_STAGE` se mantiene deliberadamente separado de `ROUND_ROBIN` para permitir en el futuro que una fase de grupos tenga estado propio distinto al de sus rondas internas.

**Estado.** ✅ Decidido e implementado en el modelo actual (`TournamentsModel.js`, `MatchesModel.js`, `enums.js`).

---

## ADR-008 — Identidad de las rondas: subdocumento embebido con `_id` propio (✅ RESUELTO 27/08/2026 — Opción 1)

**Contexto.** `roundSchema` estaba declarado con `{ _id: false }` — las rondas dentro de `Tournament.rounds[]` no tenían identificador propio de Mongo. Sin embargo, `Match.round.roundId` era un `ObjectId` con `ref: 'Round'`, un modelo que **no existía** en `models/`. Confirmado con el autor: era una inconsistencia real.

**Intención original del autor:** que las rondas dependan siempre del torneo — "sin el torneo, la ronda no existe" — por eso se embebieron.

**Decisión (27/08/2026, rama `dev`).** ✅ **Opción 1 — Mantener embebido, agregar identidad propia.** Se quitó `{ _id: false }` de `roundSchema` (`backend/src/models/TournamentsModel.js:21-28`), Mongoose genera `_id: ObjectId` automáticamente por subdocumento. Ese `_id` es el valor canónico de `Match.round.roundId` (PK compuesta lógica `tournamentId + roundId`, ver 01-ADRs tabla relación). `Match.round.roundId` (`backend/src/models/MatchesModel.js:29`) ya no usa `ref:'Round'` sino `ObjectId` plano con comentario ADR-008. `frontend/src/lib/db.js:28-38` bump a Dexie v3 para estabilizar índice `[tournamentId+round.roundId]`.

Alternativa descartada: Extraer `Round` a colección propia — daba identidad real y `populate`, pero exigía `find` extra y rompía offline-first embebido (mismo `Tournament` viajando con `rounds` para Dexie). Se evaluó pero el costo no justificaba el beneficio dado que la unicidad necesaria es por torneo, no global.

**Consecuencias / garantías:** `ObjectId` embebido es virtualmente único sin índice global; la unicidad que importa es intra-torneo `(tournamentId, roundId)`. `tournaments.service.js:addRound` ahora valida `roundNumber` no duplicado y retorna `rounds` con `_id`; `matches.service.js:create/update` valida que `roundId` pertenezca al `tournamentId` (`findOne { _id, 'rounds._id': roundId }`). Migración para datos existentes: `backend/scripts/migrate-rounds-adr008.js` (idempotente, `--dry-run` disponible).

**Estado.** ✅ Resuelto e implementado en `dev` (27/08/2026).

---

## ADR-009 — Autenticación: JWT en `localStorage`, sin sesión offline real

**Contexto.** Documentado en `Auth.md`. Se necesitaba un mecanismo simple de sesión para un MVP de 2 meses, sabiendo que la app debe seguir "utilizable" sin conexión.

**Decisión.** Token JWT + `currentUserId` persistidos en `localStorage`. No hay PIN de dispositivo, no hay hash de contraseña replicado en IndexedDB, no hay validación de sesión offline real: si hay `currentUserId` en `localStorage`, se asume la sesión válida sin poder verificarla contra el servidor.

**Consecuencias asumidas desde el diseño (ver `Auth.md`):**
- Un token robado por XSS permite actuar como ese usuario mientras el token sea válido.
- Si el token expira estando offline, la app sigue "andando" hasta que detecte conexión y falle una validación — no hay expiración forzada offline.

**Brecha detectada vs. la intención original.** El diseño en `Auth.md` asumía un flujo `GET /api/auth/session` para revalidar el token al recuperar conexión, y que **todas las escrituras viajarían con el header `Authorization: Bearer`**. Ninguna de las dos cosas está implementada: no existe el endpoint de sesión, y ninguna función de `data/*.js` adjunta el token a sus `fetch`. Ver ADR-011 y el informe de errores — esto se resolvió por decisión: **se va a consolidar todo en `data/auth.js`, dejando `services/AuthService.js` y el interceptor de `api/api.js` como base a integrar, y la protección real de rutas queda confirmada como pendiente de MVP.**

**Estado.** 🟡 Diseño de referencia definido; implementación de "JWT que efectivamente protege algo" pendiente (ver ADR-011 e informe de pendientes).

---

## ADR-010 — Manejo de errores tipado end-to-end (`AppError` + `ErrorType`)

**Contexto.** Se buscaba evitar que cada `try/catch` inventara su propio formato de error.

**Decisión.** Backend: clase `AppError` + diccionario congelado `ErrorType` (`type`, `code`, `defaultMessage`), capturado centralmente en `handle.js`, que responde siempre `{ error: { type, message, code } }` para los errores controlados. Frontend: `ErrorDisplay.jsx` + `config/errors.js` resuelven ese `type` a un ícono/color/mensaje consistente en toda la UI.

**Consecuencias / brecha detectada (actualizado 27/08).** El contrato `{ error: { type, message, code } }` inicialmente no se cumplía en todos los caminos: `ValidationError`/`CastError` y el `Error` plano de `requireDB()` devolvían `{ error: "string" }` en `handle.js`.

**Resolución 27/08 (P2, rama `dev`):** `backend/src/utils/handle.js:13-20` unificado para devolver siempre `{ error: { type, message, code } }` (mapea `error.status` → `ErrorType` + `ValidationError/CastError` → `VALIDATION_ERROR` + fallback → `INTERNAL_ERROR` con `error.message`). `backend/src/config/db.js:20-24` `requireDB()` ahora lanza `AppError(ErrorType.INTERNAL_ERROR, 'Base de datos no disponible')` tipado. `backend/src/index.js:59-79` ya estaba unificado y queda como referencia canónica. El frontend `frontend/src/utils/apiFetch.js:23` ya manejaba ambos formatos (`json.error?.message || json.error`); ahora siempre recibe objeto tipado.

**Estado.** ✅ Decidido e implementado — formato unificado 27/08/2026 (P2).

---

## ADR-011 — Consolidación de la capa de autenticación del frontend (decisión tomada en esta sesión)

**Contexto.** Coexistían dos implementaciones de auth en el frontend (ver ADR-009 y el informe de errores, hallazgo #1): `data/auth.js` (fetch plano, sin header `Authorization`, es la que efectivamente usan `Login.jsx`/`Register.jsx`/`userSync.js`) y `services/AuthService.js` + `api/api.js` (axios con interceptor que sí arma `Authorization: Bearer <token>`, pero que ninguna pantalla importa).

**Decisión (confirmada por el autor).** `data/auth.js` es la implementación canónica. El trabajo pendiente es **integrar el interceptor de `api/api.js` dentro de `data/auth.js`** (o migrar los `fetch` de `data/*.js` a usar la instancia `api` de axios) para que el token viaje en cada request protegido, y **deprecar/eliminar `services/AuthService.js`**, que queda huérfano.

**Estado.** ✅ Decisión tomada. 🔴 Implementación pendiente — impacta directamente en que la protección de rutas (ADR-009) pueda funcionar en algún momento, porque hoy ningún request lleva el token.

---

## Resumen de estados

| ADR | Tema | Estado |
|---|---|---|
| 001 | Ionic descartado, React+Vite+Capacitor | ✅ Decidido / ⚠️ Capacitor sin inicializar en el repo |
| 002 | Dexie sobre SQLite | ✅ Decidido e implementado |
| 003 | Cache-first + stale-while-revalidate | 🟡 Parcial (falta refresh en background por pantalla) |
| 004 | Dexie en vez de TanStack Query | ✅ Decidido |
| 005 | Modelado polimórfico `competitors[]`/`keyEvents[]` | ✅ Decidido e implementado |
| 006 | Patrón Snapshot | ✅ Decidido e implementado |
| 007 | `dates`→`rounds` | ✅ Decidido e implementado |
| 008 | Identidad de `Round` | ✅ Resuelto 27/08/2026 — embebido con `_id` (Opción 1) |
| 009 | JWT en localStorage | 🟡 Diseño ok / protección real pendiente |
| 010 | `AppError`/`ErrorType` | ✅ Resuelto 27/08/2026 — formato `{error:{type,message,code}}` unificado (`handle.js` + `requireDB` + `index.js`) |
| 011 | Consolidar auth frontend en `data/auth.js` | ✅ Decidido / 🔴 implementación pendiente |
| 012 | Polimorfismo de participantes `participantId` | ✅ Decidido e implementado 22/10/2026 |
| 013 | Carga de planillas: atribución a jugadores y simplificación de eventos inversos (sin `AUTO_GOL`) | ✅ Decidido e implementado 22/10/2026 |
| 014 | Desacoplamiento de validación de rondas y payload selectivo en actualización de partidos | ✅ Decidido e implementado 26/10/2026 |

---

## ADR-012 — Polimorfismo en identificadores de participantes (`participantId ?? teamId`)

**Contexto.** En torneos y partidos, existían divergencias donde el modelo requería `teamId` mientras el nuevo estándar polimórfico utilizaba `participantId` para admitir tanto deportes por equipos (`TEAM`) como individuales (`INDIVIDUAL`).

**Decisión.** Adoptar `participantId` como estándar unificado tolerando `teamId` por retrocompatibilidad en todos los puntos de lectura (`participantId ?? teamId`) y poblar ambos en la creación del fixture.

**Estado.** ✅ Decidido e implementado.

---

## ADR-013 — Carga de planillas: atribución de eventos a jugadores del lineup y simplificación de autogoles

**Contexto.** Inicialmente los eventos de partido (`keyEvents`) solo sumaban al marcador global del competidor/equipo sin identificar a la persona que realizó la acción. Al diseñar la atribución a jugadores surgieron complejidades con eventos "inversos" o cruzados como el `AUTO_GOL` (donde la acción la realiza un jugador/equipo, pero el punto suma al rival en el marcador). Tratar el autogol como evento separado generaba inconsistencias semánticas (un evento atribuido al infractor sumándole un gol a favor en la tabla de goleadores) o exigía acoplar lógica condicional ad-hoc de "equipo beneficiario vs infractor", rompiendo la genericidad del motor multideporte.

**Decisión.**
1. **Atribución genérica a jugadores:** En deportes colectivos (`TEAM`), la planilla permite asociar eventos (`GOL`, `AMARILLA`, `ROJA`, etc.) a cualquier miembro del lineup del equipo (obtenido reactivamente desde `db.teams` + `db.users` o del subdocumento `competitors[].lineUp`).
2. **Opción "Sin especificar / Equipo":** En todo evento es posible omitir el jugador (`playerId: undefined`). Esto permite registrar goles anónimos, jugadas confusas y situaciones colectivas sin trabar la planilla.
3. **Eliminación de `AUTO_GOL`:** Se decide explícitamente **descartar el evento `AUTO_GOL` del catálogo de eventos de `SportsConfig`** (removido de `futbol7.json`). Cuando ocurre un autogol, se registra genéricamente como un `GOL` a favor del equipo que lo recibe, seleccionando la opción *"Sin especificar / Equipo"*.
4. **Impacto en estadísticas:** Los goles con jugador identificado alimentan la tabla de goleadores individuales del torneo (`playerScorers`), mientras que los goles sin especificar suman al total del equipo y del partido sin distorsionar la tabla individual.

**Alternativas descartadas:**
- **Evento `AUTO_GOL` con equipo invertido o lógica especial de "equipo contrario":** descartado por complejidad innecesaria. Obligaba a bifurcar los cálculos de marcador en `matchUtils`, `standings` y `BracketTree` para chequear casos especiales de eventos negativos, contradiciendo el principio de mantener el motor deportivo lo más agnóstico y genérico posible.

**Consecuencias:** Carga rápida y simple para el árbitro/organizador, cero lógica acoplada a nombres de eventos específicos, y datos 100% compatibles con los schemas preexistentes de Mongoose.

**Estado.** ✅ Decidido e implementado (22/10/2026).


---

## ADR-014 — Desacoplamiento de validación de rondas y payload selectivo en actualización de partidos

**Contexto.** Al guardar una planilla de partido finalizado en producción (`PUT /matches/:id`), la aplicación retornaba un error `400 Bad Request` con el mensaje: *"roundId no pertenece al torneo indicado"*. Si bien en IndexedDB (Dexie) los cambios se visualizaban de inmediato gracias al guardado optimista local, la petición al backend era rechazada y no se persistía en MongoDB.

El origen del problema radicaba en que:
1. En `frontend/src/data/matches.js:buildMatchUpdatePayload`, se reenviaba todo el objeto del partido incluyendo `tournamentId` y `round` (`{ roundId, number }`).
2. En `backend/src/services/matches.service.js:update`, la existencia de `data.round?.roundId` disparaba incondicionalmente una verificación contra la base de datos (`Tournament.findOne({ _id: tournamentId, 'rounds._id': roundId })`).
3. En bases de datos existentes o datos precargados (seeds donde `Tournament.rounds` generó `_id` aleatorios de subdocumento que no coincidían exactamente con el `round.roundId` del partido), esta consulta fallaba catastróficamente, bloqueando el guardado de eventos, resultados y estados de partidos legítimos.

**Decisión.**
1. **Payload selectivo en Frontend:** Modificar `buildMatchUpdatePayload` en `frontend/src/data/matches.js` para excluir `_id`, `tournamentId` y `round`. La planilla de partido solo debe enviar los datos dinámicos que cambian en el encuentro (`status`, `keyEvents`, `competitors`, `result`, `sportConfigId`), protegiendo las referencias estructurales del torneo/fixture de mutaciones accidentales o validaciones indebidas.
2. **Validación condicional al cambio real en Backend:** En `backend/src/services/matches.service.js:update`, restringir la validación de pertenencia al torneo únicamente a los casos donde el partido efectivamente esté cambiando de ronda o de torneo (`isRoundChanging || isTournamentChanging`). Si el partido se mantiene en su jornada actual, no se ejecuta la validación.
3. **Mecanismo de fallback por número de jornada:** Si una operación de creación o cambio de ronda envía un `roundId` que no coincide por `_id` de subdocumento pero sí coincide con el `roundNumber` de la jornada del torneo, el backend auto-resuelve el `_id` real de la ronda en el torneo (`data.round.roundId = matchingRound._id`) evitando falsos positivos.
4. **Script de sincronización bidireccional:** Actualizar `backend/scripts/migrate-rounds-adr008.js` para permitir reconciliar y alinear los `_id` de las rondas de los torneos con los `round.roundId` de los partidos en bases de datos ya desplegadas.

**Consecuencias:** La carga y guardado de planillas funciona fluidamente online y offline sin colisionar con discrepancias históricas de identificadores de subdocumentos. Se respeta el principio de mínima superficie de mutación en las peticiones REST.

**Estado.** ✅ Decidido e implementado (26/10/2026).


---

## ADR-015 — Sistema de Creación de Equipos y Gestión de Planteles mediante Códigos de Invitación (Join Code)

**Contexto.** Hasta el momento, los equipos participantes solo existían como datos precargados mediante seeds. Un usuario registrado no disponía de ninguna interfaz ni flujo en el backend para fundar su propio equipo, ni existía un mecanismo para convocar a otros jugadores y conformar el plantel (roster).
Además, el endpoint primitivo `POST /teams` requería enviar `capitanId` manualmente en el cuerpo de la petición sin vincular al usuario autenticado, no añadía al capitán a la lista de integrantes (`team.members[]`) y no actualizaba la relación en la colección de usuarios (`user.teams[]`), dejando los datos desvinculados tanto en MongoDB como en el almacenamiento local IndexedDB (Dexie).

**Decisión.**
1. **Creación con vinculación reactiva bidireccional:**
   - En el backend (`teams.controller.js` y `teams.service.js`), `POST /teams` toma automáticamente el `req.user.id` del token JWT autenticado (permitiendo `capitanId` manual solo si el rol global es `ADMIN`).
   - Valida la disciplina contra `SportsConfig` y previene nombres duplicados dentro del mismo deporte.
   - Inicializa el array de integrantes agregando de forma inmediata al creador (`{ userId: capitanId }`).
   - Actualiza atómicamente al usuario en MongoDB (`$addToSet: { teams: { teamId, role: 'CAPITAN' } }`).
   - En el frontend (`data/teams.js:createTeam`), persiste el equipo en `db.teams` y actualiza `user.teams` en `db.users`, garantizando que hooks reactivos como `useTeamsByUser` y `useAuth` reflejen la pertenencia al instante sin necesidad de relogueo.
2. **Generación criptográfica de códigos de invitación (Join Code):**
   - Se descartó el hasheado unidireccional (como bcrypt) porque el capitán requiere poder consultar su código en cualquier momento para compartirlo.
   - Se adoptó el alfabeto *Crockford Base32* (`23456789ABCDEFGHJKLMNPQRSTUVWXYZ`, 32 caracteres) generado mediante CSPRNG nativo (`crypto.randomBytes`). Al ser $256 \pmod{32} = 0$, la distribución de caracteres es estrictamente uniforme (cero sesgo de módulo).
   - Se excluyen caracteres ambiguos (`0/O`, `1/I/L`) para maximizar la usabilidad en dispositivos móviles.
   - Longitud estándar de 6 caracteres ($32^6 \approx 1.07 \times 10^9$ combinaciones posibles).
3. **Privacidad y ciclo de vida del código:**
   - El código se almacena en el subdocumento `team.inviteCode` con `select: false` en Mongoose, evitando su exposición en listados públicos o consultas generales de equipos.
   - Solo el capitán del equipo (o un `ADMIN`) puede consultar el código a través del endpoint protegido `GET /teams/:id/invite-code`.
   - Vencimiento automático a los 7 días desde su generación (`expiresAt`).
   - El capitán cuenta con la capacidad de regenerar el código en cualquier momento (`POST /teams/:id/regenerate-code`), invalidando inmediatamente el anterior en caso de filtraciones.
4. **Flujo de unión y control de plantel:**
   - Endpoint `POST /teams/join` que valida código, vigencia, estado activo, previene duplicados (no permite unirse si ya es miembro o capitán) y respeta el límite de participantes máximos configurado en el deporte (`SportsConfig`).
   - Endpoint `DELETE /teams/:id/members/:userId` que permite al capitán o administrador expulsar a integrantes no deseados, o a los miembros abandonar el equipo de forma voluntaria (protegiendo siempre al capitán de auto-expulsión sin traspaso previo).

**Consecuencias.** Se cierra el ciclo vital de conformación de equipos de forma intuitiva, segura y alineada con la experiencia habitual de aplicaciones sociales/deportivas (estilo Discord o Classroom). La sincronización local en Dexie permite que tanto la creación como la unión se reflejen de inmediato en la UI.

**Estado.** ✅ Decidido e implementado (28/10/2026).

---

## ADR-016 — Ciclo de vida de rondas y torneos, coronación automática del campeón y postergación de palmarés/anuncios para post-MVP

**Contexto.**
1. En la versión anterior, las rondas (`tournament.rounds[]`) permanecían estáticas en estado `SCHEDULED` sin importar si sus partidos se estaban jugando o ya se habían completado.
2. El endpoint de estado del torneo (`PATCH /tournaments/:id/status`) tenía una restricción en el backend que rechazaba cualquier transición distinta de `BORRADOR` y `PUBLICADO`, impidiendo que los torneos avanzaran legítimamente a `EN_CURSO` o `FINALIZADO`.
3. El modelo de datos (`TournamentsModel.js`) no poseía un campo para persistir al campeón o ganador del certamen, careciendo de un mecanismo de coronación oficial una vez jugados todos los partidos.
4. Respecto a requerimientos complementarios como el palmarés histórico en los perfiles de equipos y jugadores, y la pestaña de anuncios del torneo, se evaluó su alcance respecto al MVP.

**Decisión.**
1. **Ciclo de vida automático de jornadas/rondas:**
   - Una ronda permanece en `SCHEDULED` mientras todos sus partidos estén programados.
   - Pasa a `IN_PROCESS` cuando al menos un partido ha iniciado o finalizado, pero aún restan encuentros pendientes.
   - Pasa a `COMPLETED` (culminada) de forma estricta y automática cuando **el 100% de los partidos de dicha ronda tienen `status === 'FINALIZADO'`**.
2. **Ciclo de vida y culminación del torneo:**
   - Pasa a `EN_CURSO` al iniciar el torneo o al disputarse sus primeros encuentros.
   - Pasa a `FINALIZADO` cuando **todas las rondas del torneo alcanzan el estado `COMPLETED`**.
   - Se habilita además en el backend y frontend la acción explícita del organizador para gestionar estas transiciones.
3. **Persistencia y Proclamación del Campeón:**
   - Se incorpora el subdocumento `champion` dentro de `TournamentSchema` con snapshot del participante (`participantId`, `displayNameSnapshot`, `logoURL`, `participantType`, `crownedAt`).
   - Al finalizar todas las rondas, el backend calcula automáticamente el campeón oficial (según tabla de clasificación por puntos, diferencia de goles y goles a favor para Round Robin, o el ganador de la final para llaves eliminatorias).
   - En el frontend, se despliega el Banner de Coronación en `TournamentPage`, insignias en la tabla de posiciones (`StandingsTable`) y en las tarjetas de torneos (`TournamentCard`).
4. **Decisión de Diseño de Alcance (MVP):**
   - **Palmarés e historial acumulado en equipos/usuarios** y la funcionalidad de **Anuncios comunitarios** quedan formalmente definidos como características **fuera del MVP** y se postergan para futuros sprints y versiones post-lanzamiento.

**Estado.** ✅ Decidido e implementado (28/10/2026).

