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
