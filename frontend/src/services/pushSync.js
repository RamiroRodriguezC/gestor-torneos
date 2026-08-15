import { getPending, markSyncing, markFailed, markDone, getActionUrl, getActionMethod } from '../data/syncQueue'
import { apiFetch } from '../utils/apiFetch.js'

// Procesa toda la cola de sincronización: toma los PENDING y los envía al backend
export async function pushSync() {
  const pending = await getPending()
  if (pending.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0

  // Recorremos en orden FIFO (las más viejas primero)
  for (const item of pending) {
    const url = getActionUrl(item.action, item.entityId)
    const method = getActionMethod(item.action)

    // Si la acción no está reconocida, la marcamos como fallida y seguimos
    if (!url) {
      await markFailed(item.id, `Acción desconocida: ${item.action}`)
      failed++
      continue
    }

    // Marcamos como "sincronizando" antes de enviar
    await markSyncing(item.id)

    try {
      await apiFetch(url, {
        method,
        body: JSON.stringify(item.payload),
      })
      // Si salió bien, eliminamos la operación de la cola
      await markDone(item.id)
      synced++
    } catch (err) {
      // Error de red, timeout o rechazo del backend
      await markFailed(item.id, err.message)
      failed++
    }
  }

  return { synced, failed }
}
