import { useNavigate, useLocation } from 'react-router-dom'
import { useMediaQuery, useTheme } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import BottomNavigation from '@mui/material/BottomNavigation'
import BottomNavigationAction from '@mui/material/BottomNavigationAction'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AppLogo from './AppLogo'
import { dashboardNavItems } from '../../config/navigation'

function Navbar({
  items = dashboardNavItems,
  backTo,
  activeItem,
  onItemClick,
  onAction,
  mobileVariant,
  logoTo,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const hasBottomNav = mobileVariant === 'bottom' && isMobile

  const handleItemClick = (item) => {
    if (item.type === 'action') {
      onAction?.(item.action)
      return
    }
    if (onItemClick) {
      onItemClick(item.value ?? item.path)
    } else if (item.path) {
      navigate(item.path)
    }
  }

  const isActive = (item) => {
    if (activeItem !== undefined && activeItem !== null) {
      return activeItem === (item.value ?? item.path)
    }
    if (item.path) return location.pathname.startsWith(item.path)
    return false
  }

  const activeIndex = items.findIndex(isActive)

  if (hasBottomNav) {
    return (
      <>
        {backTo && (
          <AppBar position="sticky" sx={{ bgcolor: '#0a0a0a', boxShadow: '0 2px 20px rgba(0, 230, 118, 0.15)' }}>
            <Toolbar>
              <IconButton onClick={() => navigate(backTo)} sx={{ color: 'grey.400', mr: 0.5 }}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="body2" sx={{ color: 'grey.400', cursor: 'pointer' }} onClick={() => navigate(backTo)}>
                Volver
              </Typography>
            </Toolbar>
          </AppBar>
        )}
        <BottomNavigation
          value={activeIndex !== -1 ? activeIndex : 0}
          onChange={(_, newIndex) => handleItemClick(items[newIndex])}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            bgcolor: '#0a0a0a',
            borderTop: '1px solid',
            borderColor: 'divider',
            '& .MuiBottomNavigationAction-root': { color: 'grey.600' },
            '& .Mui-selected': { color: '#00e676 !important' },
          }}
        >
          {items.map((item) => (
            <BottomNavigationAction
              key={item.value ?? item.path ?? item.label}
              icon={item.icon ? <item.icon /> : undefined}
              label={item.label}
            />
          ))}
        </BottomNavigation>
        <Box sx={{ height: 56 }} />
      </>
    )
  }

  return (
    <AppBar position="sticky" sx={{ bgcolor: '#0a0a0a', boxShadow: '0 2px 20px rgba(0, 230, 118, 0.15)' }}>
      <Toolbar>
        {backTo ? (
          <>
            <IconButton onClick={() => navigate(backTo)} sx={{ color: 'grey.400', mr: 0.5 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="body2" sx={{ color: 'grey.400', mr: 2, cursor: 'pointer' }} onClick={() => navigate(backTo)}>
              Volver
            </Typography>
          </>
        ) : (
          <Box sx={{ cursor: 'pointer' }} onClick={() => navigate(logoTo ?? '/')}>
            <AppLogo />
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1, ml: 'auto', alignItems: 'center' }}>
          {items.map((item) => (
            <Button
              key={item.value ?? item.path ?? item.label}
              variant={item.variant}
              color="primary"
              onClick={() => handleItemClick(item)}
              sx={
                item.variant
                  ? { px: 3 }
                  : {
                      color: isActive(item) ? '#00e676' : 'grey.400',
                      fontWeight: isActive(item) ? 600 : 400,
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      '&:hover': { color: '#00e676' },
                    }
              }
            >
              {item.icon && (
                <Box component="span" sx={{ display: 'inline-flex', mr: 0.5, alignItems: 'center' }}>
                  <item.icon fontSize="small" />
                </Box>
              )}
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
