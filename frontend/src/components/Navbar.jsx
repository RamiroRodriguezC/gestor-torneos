import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'

function Navbar() {
  return (
    <AppBar position="sticky" sx={{ bgcolor: '#0a0a0a', boxShadow: '0 2px 20px rgba(0, 230, 118, 0.15)' }}>
      <Toolbar>
        <Typography
          variant="h5"
          sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: 1, color: '#00e676' }}
        >
          TourneyFy
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" color="primary" sx={{ px: 3 }}>
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
