import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import { Network } from '@capacitor/network'
import { pushSync } from '../services/pushSync'
import { getPendingCount } from '../data/syncQueue'

// Contexto global que expone el estado de conexión y la cola de sincronización
export const OnlineContext = createContext({ isOnline: true, pendingCount: 0, triggerSync: () => {} })

export function OnlineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [justReconnected, setJustReconnected] = useState(false)
  const isSyncingRef = useRef(false)

  // Actualiza el contador de pendientes desde IndexedDB
  const refreshPending = useCallback(async () => {
    try {
      const count = await getPendingCount()
      setPendingCount(count)
      return count
    } catch {
      return 0
    }
  }, [])

  // Fuerza la sincronización de la cola contra el backend (evita ejecuciones simultáneas)
  const triggerSync = useCallback(async () => {
    if (isSyncingRef.current) return { synced: 0, failed: 0 }
    isSyncingRef.current = true
    try {
      const result = await pushSync()
      await refreshPending()
      return result
    } finally {
      isSyncingRef.current = false
    }
  }, [refreshPending])

  useEffect(() => {
    let isMounted = true

    const handleConnected = async () => {
      if (!isMounted) return
      setIsOnline(true)
      setJustReconnected(true)
      setTimeout(() => {
        if (isMounted) setJustReconnected(false)
      }, 4000)

      await triggerSync()
    }

    const handleDisconnected = () => {
      if (!isMounted) return
      setIsOnline(false)
    }

    // 1. Escuchar cambios de red nativos (Capacitor Network)
    let networkListener = null
    Network.addListener('networkStatusChange', (status) => {
      if (status.connected) {
        handleConnected()
      } else {
        handleDisconnected()
      }
    }).then((listener) => {
      networkListener = listener
    }).catch(() => {
      // Entorno no soportado para listener nativo
    })

    // 2. Escuchar eventos estándar del navegador (fallback para Web)
    window.addEventListener('online', handleConnected)
    window.addEventListener('offline', handleDisconnected)

    // 3. Chequeo inicial al montar la aplicación
    Network.getStatus().then(async (status) => {
      if (!isMounted) return
      const online = status.connected ?? navigator.onLine
      setIsOnline(online)
      const count = await refreshPending()
      if (online && count > 0) {
        await triggerSync()
      }
    }).catch(async () => {
      if (!isMounted) return
      const count = await refreshPending()
      if (navigator.onLine && count > 0) {
        await triggerSync()
      }
    })

    // 4. Intervalo periódico cada 10 segundos: si hay pendientes y hay conexión, sincronizar
    const interval = setInterval(async () => {
      const count = await refreshPending()
      if (count > 0 && navigator.onLine && !isSyncingRef.current) {
        await triggerSync()
      }
    }, 10000)

    return () => {
      isMounted = false
      if (networkListener && typeof networkListener.remove === 'function') {
        networkListener.remove()
      }
      window.removeEventListener('online', handleConnected)
      window.removeEventListener('offline', handleDisconnected)
      clearInterval(interval)
    }
  }, [triggerSync, refreshPending])

  return (
    <OnlineContext.Provider value={{ isOnline, pendingCount, justReconnected, triggerSync, refreshPending }}>
      {children}
    </OnlineContext.Provider>
  )
}
