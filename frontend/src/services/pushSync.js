import { getPending, markSyncing, markPending, markFailed, markDone, getActionUrl, getActionMethod } from '../data/syncQueue'
import { apiFetch } from '../utils/apiFetch.js'
import { putMatch } from '../data/matches.js'

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
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(item.payload),
      })
      // Si salió bien, eliminamos la operación de la cola
      await markDone(item.id)
      synced++

      // Actualizar la entidad en Dexie con los datos oficiales del backend
      if (item.action === 'UPDATE_MATCH' && res?.data) {
        await putMatch(res.data)
        const tournamentId = res.data.tournamentId || item.tournamentId
        if (tournamentId) {
          try {
            const { fetchTournament } = await import('../data/tournaments.js')
            await fetchTournament(tournamentId)
          } catch (tErr) {
            console.warn('No se pudo refrescar el torneo en pushSync:', tErr)
          }
        }
      } else if (item.action === 'UPDATE_APPLICATION' && res?.data) {
        const { putApplication } = await import('../data/applications.js')
        await putApplication(res.data)
      }
    } catch (err) {
      // Error de red, timeout o rechazo del backend
      const isNetworkError =
        !navigator.onLine ||
        err.name === 'TypeError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('net::ERR') ||
        err.message?.toLowerCase?.()?.includes('network')

      if (isNetworkError) {
        // En caso de fallo de red transitorio, vuelve a PENDING para reintento automático
        await markPending(item.id)
      } else {
        // Error definitivo de validación o rechazo del servidor
        await markFailed(item.id, err.message)
      }
      failed++
    }
  }

  return { synced, failed }
}
