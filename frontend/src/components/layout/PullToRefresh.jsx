import { useState, useEffect, useRef } from 'react'
import { Box, CircularProgress } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

const THRESHOLD = 52 // Píxeles necesarios para activar el refresco
const MAX_PULL = 75   // Máximo desplazamiento visual permitido

/**
 * Componente que envuelve la aplicación o sus vistas principales para proveer
 * el gesto nativo "Pull to Refresh" en dispositivos táctiles (Capacitor y navegadores móviles).
 * 
 * - Solo se activa cuando el scroll vertical está en el tope superior (window.scrollY <= 0).
 * - Aplica una curva de resistencia física elástica.
 * - Respeta el Safe Area superior (notch / status bar).
 * - Invoca refreshEnvironment() para vaciar la cola offline y sincronizar datos frescos desde la API.
 */
export default function PullToRefresh({ children }) {
  const { refreshEnvironment } = useOnlineStatus()
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const isPullingRef = useRef(false)
  const startYRef = useRef(0)
  const startXRef = useRef(0)
  const pullDistanceRef = useRef(0)
  const isRefreshingRef = useRef(false)

  // Mantener actualizado el ref de isRefreshing
  useEffect(() => {
    isRefreshingRef.current = isRefreshing
  }, [isRefreshing])

  useEffect(() => {
    const handleTouchStart = (e) => {
      // Solo iniciar si estamos en la parte superior absoluta de la página
      // y no hay otro refresco en progreso
      if (window.scrollY <= 0 && e.touches.length === 1 && !isRefreshingRef.current) {
        isPullingRef.current = true
        startYRef.current = e.touches[0].clientY
        startXRef.current = e.touches[0].clientX
        pullDistanceRef.current = 0
      }
    }

    const handleTouchMove = (e) => {
      if (!isPullingRef.current || isRefreshingRef.current) return

      const currentY = e.touches[0].clientY
      const currentX = e.touches[0].clientX
      const deltaY = currentY - startYRef.current
      const deltaX = currentX - startXRef.current

      // Si el desplazamiento horizontal predomina al inicio, cancelar el pull
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaY < 20) {
        isPullingRef.current = false
        pullDistanceRef.current = 0
        setPullDistance(0)
        return
      }

      // Si se arrastra hacia abajo y la ventana está arriba
      if (deltaY > 0 && window.scrollY <= 0) {
        // Resistencia elástica: deltaY * 0.45 amortigua el tirón
        const distance = Math.min(MAX_PULL, deltaY * 0.45)
        pullDistanceRef.current = distance
        setPullDistance(distance)

        // Prevenir el rebote nativo del WebView si cancelable
        if (distance > 5 && e.cancelable) {
          e.preventDefault()
        }
      } else {
        pullDistanceRef.current = 0
        setPullDistance(0)
      }
    }

    const handleTouchEnd = async () => {
      if (!isPullingRef.current) return
      isPullingRef.current = false

      if (pullDistanceRef.current >= THRESHOLD && !isRefreshingRef.current) {
        isRefreshingRef.current = true
        setIsRefreshing(true)
        setPullDistance(THRESHOLD)

        const startTime = Date.now()
        try {
          if (refreshEnvironment) {
            await refreshEnvironment()
          }
        } catch (err) {
          console.warn('Error durante pull-to-refresh:', err)
        } finally {
          // Garantizar al menos 600ms de animación para feedback táctil agradable
          const elapsed = Date.now() - startTime
          if (elapsed < 600) {
            await new Promise((resolve) => setTimeout(resolve, 600 - elapsed))
          }
          setIsRefreshing(false)
          isRefreshingRef.current = false
          pullDistanceRef.current = 0
          setPullDistance(0)
        }
      } else {
        pullDistanceRef.current = 0
        setPullDistance(0)
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [refreshEnvironment])

  return (
    <>
      {/* Indicador flotante centrado arriba con soporte de Safe Area */}
      <Box
        sx={{
          position: 'fixed',
          left: '50%',
          top: 'calc(var(--safe-area-inset-top, env(safe-area-inset-top, 0px)) + 12px)',
          transform: `translateX(-50%) translateY(${
            isRefreshing ? '28px' : (pullDistance > 0 ? `${pullDistance * 0.8}px` : '-70px')
          })`,
          opacity: isRefreshing ? 1 : Math.min(1, Math.max(0, (pullDistance - 10) / 30)),
          transition: isPullingRef.current
            ? 'opacity 0.1s ease-out'
            : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.25s ease-out',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            bgcolor: '#1a1a1a',
            border: '1.5px solid #00e676',
            boxShadow: '0 4px 16px rgba(0, 230, 118, 0.3), 0 2px 6px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}
        >
          {isRefreshing ? (
            <CircularProgress size={22} thickness={4.5} sx={{ color: '#00e676' }} />
          ) : (
            <RefreshIcon
              sx={{
                color: pullDistance >= THRESHOLD ? '#00e676' : 'rgba(255, 255, 255, 0.7)',
                fontSize: 24,
                transform: `rotate(${Math.min(360, (pullDistance / THRESHOLD) * 270)}deg)`,
                transition: 'color 0.2s, transform 0.1s linear',
              }}
            />
          )}
        </Box>
      </Box>

      {/* Contenido de la aplicación */}
      {children}
    </>
  )
}
