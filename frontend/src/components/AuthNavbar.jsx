import { useNavigate } from 'react-router-dom'
import { AppBar, Toolbar, Button, Box } from '@mui/material'
import AppLogo from './AppLogo'
import { useAuth } from '../hooks/useAuth'
import { authNavItems, authNavItemsLoggedIn } from '../config/navigation'

function AuthNavbar() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('currentUserId')
    navigate('/login')
  }

  const items = isLoggedIn ? authNavItemsLoggedIn : authNavItems

  return (
    <AppBar position="sticky" sx={{ bgcolor: '#0a0a0a', boxShadow: '0 2px 20px rgba(0, 230, 118, 0.15)' }}>
      <Toolbar>
        <Box sx={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <AppLogo />
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, ml : 'auto' }}>
          {items.map((item) => (
            <Button
              key={item.label}
              variant={item.variant}
              color="primary"
              sx={{ px: 3 }}
              onClick={() => (item.action === 'logout' ? handleLogout() : navigate(item.path))}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default AuthNavbar
