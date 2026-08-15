import { db } from '../lib/db.js'
import { enqueue } from './syncQueue.js'
import { apiFetch } from '../utils/apiFetch.js'

export async function getMatchById(id) {
  return db.matches.get(id)
}

export async function getMatchesByTournament(tournamentId) {
  return db.matches
    .where('tournamentId')
    .equals(tournamentId)
    .filter((m) => !m.isDeleted)
    .toArray()
}

export async function getMatchesByTournamentAndRound(tournamentId, roundId) {
  return db.matches
    .where('[tournamentId+round.roundId]')
    .equals([tournamentId, roundId])
    .filter((m) => !m.isDeleted)
    .toArray()
}

export async function getMatchesByStatus(status) {
  return db.matches
    .where('status')
    .equals(status)
    .filter((m) => !m.isDeleted)
    .toArray()
}

export async function getRecentMatches(limit = 20) {
  return db.matches
    .where('isDeleted')
    .equals(false)
    .reverse()
    .sortBy('updatedAt')
    .then((rows) => rows.slice(0, limit))
}

export async function getOfflineMatches() {
  return db.matches
    .where('isOffline')
    .equals(true)
    .toArray()
}

export async function putMatch(match) {
  return db.matches.put({
    ...match,
    updatedAt: new Date().toISOString(),
  })
}

export async function bulkPutMatches(matches) {
  const now = new Date().toISOString()
  return db.matches.bulkPut(
    matches.map((m) => ({ ...m, updatedAt: now }))
  )
}

export async function removeMatch(id) {
  return db.matches.delete(id)
}

// Guarda la planilla de un partido (resultado, eventos, etc)
// Si hay conexión: actualiza Dexie + envía al backend y actualiza Dexie con la respuesta
// Si no hay conexión: actualiza Dexie + encola para enviar después
export async function updateMatchSheet(id, data) {
  // 1. Siempre escribimos primero en IndexedDB (actualización local optimista)
  await putMatch(data)

  // 2. Si estamos online, mandamos directo al backend
  if (navigator.onLine) {
    const json = await apiFetch(`/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    // Actualizamos Dexie con la respuesta del backend (tiene los campos completos)
    await putMatch(json.data)
    return json.data
  }

  // 3. Si estamos offline, encolamos para sincronizar después
  await enqueue({
    action: 'UPDATE_MATCH',
    entity: 'matches',
    entityId: id,
    payload: data,
  })
  return data
}
