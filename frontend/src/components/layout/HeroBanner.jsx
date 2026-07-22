import { keyframes } from '@emotion/react'
import { Box, Typography } from '@mui/material'

const oscillate = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`

function HeroBanner() {
  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #002200 20%, #006633 40%, #00e676 60%, #006633 80%, #002200 95%, #0a0a0a 100%)',
        backgroundSize: '400% 400%',
        animation: `${oscillate} 10s ease infinite`,
      }}
    >
      <Box sx={{ textAlign: 'center', px: 3 }}>
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '3rem', sm: '4.5rem', md: '6rem' },
            color: '#fff',
            textShadow: '0 0 40px rgba(0, 230, 118, 0.3), 0 0 80px rgba(0, 230, 118, 0.1)',
            mb: 2,
          }}
        >
          TourneyFy
        </Typography>
        <Typography
          variant="h5"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontWeight: 300,
            letterSpacing: 2,
            fontSize: { xs: '1rem', sm: '1.25rem', md: '1.75rem' },
          }}
        >
          Gestión de torneos inteligente
        </Typography>
      </Box>
    </Box>
  )
}

export default HeroBanner
