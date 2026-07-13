import { useNavigate, useLocation } from 'react-router-dom'
import { useMediaQuery, useTheme } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import AppLogo from './AppLogo'
import { dashboardNavItems } from '../config/navigation'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const activeIndex = dashboardNavItems.findIndex((item) =>
    location.pathname.startsWith(item.path)
  )

  if (isMobile) {
    return (
      <>
        <BottomNavigation
          value={activeIndex !== -1 ? activeIndex : 0}
          onChange={(_, newIndex) =>
            navigate(dashboardNavItems[newIndex].path)
          }
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            bgcolor: '#0a0a0a',
            borderTop: '1px solid',
            borderColor: 'divider',
            '& .MuiBottomNavigationAction-root': {
              color: 'grey.600',
            },
            '& .Mui-selected': {
              color: '#00e676 !important',
            },
          }}
        >
          {dashboardNavItems.map((item) => (
            <BottomNavigationAction
              key={item.path}
              icon={<item.icon />}
              label={item.label}
            />
          ))}
        </BottomNavigation>

        <Box sx={{ height: 56 }} />
      </>
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
        <Box sx={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          <AppLogo />
        </Box>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            ml: 'auto',
            alignItems: 'center',
          }}
        >
          {dashboardNavItems.map((item) => (
            <Button
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                color: location.pathname.startsWith(item.path)
                  ? '#00e676'
                  : 'grey.400',
                fontWeight: location.pathname.startsWith(item.path) ? 600 : 400,
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': { color: '#00e676' },
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
