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

export function useTournamentsByOrganizer(userId) {
  return useLiveQuery(() => db.tournaments.where('organizerId').equals(userId).filter((t) => !t.isDeleted).toArray(), [userId], [])
}
