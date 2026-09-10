import { useNavigate, useLocation } from 'react-router-dom'
import { useMediaQuery, useTheme } from '@mui/material'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AppLogo from './AppLogo'
import OfflineBanner from './OfflineBanner'
import { dashboardNavItems } from '../../config/navigation'

function Navbar({
  items = dashboardNavItems,
  backTo,
  activeItem,
  onItemClick,
  onAction,
  mobileVariant = 'bottom',
  logoTo,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const hasBottomNav = mobileVariant === 'bottom' && isMobile && items.some((i) => i.icon)

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
    if (item.path) {
      if (item.path === '/dashboard/tournaments' && (location.pathname === '/dashboard' || location.pathname === '/dashboard/tournaments')) {
        return true
      }
      if (item.path === '/dashboard' && location.pathname === '/dashboard') {
        return true
      }
      return location.pathname.startsWith(item.path)
    }
    return false
  }

  if (hasBottomNav) {
    return (
      <>
        {/* Banner de conexión para la vista mobile */}
        <OfflineBanner />
        <AppBar position="sticky" sx={{ bgcolor: '#0a0a0a', boxShadow: '0 2px 20px rgba(0, 230, 118, 0.15)' }}>
          <Toolbar>
            {backTo ? (
              <>
                <IconButton onClick={() => navigate(backTo)} sx={{ color: 'grey.400', mr: 0.5 }}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="body2" sx={{ color: 'grey.400', cursor: 'pointer' }} onClick={() => navigate(backTo)}>
                  Volver
                </Typography>
              </>
            ) : (
              <Box sx={{ cursor: 'pointer' }} onClick={() => navigate(logoTo ?? '/dashboard')}>
                <AppLogo />
              </Box>
            )}
          </Toolbar>
        </AppBar>

        {/* Barra inferior responsive con botón central circular elevado */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            bgcolor: '#0a0a0a',
            borderTop: '1px solid',
            borderColor: 'divider',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            px: 0.5,
          }}
        >
          {items.map((item, index) => {
            const isCenter = item.isCenter || (items.length === 5 && index === 2)
            const active = isActive(item)

            if (isCenter) {
              return (
                <Box
                  key={item.value ?? item.path ?? item.label}
                  onClick={() => handleItemClick(item)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    top: -12,
                    cursor: 'pointer',
                    minWidth: 64,
                    zIndex: 1201,
                  }}
                >
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      bgcolor: active ? '#00e676' : '#181818',
                      border: '2px solid',
                      borderColor: '#00e676',
                      boxShadow: active
                        ? '0 0 16px rgba(0, 230, 118, 0.6)'
                        : '0 4px 12px rgba(0, 0, 0, 0.6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: active ? '#0a0a0a' : '#00e676',
                      transition: 'all 0.2s ease-in-out',
                      '&:active': { transform: 'scale(0.92)' },
                    }}
                  >
                    {item.icon && <item.icon sx={{ fontSize: 28 }} />}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: active ? 700 : 500,
                      color: active ? '#00e676' : 'grey.400',
                      mt: 0.3,
                      textAlign: 'center',
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              )
            }

            return (
              <Box
                key={item.value ?? item.path ?? item.label}
                onClick={() => handleItemClick(item)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flex: 1,
                  py: 0.5,
                  minWidth: 0,
                  color: active ? '#00e676' : 'grey.500',
                  transition: 'color 0.15s ease',
                  '&:hover': { color: active ? '#00e676' : 'grey.300' },
                }}
              >
                {item.icon && <item.icon sx={{ fontSize: 24, mb: 0.2 }} />}
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    fontSize: '0.68rem',
                    fontWeight: active ? 700 : 500,
                    color: 'inherit',
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            )
          })}
        </Box>
      </>
    )
  }

  return (
    <>
      {/* Banner de conexión para la vista desktop */}
      <OfflineBanner />
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
    </>
  )
}

export default Navbar
