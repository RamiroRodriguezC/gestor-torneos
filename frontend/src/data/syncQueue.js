import { db } from '../lib/db.js'
import { getApiBaseUrl } from '../utils/env.js'

const API = getApiBaseUrl()

// Agrega una operación a la cola de sincronización
// Se llama cuando estamos offline y queremos guardar un cambio para enviarlo después
export async function enqueue({ action, entity, entityId, payload }) {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const item = { id, action, entity, entityId, payload, createdAt: now, status: 'PENDING' }
  await db.sync_queue.put(item)
  return item
}

// Devuelve todas las operaciones pendientes ordenadas por fecha (las más viejas primero)
export async function getPending() {
  return db.sync_queue
    .where('status')
    .equals('PENDING')
    .sortBy('createdAt')
}

// Devuelve las operaciones que fallaron, para reintento manual
export async function getFailed() {
  return db.sync_queue
    .where('status')
    .equals('FAILED')
    .sortBy('createdAt')
}

// Cuenta cuántas operaciones están esperando ser sincronizadas
export async function getPendingCount() {
  return db.sync_queue
    .where('status')
    .equals('PENDING')
    .count()
}

// Marca una operación como "en proceso de sincronización"
export async function markSyncing(id) {
  return db.sync_queue.update(id, { status: 'SYNCING' })
}

// Marca una operación como fallida y guarda el mensaje de error
export async function markFailed(id, errorMessage) {
  return db.sync_queue.update(id, { status: 'FAILED', error: errorMessage })
}

// Elimina la operación de la cola porque ya se sincronizó correctamente
export async function markDone(id) {
  return db.sync_queue.delete(id)
}

// Devuelve la URL del endpoint según la acción y el ID de la entidad
export function getActionUrl(action, entityId) {
  switch (action) {
    case 'UPDATE_MATCH':
      return `${API}/matches/${entityId}`
    case 'CREATE_MATCH':
      return `${API}/matches`
    case 'UPDATE_TOURNAMENT':
      return `${API}/tournaments/${entityId}`
    case 'CREATE_TOURNAMENT':
      return `${API}/tournaments`
    default:
      return null
  }
}

// Devuelve el método HTTP según la acción
export function getActionMethod(action) {
  switch (action) {
    case 'UPDATE_MATCH':
    case 'UPDATE_TOURNAMENT':
      return 'PUT'
    case 'CREATE_MATCH':
    case 'CREATE_TOURNAMENT':
      return 'POST'
    default:
      return 'POST'
  }
}
