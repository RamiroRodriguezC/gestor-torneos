import { db } from '../lib/db.js'
import { apiFetch } from '../utils/apiFetch.js'

export async function getFieldById(id) {
  return db.fields.get(id)
}

export async function getFieldsByTournament(tournamentId) {
  return db.fields
    .where('tournamentId')
    .equals(tournamentId)
    .filter((f) => !f.isDeleted)
    .toArray()
}

export async function putField(field) {
  return db.fields.put(field)
}

export async function bulkPutFields(fields) {
  if (!fields || !fields.length) return
  return db.fields.bulkPut(fields)
}

export async function removeField(id) {
  return db.fields.delete(id)
}

/**
 * Consulta las canchas del torneo al backend y las persiste en Dexie.
 */
export async function fetchTournamentFields(tournamentId) {
  if (!tournamentId) return []
  const json = await apiFetch(`/tournaments/${tournamentId}/fields`)
  const fields = json.data || []
  if (fields.length > 0) {
    const toSave = fields.map((f) => ({
      ...f,
      tournamentId: f.tournamentId || tournamentId,
    }))
    await bulkPutFields(toSave)
  }
  return fields
}

/**
 * Crea una cancha asociada al torneo.
 */
export async function createTournamentField(tournamentId, fieldData) {
  if (!tournamentId) throw new Error('tournamentId es requerido')
  const json = await apiFetch(`/tournaments/${tournamentId}/fields`, {
    method: 'POST',
    body: JSON.stringify(fieldData),
  })
  const created = json.data
  if (created) {
    await putField(created)
  }
  return created
}

/**
 * Modifica una cancha existente del torneo.
 */
export async function updateTournamentField(tournamentId, fieldId, fieldData) {
  if (!tournamentId || !fieldId) throw new Error('tournamentId y fieldId son requeridos')
  const json = await apiFetch(`/tournaments/${tournamentId}/fields/${fieldId}`, {
    method: 'PUT',
    body: JSON.stringify(fieldData),
  })
  const updated = json.data
  if (updated) {
    await putField(updated)
  }
  return updated
}

/**
 * Elimina lógicamente una cancha del torneo.
 */
export async function deleteTournamentField(tournamentId, fieldId) {
  if (!tournamentId || !fieldId) throw new Error('tournamentId y fieldId son requeridos')
  const json = await apiFetch(`/tournaments/${tournamentId}/fields/${fieldId}`, {
    method: 'DELETE',
  })
  await removeField(fieldId)
  return json
}
