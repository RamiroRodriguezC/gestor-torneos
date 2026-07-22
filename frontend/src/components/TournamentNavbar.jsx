import { useNavigate } from 'react-router-dom'
import { useMediaQuery, useTheme } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const tournamentSections = [
  { label: 'General', value: 'general' },
]

function TournamentNavbar({ activeSection, onSectionChange }) {
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  if (isMobile) {
    return (
      <AppBar
        position="sticky"
        sx={{
          bgcolor: '#0a0a0a',
          boxShadow: '0 2px 20px rgba(0, 230, 118, 0.15)',
        }}
      >
        <Toolbar>
          <IconButton
            onClick={() => navigate('/dashboard')}
            sx={{ color: 'grey.400', mr: 0.5 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="body2"
            sx={{ color: 'grey.400', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            Volver al dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto', alignItems: 'center' }}>
            {tournamentSections.map((section) => (
              <Button
                key={section.value}
                onClick={() => onSectionChange(section.value)}
                sx={{
                  color: activeSection === section.value ? '#00e676' : 'grey.400',
                  fontWeight: activeSection === section.value ? 600 : 400,
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  '&:hover': { color: '#00e676' },
                }}
              >
                {section.label}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
    )
  }

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: '#0a0a0a',
        boxShadow: '0 2px 20px rgba(0, 230, 118, 0.15)',
      }}
    >
      <Toolbar>
        <IconButton
          onClick={() => navigate('/dashboard')}
          sx={{ color: 'grey.400', mr: 0.5 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="body2"
          sx={{ color: 'grey.400', mr: 2, cursor: 'pointer' }}
          onClick={() => navigate('/dashboard')}
        >
          Volver al dashboard
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            ml: 'auto',
            alignItems: 'center',
          }}
        >
          {tournamentSections.map((section) => (
            <Button
              key={section.value}
              onClick={() => onSectionChange(section.value)}
              sx={{
                color: activeSection === section.value ? '#00e676' : 'grey.400',
                fontWeight: activeSection === section.value ? 600 : 400,
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': { color: '#00e676' },
              }}
            >
              {section.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default TournamentNavbar
