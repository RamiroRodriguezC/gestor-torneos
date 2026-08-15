import { db } from '../lib/db.js'
import { apiFetch } from '../utils/apiFetch.js'

export async function createTournament(data) {
  const json = await apiFetch('/tournaments', {
    method: 'POST',
    body: JSON.stringify(data),
  })
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
