import { Box } from '@mui/material'

function CompetitorPhoto({ logoURL, displayName, size = 28 }) {
  const letter = (displayName || '?')[0].toUpperCase()

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
      {logoURL ? (
        <Box
          component="img"
          src={logoURL}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        letter
      )}
    </Box>
  )
}

export default CompetitorPhoto
