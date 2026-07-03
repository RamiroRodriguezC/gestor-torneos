import { putUser, bulkPutUsers } from './users.js'
import { bulkPutTeams } from './teams.js'
import { bulkPutTournaments } from './tournaments.js'
import { bulkPutMatches } from './matches.js'

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) {
    console.warn(`  ${url} — ${res.status} ${res.statusText}`)
    return null
  }
  const json = await res.json()
  return json.data ?? json
}

export async function syncUserEnvironment(userId) {
  if (!userId) throw new Error('userId es requerido')

  console.log(`[userSync] Iniciando sync para userId: ${userId}`)
  console.log(`[userSync] API URL: ${API}`)

  const user = await fetchJSON(`${API}/users/${userId}`)
  if (!user) throw new Error(`No se pudo obtener el usuario ${userId}`)
  console.log(`[userSync] Usuario obtenido: ${user.name} ${user.lastName} (_id: ${user._id})`)
  await putUser(user)
  console.log(`[userSync] Usuario guardado en IndexedDB`)

  const counts = { user: 1, teams: 0, members: 0, tournaments: 0, matches: 0 }

  const [tournaments, teams] = await Promise.all([
    fetchJSON(`${API}/users/${userId}/tournaments`),
    fetchJSON(`${API}/users/${userId}/teams`),
  ])

  if (tournaments?.length) {
    console.log(`[userSync] Torneos obtenidos: ${tournaments.length}`)
    await bulkPutTournaments(tournaments)
    counts.tournaments = tournaments.length
    console.log(`[userSync] ${tournaments.length} torneos guardados en IndexedDB`)
  } else {
    console.log(`[userSync] El usuario no tiene torneos`)
  }

  if (teams?.length) {
    console.log(`[userSync] Equipos obtenidos: ${teams.length}`)
    await bulkPutTeams(teams)
    counts.teams = teams.length
    console.log(`[userSync] ${teams.length} equipos guardados en IndexedDB`)

    const membersArrays = await Promise.all(
      teams.map((t) => fetchJSON(`${API}/teams/${t._id}/members`))
    )
    const allMembers = membersArrays.flatMap((a) => a ?? [])
    console.log(`[userSync] Miembros obtenidos: ${allMembers.length}`)
    if (allMembers.length > 0) {
      await bulkPutUsers(allMembers)
      counts.members = allMembers.length
      console.log(`[userSync] ${allMembers.length} miembros guardados en IndexedDB`)
    }
  } else {
    console.log(`[userSync] El usuario no tiene equipos`)
  }

  const allMatches = await fetchJSON(`${API}/matches`)
  if (allMatches?.length && tournaments?.length) {
    const ids = new Set(tournaments.map((t) => t._id))
    const relevant = allMatches.filter(
      (m) => ids.has(m.tournamentId) && !m.isDeleted
    )
    console.log(`[userSync] Partidos totales: ${allMatches.length}, relevantes: ${relevant.length}`)
    if (relevant.length > 0) {
      await bulkPutMatches(relevant)
      counts.matches = relevant.length
      console.log(`[userSync] ${relevant.length} partidos guardados en IndexedDB`)
    }
  } else {
    console.log(`[userSync] Partidos saltados (sin torneos del usuario)`)
  }

  console.log(`[userSync] Sync completado. Resumen:`, counts)
  return counts
}
