# CopaHub — Rol Moderador de Torneo (RF-02)

Documento de especificación técnica, arquitectura e implementación integral del **Rol Moderador** en CopaHub / TourneyFy.

---

## 1. Contexto y Objetivos (RF-02 y Tabla de Permisos)

Para respaldar el requerimiento funcional **RF-02** y garantizar la operación delegada de los certámenes deportivos, se implementó el soporte integral del rol **Moderador** tanto en backend como en frontend.

El sistema distingue dos niveles de administración para cada torneo:
1. **Organizador (Owner / Creador):** Propietario absoluto del certamen (`tournament.organizerId`). Posee control total sobre la configuración, publicación, ciclo de vida y designación de moderadores.
2. **Moderador:** Colaborador asignado por el organizador (`tournament.moderators[]`) para tareas operativas de campo y gestión diaria del torneo.

### Matriz de Permisos

| Acción / Funcionalidad | Organizador (Owner) | Moderador | Otros Usuarios |
|---|:---:|:---:|:---:|
| Ver torneo y fixture público | ✅ | ✅ | ✅ |
| Acceso a "Ajustes ⚙️" del torneo | ✅ | ✅ | ❌ |
| Gestión de Solicitudes de Inscripción | ✅ | ✅ | ❌ |
| Gestión de Canchas / Ubicaciones | ✅ | ✅ | ❌ |
| Generación y configuración de Fixture | ✅ | ✅ | ❌ |
| Carga y edición de Planilla de Partido | ✅ | ✅ | ❌ |
| Alta y baja de Moderadores | ✅ | ❌ (Solo Owner) | ❌ |
| Despublicación / Borrado del Torneo | ✅ | ❌ (Solo Owner) | ❌ |

---

## 2. Modelo de Datos (Mongoose & Dexie)

### 2.1. Modelo Torneo (`backend/src/models/TournamentsModel.js`)

Se agregó el subdocumento `ModeratorSchema` y la propiedad `moderators` dentro de `TournamentSchema`:

```javascript
const ModeratorSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  usernameSnapshot: { type: String, default: '' },
  emailSnapshot: { type: String, default: '' },
  assignedAt: { type: Date, default: Date.now },
}, { _id: false });

// En TournamentSchema:
moderators: { type: [ModeratorSchema], default: [] },
```

### 2.2. Modelo Usuario (`backend/src/models/UsersModel.js`) y Enums (`constants/enums.js`)

Se incorporó `'MODERADOR'` en el enum `USER_TOURNAMENT_ROLE`:
```javascript
export const USER_TOURNAMENT_ROLE = ['ORGANIZADOR', 'COORDINADOR', 'JUGADOR', 'MODERADOR'];
```

Cuando un usuario es designado moderador, se actualiza atómicamente su array de torneos vinculados:
```javascript
User.tournaments: [{
  tournamentId: ObjectId,
  role: 'MODERADOR',
  status: 'PUBLICADO' | 'EN_CURSO' | ...
}]
```

### 2.3. Base Local Dexie (`frontend/src/lib/db.js`)
Los documentos se replican desde el backend completos en Dexie. Los moderadores viajan embebidos en `db.tournaments.moderators[]` y en `db.users.tournaments[]`.

---

## 3. Seguridad y Middlewares de Autorización (`authMiddleware.js`)

En `backend/src/middlewares/authMiddleware.js` se definieron y extendieron los middlewares para proteger las rutas:

1. **`isOrganizador` (Solo Owner):**
   Valida que `req.user.id` sea igual a `tournament.organizerId` o que el usuario tenga rol global `ADMIN`. Protege el alta y baja de moderadores, así como acciones irreversibles de borrado.
2. **`isOrganizadorOrModerador`:**
   Permite el acceso si `req.user.id` es el organizador (`organizerId`), si el usuario tiene rol `ADMIN`, o si su `_id` figura en `tournament.moderators[].userId`. Protege:
   - Aprobación / rechazo de solicitudes (`/api/tournaments/:id/applications`).
   - Creación, modificación y baja de canchas (`/api/tournaments/:id/fields`).
   - Generación de fixture (`/api/tournaments/:id/fixture`).
3. **`canManageMatch`:**
   Inspecciona el partido (`Match`), recupera el torneo asociado y permite la carga y edición de planillas tanto al organizador como a los moderadores.

---

## 4. Endpoints de la API Backend

