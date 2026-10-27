import { db } from '../lib/db.js'
import { apiFetch } from '../utils/apiFetch.js'
import { putUser } from './users.js'

export async function createTeam(teamData) {
  const json = await apiFetch('/teams', {
    method: 'POST',
    body: JSON.stringify(teamData),
  })
  const team = json.data
  if (team) {
    // 1. Guardar equipo en Dexie
    await db.teams.put(team)

    // 2. Actualizar el usuario en Dexie para que useTeamsByUser y useAuth reaccionen de inmediato
    const captainId = typeof team.capitanId === 'object' ? team.capitanId?._id : (team.capitanId || teamData.capitanId)
    if (captainId) {
      const user = await db.users.get(captainId)
      if (user) {
        const teams = user.teams || []
        const alreadyHasTeam = teams.some((t) => String(t.teamId) === String(team._id))
        if (!alreadyHasTeam) {
          user.teams = [...teams, { teamId: team._id, role: 'CAPITAN' }]
          await putUser(user)
        }
      }
    }
  }
  return team
}

export async function getAllTeams() {
  return db.teams.toArray()
}

export async function getTeamById(id) {
  return db.teams.get(id)
}

export async function getTeamsByDiscipline(sportConfigId) {
  return db.teams.where('discipline').equals(sportConfigId).toArray()
}

export async function getTeamsByCaptain(userId) {
  return db.teams.where('capitanId').equals(userId).toArray()
}

export async function putTeam(team) {
  return db.teams.put(team)
}

export async function bulkPutTeams(teams) {
  return db.teams.bulkPut(teams)
}

export async function removeTeam(id) {
  return db.teams.delete(id)
}
