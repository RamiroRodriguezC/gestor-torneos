import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db.js'

export function useTeams() {
  return useLiveQuery(() => db.teams.toArray(), [], [])
}

export function useTeam(id) {
  return useLiveQuery(() => db.teams.get(id), [id], null)
}

export function useTeamsByDiscipline(sportConfigId) {
  return useLiveQuery(() => db.teams.where('discipline').equals(sportConfigId).toArray(), [sportConfigId], [])
}

export function useTeamsByCaptain(userId) {
  return useLiveQuery(() => db.teams.where('capitanId').equals(userId).toArray(), [userId], [])
}
