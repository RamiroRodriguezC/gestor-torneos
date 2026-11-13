import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db.js'

export function useTournaments() {
  return useLiveQuery(() => db.tournaments.filter(t => !t.isDeleted).toArray(), [], [])
}

export function useTournament(id) {
  return useLiveQuery(
    async () => {
      if (!id) return null
      const t = await db.tournaments.get(id)
      return t ?? null
    },
    [id],
    undefined
  )
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
    const userTournamentIds = (user?.tournaments || []).map((t) => String(t.tournamentId)).filter(Boolean)

    return db.tournaments
      .filter((t) => {
        if (t.isDeleted) return false
        if (userTournamentIds.includes(String(t._id))) return true
        if (String(t.organizerId) === String(userId)) return true
        if ((t.moderators || []).some((m) => String(m.userId?._id || m.userId) === String(userId))) return true
        return false
      })
      .toArray()
  }, [userId], [])
}
