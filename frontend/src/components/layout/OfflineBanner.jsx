import { useEffect, useState } from 'react'
import { Snackbar, Alert } from '@mui/material'
import CloudOffIcon from '@mui/icons-material/CloudOff'
import CloudDoneIcon from '@mui/icons-material/CloudDone'
import SyncIcon from '@mui/icons-material/Sync'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

// Barra flotante que avisa cuando perdemos o recuperamos la conexión
function OfflineBanner() {
  const { isOnline, justReconnected, pendingCount } = useOnlineStatus()
  const [showOffline, setShowOffline] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)

  // Mostramos el cartel de "sin conexión" mientras estemos offline
  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true)
    } else {
      setShowOffline(false)
    }
  }, [isOnline])

  // Mostramos el cartel de "reconectado" durante 4 segundos cuando volvemos
  useEffect(() => {
    if (justReconnected) {
      setShowReconnected(true)
      const timer = setTimeout(() => setShowReconnected(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [justReconnected])

  return (
    <>
      {/* Cartel amarillo cuando no hay conexión */}
      <Snackbar
        open={showOffline}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="warning" icon={<CloudOffIcon />} sx={{ width: '100%' }}>
          Sin conexión — los cambios se guardarán localmente
        </Alert>
      </Snackbar>

      {/* Cartel verde cuando se restablece la conexión */}
      <Snackbar
        open={showReconnected}
        autoHideDuration={4000}
        onClose={() => setShowReconnected(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" icon={pendingCount > 0 ? <SyncIcon /> : <CloudDoneIcon />} sx={{ width: '100%' }}>
          {pendingCount > 0
            ? `Conexión restablecida — sincronizando ${pendingCount} cambio(s)...`
            : 'Conexión restablecida'}
        </Alert>
      </Snackbar>
    </>
  )
}

export default OfflineBanner
