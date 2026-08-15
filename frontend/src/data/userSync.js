import { putUser, bulkPutUsers } from './users.js'
import { bulkPutTeams } from './teams.js'
import { bulkPutTournaments } from './tournaments.js'
import { bulkPutMatches } from './matches.js'
import { bulkPutSports } from './sportsConfig.js'
import { db } from '../lib/db.js'
import { apiFetch } from '../utils/apiFetch.js'

async function fetchJSON(url) {
  try {
    const json = await apiFetch(url)
    return json.data ?? json
  } catch (err) {
    console.warn(`  ${url} — ${err.message}`)
    return null
  }
}

export async function syncUserEnvironment(userId) {
  if (!userId) throw new Error('userId es requerido')

  console.log(`[userSync] Iniciando sync para userId: ${userId}`)

  const user = await fetchJSON(`/users/${userId}`)
  if (!user) throw new Error(`No se pudo obtener el usuario ${userId}`)
  console.log(`[userSync] Usuario obtenido: ${user.name} ${user.lastName} (_id: ${user._id})`)
  await putUser(user)

  const counts = { user: 1, teams: 0, members: 0, tournaments: 0, matches: 0, sportConfigs: 0 }

  const [tournaments, teams] = await Promise.all([
    fetchJSON(`/users/${userId}/tournaments`),
    fetchJSON(`/users/${userId}/teams`),
  ])

  const allTeams = teams?.length ? [...teams] : []
  const seenTeamIds = new Set(allTeams.map((t) => t._id))

  if (tournaments?.length) {
    console.log(`[userSync] Torneos obtenidos: ${tournaments.length}`)
    await bulkPutTournaments(tournaments)
    counts.tournaments = tournaments.length

    const sportConfigIds = new Set()
    for (const t of tournaments) {
      if (t.sportConfigId) sportConfigIds.add(t.sportConfigId)
    }
    if (sportConfigIds.size > 0) {
      const allConfigs = await fetchJSON(`/sports`)
      const validConfigs = (allConfigs || []).filter(
        (s) => s._id && sportConfigIds.has(s._id)
      )
      if (validConfigs.length > 0) {
        await bulkPutSports(validConfigs)
        counts.sportConfigs = validConfigs.length
      }
    }

    const tournamentTeamIds = [
      ...new Set(
        tournaments.flatMap((t) =>
          (t.participantes || []).map((p) => p.teamId).filter(Boolean)
        )
      ),
    ]

    const missingIds = tournamentTeamIds.filter((id) => !seenTeamIds.has(id))
    if (missingIds.length > 0) {
      const fetched = await Promise.all(
        missingIds.map((id) => fetchJSON(`/teams/${id}`))
      )
      for (const t of fetched) {
        if (t) {
          allTeams.push(t)
          seenTeamIds.add(t._id)
        }
      }
    }
  } else {
    console.log(`[userSync] El usuario no tiene torneos`)
  }

  if (allTeams.length > 0) {
    console.log(`[userSync] Equipos obtenidos: ${allTeams.length}`)
    await bulkPutTeams(allTeams)
    counts.teams = allTeams.length
    const afterCount = await db.teams.count()
    console.log(`[userSync] Teams en Dexie después de bulkPut: ${afterCount}`)
    if (afterCount === 0) {
      console.warn(`[userSync] ⚠️ bulkPut no guardó nada. Primer team:`, JSON.stringify(allTeams[0]).slice(0, 300))
    }
  }

  if (allTeams.length > 0) {
    const allTeamIds = [...new Set(allTeams.map((t) => t._id))]
    const memberArrays = await Promise.all(
      allTeamIds.map((id) => fetchJSON(`/teams/${id}/members`))
    )
    const allMembers = memberArrays.flatMap((a) => a ?? [])
    const uniqueMembers = []
    const seenUserIds = new Set()
    for (const m of allMembers) {
      if (m._id && !seenUserIds.has(m._id)) {
        seenUserIds.add(m._id)
        uniqueMembers.push(m)
      }
    }
    console.log(`[userSync] Miembros obtenidos: ${uniqueMembers.length} (unicos)`)
    if (uniqueMembers.length > 0) {
      await bulkPutUsers(uniqueMembers)
      counts.members = uniqueMembers.length
    }
  } else {
    console.log(`[userSync] El usuario no tiene equipos`)
  }

  const allMatches = await fetchJSON(`/matches`)
  if (allMatches?.length && tournaments?.length) {
    const ids = new Set(tournaments.map((t) => t._id))
    const relevant = allMatches.filter(
      (m) => ids.has(m.tournamentId) && !m.isDeleted
    )
    console.log(`[userSync] Partidos totales: ${allMatches.length}, relevantes: ${relevant.length}`)
    if (relevant.length > 0) {
      await bulkPutMatches(relevant)
      counts.matches = relevant.length
    }
  } else {
    console.log(`[userSync] Partidos saltados (sin torneos del usuario)`)
  }

  console.log(`[userSync] Sync completado. Resumen:`, counts)
  return counts
}
