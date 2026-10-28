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

export async function joinTeamByCode(code, currentUserId) {
  const json = await apiFetch('/teams/join', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
  const team = json.data
  if (team) {
    await db.teams.put(team)

    const userId = currentUserId || localStorage.getItem('currentUserId')
    if (userId) {
      const user = await db.users.get(userId)
      if (user) {
        const teams = user.teams || []
        const alreadyIn = teams.some((t) => String(t.teamId) === String(team._id))
        if (!alreadyIn) {
          user.teams = [...teams, { teamId: team._id, role: 'MIEMBRO' }]
          await putUser(user)
        }
      }
    }
  }
  return team
}

export async function fetchTeamInviteCode(teamId) {
  const json = await apiFetch(`/teams/${teamId}/invite-code`)
  return json.data
}

export async function regenerateTeamInviteCode(teamId) {
  const json = await apiFetch(`/teams/${teamId}/regenerate-code`, {
    method: 'POST',
  })
  return json.data
}

export async function removeMemberFromTeam(teamId, memberUserId) {
  const json = await apiFetch(`/teams/${teamId}/members/${memberUserId}`, {
    method: 'DELETE',
  })

  // Actualizar equipo en Dexie
  const localTeam = await db.teams.get(teamId)
  if (localTeam) {
    localTeam.members = (localTeam.members || []).filter(
      (m) => String(m.userId) !== String(memberUserId)
    )
    await db.teams.put(localTeam)
  }

  // Actualizar usuario en Dexie si es el usuario logueado
  const currentUserId = localStorage.getItem('currentUserId')
  if (String(currentUserId) === String(memberUserId)) {
    const user = await db.users.get(currentUserId)
    if (user) {
      user.teams = (user.teams || []).filter((t) => String(t.teamId) !== String(teamId))
      await putUser(user)
    }
  }

  return json.data
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
