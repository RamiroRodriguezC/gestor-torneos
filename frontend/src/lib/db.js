import Dexie from 'dexie'

export const db = new Dexie('tourneyfy')

// Versión 1: stores originales
db.version(1).stores({
  users: '_id, email, globalRole',
  teams: '_id, name, discipline, capitanId',
  sportsConfig: '_id, name',
  applications: '_id, tournamentId, applicantId, participantId, status',
  tournaments: '_id, status, organizerId, sportConfigId, isDeleted, [status+isDeleted]',
  matches: '_id, tournamentId, status, isDeleted, updatedAt, [tournamentId+round.roundId]',
  fields: '_id, name',
})

// Versión 2: agregamos la store para la cola de sincronización offline
db.version(2).stores({
  users: '_id, email, globalRole',
  teams: '_id, name, discipline, capitanId',
  sportsConfig: '_id, name',
  applications: '_id, tournamentId, applicantId, participantId, status',
  tournaments: '_id, status, organizerId, sportConfigId, isDeleted, [status+isDeleted]',
  matches: '_id, tournamentId, status, isDeleted, updatedAt, [tournamentId+round.roundId]',
  fields: '_id, name',
  sync_queue: 'id, entity, action, status, createdAt',
})

// Versión 3: ADR-008 opción 1 — rounds ahora tienen _id propio (subdocumento embebido con identidad)
// El índice [tournamentId+round.roundId] pasa a ser estable; no cambia definición de stores pero
// fuerza upgrade en clientes con DB vieja para que próximo syncUserEnvironment reemplace torneos sin _id.
db.version(3).stores({
  users: '_id, email, globalRole',
  teams: '_id, name, discipline, capitanId',
  sportsConfig: '_id, name',
  applications: '_id, tournamentId, applicantId, participantId, status',
  tournaments: '_id, status, organizerId, sportConfigId, isDeleted, [status+isDeleted]',
  matches: '_id, tournamentId, status, isDeleted, updatedAt, [tournamentId+round.roundId]',
  fields: '_id, name',
  sync_queue: 'id, entity, action, status, createdAt',
})
