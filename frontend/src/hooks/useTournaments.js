import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db.js'

export function useTournaments() {
  return useLiveQuery(() => db.tournaments.where('isDeleted').equals(false).toArray(), [], [])
}

export function useTournament(id) {
  return useLiveQuery(() => db.tournaments.get(id), [id], null)
}

export function useActiveTournaments() {
  return useLiveQuery(() => db.tournaments.where('[status+isDeleted]').equals(['PUBLICADO', false]).toArray(), [], [])
}

export function useTournamentsByStatus(status) {
  return useLiveQuery(() => db.tournaments.where('[status+isDeleted]').equals([status, false]).toArray(), [status], [])
}

export function useTournamentsByUser(userId) {
  return useLiveQuery(async () => {
    if (!userId) return []
    const user = await db.users.get(userId)
    if (!user?.tournaments?.length) return []
    const tournamentIds = user.tournaments.map(t => t.tournamentId)
    return db.tournaments.where('_id').anyOf(tournamentIds).filter(t => !t.isDeleted).toArray()
  }, [userId], [])
}
