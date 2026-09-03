import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db.js'

export function useTournaments() {
  return useLiveQuery(() => db.tournaments.filter(t => !t.isDeleted).toArray(), [], [])
}

export function useTournament(id) {
  return useLiveQuery(() => (id ? db.tournaments.get(id) : null), [id], null)
}

export function useActiveTournaments() {
  return useLiveQuery(() => db.tournaments.filter(t => t.status === 'PUBLICADO' && !t.isDeleted).toArray(), [], [])
}

export function useTournamentsByStatus(status) {
  return useLiveQuery(() => db.tournaments.filter(t => t.status === status && !t.isDeleted).toArray(), [status], [])
}

export function useTournamentsByUser(userId) {
  return useLiveQuery(async () => {
    if (!userId) return []
    const user = await db.users.get(userId)
    if (!user?.tournaments?.length) return []
    const tournamentIds = user.tournaments.map(t => t.tournamentId).filter(Boolean)
    if (!tournamentIds.length) return []
    return db.tournaments.where('_id').anyOf(tournamentIds).filter(t => !t.isDeleted).toArray()
  }, [userId], [])
}
