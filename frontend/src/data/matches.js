import { db } from '../lib/db.js'

export async function getMatchById(id) {
  return db.matches.get(id)
}

export async function getMatchesByTournament(tournamentId) {
  return db.matches
    .where('tournamentId')
    .equals(tournamentId)
    .filter((m) => !m.isDeleted)
    .toArray()
}

export async function getMatchesByTournamentAndRound(tournamentId, roundId) {
  return db.matches
    .where('[tournamentId+round.roundId]')
    .equals([tournamentId, roundId])
    .filter((m) => !m.isDeleted)
    .toArray()
}

export async function getMatchesByStatus(status) {
  return db.matches
    .where('status')
    .equals(status)
    .filter((m) => !m.isDeleted)
    .toArray()
}

export async function getRecentMatches(limit = 20) {
  return db.matches
    .where('isDeleted')
    .equals(false)
    .reverse()
    .sortBy('updatedAt')
    .then((rows) => rows.slice(0, limit))
}

export async function getOfflineMatches() {
  return db.matches
    .where('isOffline')
    .equals(true)
    .toArray()
}

export async function putMatch(match) {
  return db.matches.put({
    ...match,
    updatedAt: new Date().toISOString(),
  })
}

export async function bulkPutMatches(matches) {
  const now = new Date().toISOString()
  return db.matches.bulkPut(
    matches.map((m) => ({ ...m, updatedAt: now }))
  )
}

export async function removeMatch(id) {
  return db.matches.delete(id)
}
