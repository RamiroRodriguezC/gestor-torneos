import { db } from '../lib/db.js'
import { apiFetch } from '../utils/apiFetch.js'

export async function createTournament(data) {
  const json = await apiFetch('/tournaments', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return json.data
}

// Trae el catálogo público (PUBLICADO) y lo cachea en Dexie. El endpoint es público.
export async function fetchPublicTournaments() {
  const json = await apiFetch('/tournaments?status=PUBLICADO')
  const list = json.data || []
  if (list.length) await bulkPutTournaments(list)
  return list
}

// Refresca el detalle de un torneo desde el server y actualiza la copia local.
export async function fetchTournament(id) {
  const json = await apiFetch(`/tournaments/${id}`)
  if (json.data) await putTournament(json.data)
  return json.data
}

// Publica (BORRADOR → PUBLICADO) o despublica (→ BORRADOR) un torneo.
// Acción de organizador: exige estar online (el PATCH no se encola offline).
export async function publishTournament(id, status) {
  if (!navigator.onLine) {
    throw new Error('Necesitás conexión para publicar el torneo.')
  }
  const json = await apiFetch(`/tournaments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  if (json.data) await putTournament(json.data)
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
