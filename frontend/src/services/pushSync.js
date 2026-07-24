import { getPending, markSyncing, markFailed, markDone, getActionUrl, getActionMethod } from '../data/syncQueue'

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
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      })

      if (!res.ok) {
        // Si el backend devuelve error, extraemos el mensaje y marcamos como fallido
        const body = await res.json().catch(() => ({}))
        const msg = body.error?.message || `HTTP ${res.status}`
        await markFailed(item.id, msg)
        failed++
      } else {
        // Si salió bien, eliminamos la operación de la cola
        await markDone(item.id)
        synced++
      }
    } catch (err) {
      // Error de red o timeout
      await markFailed(item.id, err.message)
      failed++
    }
  }

  return { synced, failed }
}
