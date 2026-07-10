import { useNavigate } from 'react-router-dom'
import { AppBar, Toolbar, Button, Box } from '@mui/material'
import AppLogo from './AppLogo'

function Navbar() {
  const navigate = useNavigate()

  return (
    <AppBar position="sticky" sx={{ bgcolor: '#0a0a0a', boxShadow: '0 2px 20px rgba(0, 230, 118, 0.15)' }}>
      <Toolbar>
        <Box sx={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <AppLogo />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" color="primary" sx={{ px: 3 }} onClick={() => navigate('/login')}>
            Login
          </Button>
          <Button variant="contained" color="primary" sx={{ px: 3 }}>
            Registrarse
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