### 4.1. Designar Moderador
- **Ruta:** `POST /api/tournaments/:id/moderators`
- **Seguridad:** Autenticado (`authenticateToken`) + Solo Owner (`isOrganizador`).
- **Body:** `{ "emailOrUsername": "usuario@ejemplo.com" }`
- **Lógica:**
  - Busca usuario por email exacto o por `username` insensible a mayúsculas/minúsculas.
  - Valida que no sea el propio organizador del torneo.
  - Valida que no haya sido agregado previamente.
  - Inserta el snapshot `{ userId, usernameSnapshot, emailSnapshot, assignedAt }` en `tournament.moderators`.
  - Agrega `{ tournamentId, role: 'MODERADOR', status: tournament.status }` a `User.tournaments`.
  - Retorna `200 OK` con la lista actualizada de moderadores.

### 4.2. Revocar Moderador
- **Ruta:** `DELETE /api/tournaments/:id/moderators/:userId`
- **Seguridad:** Autenticado (`authenticateToken`) + Solo Owner (`isOrganizador`).
- **Lógica:**
  - Remueve al usuario de `tournament.moderators`.
  - Hace `$pull` de `User.tournaments` donde `tournamentId` coincida y el rol sea `'MODERADOR'`.
  - Retorna `200 OK` con la lista actualizada de moderadores.

### 4.3. Consulta de Torneos del Usuario
- **Ruta:** `GET /api/users/:id/tournaments`
- **Lógica (`users.service.js`):**
  Devuelve todos los torneos donde el usuario sea organizador, donde esté en `user.tournaments`, o donde figure en `moderators.userId`:
  ```javascript
  Tournament.find({
    $or: [
      { _id: { $in: ids } },
      { organizerId: userId },
      { 'moderators.userId': userId },
    ],
    isDeleted: false,
  });
  ```

---

## 5. Implementación en Frontend

### 5.1. Detección de Permisos en la Vista del Torneo (`TournamentPage.jsx`)
```javascript
const isOrganizer = user && tournament && String(tournament.organizerId) === String(user._id)
const isModerator = user && (tournament?.moderators || []).some(
  (m) => String(m.userId?._id || m.userId) === String(user._id)
)
const canManage = isOrganizer || isModerator
```
- El botón superior **"Ajustes ⚙️"** se habilita para `canManage`.
- El banner informativo o botones de gestión operativa se muestran tanto para el organizador como para el moderador.

### 5.2. Panel de Ajustes del Torneo (`TournamentAdminSettings.jsx`)
- **Tarjeta "Moderadores del Torneo":**
  - Visible y editable únicamente para el Owner (`isOwner = isOrganizer`).
  - Permite buscar un usuario por email o username y añadirlo con un click.
  - Lista los moderadores actuales con su nombre de usuario, email, fecha de asignación y botón para revocar el permiso.
- **Zona de Peligro (Despublicar / Borrar Torneo):**
  - Restringida exclusivamente al Owner (`isOwner`). Los moderadores no visualizan ni pueden disparar estas opciones destructivas.

### 5.3. Edición de Planillas de Partido (`MatchDetail.jsx`)
```javascript
const canEditSheet = isOrganizer || isModerator
```
Habilita el botón de carga de eventos, goles, faltas y firmas de planillas tanto para el organizador como para los moderadores.

### 5.4. Listado "Mis Torneos" (`Tournaments.jsx` y `useTournaments.js`)
- `useTournamentsByUser(userId)` en `frontend/src/hooks/useTournaments.js` evalúa los torneos en Dexie comprobando:
  1. Si el ID del torneo está en `user.tournaments`.
  2. Si `tournament.organizerId === userId`.
  3. Si algún moderador en `tournament.moderators` coincide con `userId`.
- `Tournaments.jsx` ejecuta `refreshEnvironment()` al montarse para sincronizar de inmediato los torneos desde el servidor a IndexedDB.

### 5.5. Perfil de Usuario (`Profile.jsx`)
- Se configuró el badge y chip visual para el rol moderador:
  - `TOURNAMENT_ROLE_LABEL.MODERADOR = 'Moderador'`
  - `ROLE_BG.MODERADOR = '#00b0ff'` (azul celeste distinguible de organizador naranja y capitán verde).
- Si `user.tournaments` aún no reflejó el cambio en local, se deduce en caliente a partir del subdocumento `moderators` del torneo.

---

## 6. Sincronización y Modo Offline-First

- La asignación de moderadores se realiza online directamente al backend para validar unicidad y existencia del usuario.
- En caso de reconexión o login, `userSync.js` descarga los torneos moderados vía `GET /api/users/:userId/tournaments` y los almacena en `db.tournaments`.
- Una vez cacheados en Dexie, el moderador puede operar de forma offline en canchas sin conectividad: cargar planillas de partidos y registrar eventos, los cuales se encolan en `sync_queue` para enviarse cuando regrese la conexión.
