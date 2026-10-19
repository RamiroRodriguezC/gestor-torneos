import { useState } from 'react'
import { Box } from '@mui/material'

function isValidHttpUrl(string) {
  if (!string || typeof string !== 'string') return false
  return string.startsWith('http://') || string.startsWith('https://') || string.startsWith('data:')
}

function CompetitorPhoto({ logoURL, displayName, size = 28 }) {
  const [imageError, setImageError] = useState(false)
  const letter = (displayName || '?')[0].toUpperCase()
  const showImage = Boolean(logoURL) && isValidHttpUrl(logoURL) && !imageError

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: '#2a2a2a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.max(size * 0.38, 10),
        fontWeight: 700,
        color: '#00e676',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {showImage ? (
        <Box
          component="img"
          src={logoURL}
          onError={() => setImageError(true)}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        letter
      )}
    </Box>
  )
}

export default CompetitorPhoto
