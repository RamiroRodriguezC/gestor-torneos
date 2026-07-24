import { db } from '../lib/db.js'
import { getApiBaseUrl } from '../utils/env.js'

const API = getApiBaseUrl()

export async function createTournament(data) {
  const res = await fetch(`${API}/tournaments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message || 'Error al crear el torneo')
  return json.data
}

export async function getTournamentById(id) {
  return db.tournaments.get(id)
}

export async function getActiveTournaments() {
  return db.tournaments
    .where('[status+isDeleted]')
    .equals(['PUBLICADO', false])
    .toArray()
}

export async function getTournamentsByStatus(status) {
  return db.tournaments
    .where('[status+isDeleted]')
    .equals([status, false])
    .toArray()
}

export async function getTournamentsByOrganizer(userId) {
  return db.tournaments
    .where('organizerId')
    .equals(userId)
    .filter((t) => !t.isDeleted)
    .toArray()
}

export async function getTournamentsBySport(sportConfigId) {
  return db.tournaments
    .where('sportConfigId')
    .equals(sportConfigId)
    .filter((t) => !t.isDeleted)
    .toArray()
}

export async function getAllTournaments() {
  return db.tournaments.where('isDeleted').equals(false).toArray()
}

export async function putTournament(tournament) {
  return db.tournaments.put(tournament)
}

export async function bulkPutTournaments(tournaments) {
  return db.tournaments.bulkPut(tournaments)
}

export async function removeTournament(id) {
  return db.tournaments.delete(id)
}
