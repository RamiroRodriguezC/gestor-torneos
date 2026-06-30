import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db.js'

export function useApplication(id) {
  return useLiveQuery(() => db.applications.get(id), [id], null)
}

export function useApplicationsByTournament(tournamentId) {
  return useLiveQuery(() => db.applications.where('tournamentId').equals(tournamentId).toArray(), [tournamentId], [])
}

export function useApplicationsByApplicant(userId) {
  return useLiveQuery(() => db.applications.where('applicantId').equals(userId).toArray(), [userId], [])
}

export function useApplicationsByStatus(status) {
  return useLiveQuery(() => db.applications.where('status').equals(status).toArray(), [status], [])
}
