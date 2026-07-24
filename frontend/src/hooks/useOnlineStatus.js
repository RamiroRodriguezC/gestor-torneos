import { useContext } from 'react'
import { OnlineContext } from '../contexts/OnlineContext'

// Hook para consumir el estado de conexión desde cualquier componente
export function useOnlineStatus() {
  return useContext(OnlineContext)
}
