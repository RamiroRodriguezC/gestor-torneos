# Informe de Avance — Backend TourneyFy

## 1. Estructura de capas (routes / controllers / services)

Se estableció una arquitectura en 3 capas para toda la lógica del backend:

```
src/
├── config/          → Conexión a DB + requireDB()
├── constants/       → Enums centralizados
├── models/          → Schemas de Mongoose
├── services/        → Lógica de negocio y validación
├── controllers/     → Handlers HTTP (parseo request / response)
├── routes/          → Definición de endpoints
├── seeds/           → Generación y archivos JSON de seed
└── index.js         → Punto de entrada, registro de rutas
```

## 2. Endpoints creados

### 2.1 Deportes — `/api/sports`
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/sports` | Lista todas las configuraciones de deportes |
| `GET` | `/api/sports/:name` | Detalle de un deporte por nombre |

### 2.2 Usuarios — `/api/users`
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/users` | Lista usuarios activos (sin hashedPassword) |
| `GET` | `/api/users/:id` | Detalle de usuario |
| `POST` | `/api/users` | Crear usuario (valida email único, formato, dateOfBirth) |
| `PUT` | `/api/users/:id` | Actualizar usuario |

### 2.3 Equipos — `/api/teams`
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/teams` | Lista equipos activos |
| `GET` | `/api/teams/:id` | Detalle de equipo |
| `POST` | `/api/teams` | Crear equipo |
| `PUT` | `/api/teams/:id` | Actualizar equipo |

### 2.4 Torneos — `/api/tournaments`
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/tournaments` | Lista torneos |
| `GET` | `/api/tournaments/:id` | Detalle de torneo |
| `POST` | `/api/tournaments` | Crear torneo |
| `PUT` | `/api/tournaments/:id` | Actualizar torneo |
| `GET` | `/api/tournaments/:id/participants` | Lista participantes |
| `POST` | `/api/tournaments/:id/participants` | Agregar participante |
| `GET` | `/api/tournaments/:id/dates` | Lista fechas |
| `POST` | `/api/tournaments/:id/dates` | Crear fecha |
| `GET` | `/api/tournaments/:id/applications` | Lista solicitudes |

## 3. Modelo SportsConfig — Nuevos campos

- Se agregó `rulesConfig` al schema: indica qué reglas de torneo soporta cada deporte (scoringSystem, subsLimit, formatos permitidos, etc.)
- Se renombró `basicRules` → `sportProps` para evitar ambigüedad con React props

## 4. Correcciones

- `ApplicationsModel.js`: `isDeleted` movido de opciones del schema a campo real
- `seed.js`: los JSON de deportes no tenían `_id`, causando que solo se cargara el último archivo (handball). Se agregaron los IDs fijos correspondientes
- `config/db.js`: eliminado `process.exit(1)` al fallar conexión a MongoDB — el servidor ya no crashea
- Factorización: `requireDB()` extraído a `config/db.js` y reutilizado en todos los services

## 5. Seed data

- 3 deportes: FUTBOL_7, HANDBALL, BASQUETBALL
- 253 usuarios + 24 equipos + 3 canchas + 2 torneos + 24 solicitudes + 23 partidos
- Comandos: `npm run db:generate` | `npm run db:seed` | `npm run db:reset`
- README actualizado con documentación de todos los scripts

## 6. Pendiente

- Usuario "Ramiro Rodriguez" creado y agregado a "Los Matadores FC"
- **Revisar `rulesConfig`**: verificar que la estructura de `supported` y `allowed` cubra todos los casos de uso, que esté correctamente aplicada en los 3 deportes, y que el frontend pueda consumirla sin fricción
