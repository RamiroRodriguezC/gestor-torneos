import Dexie from 'dexie'

export const db = new Dexie('tourneyfy')

db.version(1).stores({
  users: '_id, email, globalRole',
  teams: '_id, name, discipline, capitanId',
  sportsConfig: '_id, name',
  applications: '_id, tournamentId, applicantId, participantId, status',
  tournaments: '_id, status, organizerId, sportConfigId, isDeleted, [status+isDeleted]',
  matches: '_id, tournamentId, status, isDeleted, updatedAt, [tournamentId+date.dateId]',
  fields: '_id, name',
})
