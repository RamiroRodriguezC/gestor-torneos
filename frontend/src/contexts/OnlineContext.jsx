import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import { Network } from '@capacitor/network'
import { pushSync } from '../services/pushSync'
import { getPendingCount } from '../data/syncQueue'
import { syncCurrentEnvironment } from '../data/userSync'

// Contexto global que expone el estado de conexión, la cola de sincronización y el refresco de entorno
export const OnlineContext = createContext({
  isOnline: true,
  pendingCount: 0,
  triggerSync: () => {},
  refreshEnvironment: () => {},
})

export function OnlineProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [justReconnected, setJustReconnected] = useState(false)
  const isSyncingRef = useRef(false)
  const lastFocusSyncRef = useRef(0)

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

  // Refresca completamente el entorno: primero vacía cambios pendientes y luego descarga del backend
  const refreshEnvironment = useCallback(async () => {
    if (!navigator.onLine) return null
    try {
      await triggerSync()
      const res = await syncCurrentEnvironment()
      return res
    } catch (err) {
      console.warn('Error en refreshEnvironment:', err)
      return null
    }
  }, [triggerSync])

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
      await syncCurrentEnvironment()
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

    // 3. Chequeo inicial al montar la aplicación (F5 / Apertura de App)
    Network.getStatus().then(async (status) => {
      if (!isMounted) return
      const online = status.connected ?? navigator.onLine
      setIsOnline(online)
      const count = await refreshPending()
      if (online) {
        if (count > 0) {
          await triggerSync()
        }
        // Descarga de fondo con datos frescos sin bloquear el render instantáneo de Dexie
        await syncCurrentEnvironment()
      }
    }).catch(async () => {
      if (!isMounted) return
      const count = await refreshPending()
      if (navigator.onLine) {
        if (count > 0) {
          await triggerSync()
        }
        await syncCurrentEnvironment()
      }
    })

    // 4. Refresco al volver a primer plano (cambio de app en móvil o cambio de pestaña en navegador)
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        const now = Date.now()
        // Limitar a máximo 1 consulta cada 15 segundos para evitar sobrecarga si el usuario alterna rápido
        if (now - lastFocusSyncRef.current > 15000) {
          lastFocusSyncRef.current = now
          refreshEnvironment()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    window.addEventListener('focus', handleVisibilityOrFocus)

    // 5. Intervalo periódico cada 10 segundos: si hay operaciones pendientes y hay conexión, sincronizar
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
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      window.removeEventListener('focus', handleVisibilityOrFocus)
      clearInterval(interval)
    }
  }, [triggerSync, refreshPending, refreshEnvironment])

  return (
    <OnlineContext.Provider value={{ isOnline, pendingCount, justReconnected, triggerSync, refreshPending, refreshEnvironment }}>
      {children}
    </OnlineContext.Provider>
  )
}
