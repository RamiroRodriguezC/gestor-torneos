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

export function useTeamsByUser(userId) {
  return useLiveQuery(async () => {
    if (!userId) return []
    const user = await db.users.get(userId)
    if (!user?.teams?.length) return []
    const teamIds = user.teams.map(t => t.teamId).filter(Boolean)
    if (!teamIds.length) return []
    return db.teams.where('_id').anyOf(teamIds).toArray()
  }, [userId], [])
}
