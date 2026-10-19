import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db.js'

export function useApplication(id) {
  return useLiveQuery(() => (id ? db.applications.get(id) : null), [id], null)
}

export function useApplicationsByTournament(tournamentId) {
  return useLiveQuery(() => (
    tournamentId ? db.applications.where('tournamentId').equals(tournamentId).toArray() : []
  ), [tournamentId], [])
}

export function useApplicationsByApplicant(userId) {
  return useLiveQuery(() => (
    userId ? db.applications.where('applicantId').equals(userId).toArray() : []
  ), [userId], [])
}

export function useApplicationsByStatus(status) {
  return useLiveQuery(() => (
    status ? db.applications.where('status').equals(status).toArray() : []
  ), [status], [])
}
