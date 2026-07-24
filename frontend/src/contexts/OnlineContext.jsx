import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import { pushSync } from '../services/pushSync'
import { getPendingCount } from '../data/syncQueue'

// Contexto global que expone el estado de conexión y la cola de sincronización
export const OnlineContext = createContext({ isOnline: true, pendingCount: 0, triggerSync: () => {} })

export function OnlineProvider({ children }) {
  // Arranca con el estado real del navegador
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  // Cantidad de operaciones pendientes en la cola
  const [pendingCount, setPendingCount] = useState(0)
  // Flag para mostrar el cartel de "reconectado" durante unos segundos
  const [justReconnected, setJustReconnected] = useState(false)
  const previousOnline = useRef(navigator.onLine)

  // Actualiza el contador de pendientes desde IndexedDB
  const refreshPending = useCallback(async () => {
    const count = await getPendingCount()
    setPendingCount(count)
  }, [])

  // Fuerza la sincronización de la cola contra el backend
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine) return { synced: 0, failed: 0 }
    const result = await pushSync()
    await refreshPending()
    return result
  }, [refreshPending])

  useEffect(() => {
    // Cuando volvemos a estar online: actualizamos estado, mostramos aviso y sincronizamos
    const handleOnline = async () => {
      setIsOnline(true)
      setJustReconnected(true)
      setTimeout(() => setJustReconnected(false), 4000)
      await triggerSync()
    }

    // Cuando perdemos conexión: solo actualizamos el estado
    const handleOffline = () => {
      setIsOnline(false)
      previousOnline.current = false
    }

    // Nos suscribimos a los eventos nativos del navegador
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cargamos el contador inicial de pendientes
    refreshPending()

    // Actualizamos el contador cada 10 segundos por si cambia desde otro lado
    const interval = setInterval(refreshPending, 10000)

    // Limpiamos todo al desmontar
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [triggerSync, refreshPending])

  return (
    <OnlineContext.Provider value={{ isOnline, pendingCount, justReconnected, triggerSync, refreshPending }}>
      {children}
    </OnlineContext.Provider>
  )
}
