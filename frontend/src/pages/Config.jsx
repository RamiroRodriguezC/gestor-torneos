import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container, Typography, Box, Paper, Button, Stack,
  Avatar, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'
import Navbar from '../components/layout/Navbar'
import { useAuth } from '../hooks/useAuth'
import { logout } from '../data/auth'

function Config() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4, pb: 8 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
          <SettingsIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={700}>
            Configuración
          </Typography>
        </Stack>

        <Stack spacing={3}>
          {/* Card de Cuenta y Usuario */}
          {user && (
            <Paper elevation={0} sx={{ p: 3, bgcolor: '#1a1a1a', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <Typography variant="subtitle2" color="grey.500" sx={{ mb: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Mi Cuenta
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ gap: 2 }}>
                <Avatar
                  src={user.url_profile_photo || ''}
                  sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 700 }}
                >
                  {user.name?.[0]}{user.lastName?.[0]}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={700}>
                    {user.name} {user.lastName}
                  </Typography>
                  <Typography variant="body2" color="grey.400">
                    {user.email}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PersonIcon />}
                  onClick={() => navigate('/profile')}
                >
                  Ver Perfil
                </Button>
              </Stack>
            </Paper>
          )}

          {/* Card de Sesión / Salir */}
          <Paper elevation={0} sx={{ p: 3, bgcolor: '#1a1a1a', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <Typography variant="subtitle2" color="grey.500" sx={{ mb: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Sesión
            </Typography>
            <Typography variant="body2" color="grey.400" sx={{ mb: 2.5 }}>
              Si cerrás sesión vas a necesitar ingresar tu email y contraseña nuevamente para acceder a tu cuenta.
            </Typography>
            <Button
              variant="contained"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={() => setConfirmOpen(true)}
              sx={{ fontWeight: 600 }}
            >
              Cerrar sesión
            </Button>
          </Paper>
        </Stack>
      </Container>

      {/* Modal de confirmación de cierre de sesión */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Cerrar sesión</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que querés cerrar sesión en TourneyFy?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Config
