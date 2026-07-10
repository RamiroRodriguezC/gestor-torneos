import { useNavigate } from 'react-router-dom'
import { Container, Typography, Button, Box } from '@mui/material'
import { useAuth } from '../hooks/useAuth'

function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUserId')
    navigate('/login')
  }

  return (
    <Container>
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h3">
          Hola {user?.nombre || user?.email || 'Usuario'}
        </Typography>
        <Button onClick={handleLogout} sx={{ mt: 4 }} variant="outlined">
          Cerrar sesión
        </Button>
      </Box>
    </Container>
  )
}

export default Dashboard
