import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db.js'

export function useMatch(id) {
  return useLiveQuery(() => db.matches.get(id), [id], null)
}

export function useMatchesByTournament(tournamentId) {
  return useLiveQuery(() => db.matches.where('tournamentId').equals(tournamentId).filter((m) => !m.isDeleted).toArray(), [tournamentId], [])
}

export function useMatchesByTournamentAndRound(tournamentId, roundId) {
  return useLiveQuery(() => db.matches.where('[tournamentId+round.roundId]').equals([tournamentId, roundId]).filter((m) => !m.isDeleted).toArray(), [tournamentId, roundId], [])
}

export function useOfflineMatches() {
  return useLiveQuery(() => db.matches.where('isOffline').equals(true).toArray(), [], [])
}
