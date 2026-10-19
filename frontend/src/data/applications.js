import { db } from '../lib/db.js'
import { enqueue } from './syncQueue.js'
import { apiFetch } from '../utils/apiFetch.js'
import { getCurrentUserId } from './auth.js'

export async function getApplicationById(id) {
  return db.applications.get(id)
}

export async function getApplicationsByTournament(tournamentId) {
  return db.applications
    .where('tournamentId')
    .equals(tournamentId)
    .toArray()
}

export async function getApplicationsByApplicant(userId) {
  return db.applications
    .where('applicantId')
    .equals(userId)
    .toArray()
}

export async function getApplicationsByParticipant(participantId) {
  return db.applications
    .where('participantId')
    .equals(participantId)
    .toArray()
}

export async function getApplicationsByStatus(status) {
  return db.applications
    .where('status')
    .equals(status)
    .toArray()
}

export async function putApplication(application) {
  return db.applications.put(application)
}

export async function bulkPutApplications(applications) {
  return db.applications.bulkPut(applications)
}

export async function removeApplication(id) {
  return db.applications.delete(id)
}

// ---------------------------------------------------------------------------
// Escrituras (offline-first, patrón data/matches.js#updateMatchSheet):
// 1. IndexedDB primero (optimista), 2. si hay red → API y reconciliar con la
// respuesta, 3. si no hay red → encolar para sincronizar después.
// ---------------------------------------------------------------------------

function buildCreatePayload({ tournamentId, participantId, notesCapitan, comprobantURL }) {
  const payload = { tournamentId, participantId }
  if (notesCapitan !== undefined) payload.notesCapitan = notesCapitan
  if (comprobantURL !== undefined) payload.comprobantURL = comprobantURL
  return payload
}

// Crea una solicitud de inscripción. En el backend el applicantId sale del token.
export async function createApplication({ tournamentId, participantId, notesCapitan, comprobantURL }) {
  const payload = buildCreatePayload({ tournamentId, participantId, notesCapitan, comprobantURL })
  const applicantId = getCurrentUserId()

  // Optimista local con _id provisorio (lo reemplaza la respuesta del server).
  const localId = crypto.randomUUID()
  const localApp = {
    _id: localId,
    tournamentId,
    applicantId,
    participantId,
    status: 'PENDIENTE',
    notesCapitan: payload.notesCapitan || '',
    comprobantURL: payload.comprobantURL || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _local: true,
  }
  await putApplication(localApp)

  if (navigator.onLine) {
    const json = await apiFetch('/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    // Reconciliar: el server devuelve el documento real (con _id y timestamps).
    await removeApplication(localId)
    await putApplication(json.data)
    return json.data
  }

  await enqueue({
    action: 'CREATE_APPLICATION',
    entity: 'applications',
    entityId: null,
    payload,
  })
  return localApp
}

// Cambia el estado de una solicitud (APROBADA / RECHAZADA / PENDIENTE) o edita
// notas. Quién puede hacer cada cosa lo valida el backend con el token.
export async function updateApplication(id, data) {
  const current = await getApplicationById(id)
  const optimistic = { ...(current || {}), ...data, _id: id, updatedAt: new Date().toISOString() }
  await putApplication(optimistic)

  if (navigator.onLine) {
    const json = await apiFetch(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    await putApplication(json.data)
    return json.data
  }

  await enqueue({
    action: 'UPDATE_APPLICATION',
    entity: 'applications',
    entityId: id,
    payload: data,
  })
  return optimistic
}
