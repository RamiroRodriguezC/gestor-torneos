import { useState, useEffect } from 'react'
import { Avatar } from '@mui/material'
import defaultAvatar from '../../assets/default-avatar.svg'

/**
 * Componente unificado para avatares de usuario en TourneyFy.
 * 
 * - Si el usuario tiene `url_profile_photo` (o `photoURL`) válida, muestra su foto.
 * - Si no tiene foto o si la URL falla (error 404, enlace roto), hace fallback
 *   automático al avatar SVG oficial de TourneyFy.
 * - Previene esquinas blancas garantizando clip circular y fondo oscuro.
 * 
 * @param {Object} props
 * @param {Object} [props.user] - Objeto de usuario opcional ({ url_profile_photo, photoURL, name, lastName, username })
 * @param {string} [props.src] - URL explícita de la foto
 * @param {string} [props.name] - Nombre o texto alternativo
 * @param {number|Object} [props.size=40] - Tamaño en px o responsive ({ xs: 90, sm: 120 })
 * @param {Object} [props.sx] - Estilos adicionales de MUI
 * @param {Function} [props.onClick] - Manejador de clic
 */
export default function UserAvatar({
  user,
  src,
  name,
  size = 40,
  sx = {},
  onClick,
  ...rest
}) {
  const [imageError, setImageError] = useState(false)

  // Obtener la URL de la foto desde las props o desde el objeto user
  const photoSrc = (src !== undefined ? src : (user?.url_profile_photo || user?.photoURL)) || ''

  // Resetear el estado de error si la URL cambia
  useEffect(() => {
    setImageError(false)
  }, [photoSrc])

  // Nombre para accesibilidad y title
  const displayName = name || (user ? `${user.name || ''} ${user.lastName || ''}`.trim() || user.username : 'Usuario')

  // Determinar la fuente efectiva de la imagen
  const effectiveSrc = (photoSrc.trim() && !imageError) ? photoSrc.trim() : defaultAvatar

  return (
    <Avatar
      src={effectiveSrc}
      alt={displayName}
      onClick={onClick}
      imgProps={{
        onError: () => setImageError(true),
        loading: 'lazy',
      }}
      sx={{
        width: size,
        height: size,
        bgcolor: '#121212',
        border: '1px solid rgba(0, 230, 118, 0.15)',
        cursor: onClick ? 'pointer' : 'default',
        '& img': {
          objectFit: 'cover',
          width: '100%',
          height: '100%',
        },
        ...sx,
      }}
      {...rest}
    />
  )
}
