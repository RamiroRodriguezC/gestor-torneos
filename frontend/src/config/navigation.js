import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import GroupsIcon from '@mui/icons-material/Groups'
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'

export const authNavItems = [
  { label: 'Login', path: '/login', variant: 'outlined' },
  { label: 'Registrarse', path: '/register', variant: 'contained' },
]

export const authNavItemsLoggedIn = [
  { label: 'Ir al Dashboard', path: '/dashboard', variant: 'contained' },
  { label: 'Cerrar sesión', path: '/login', variant: 'outlined', action: 'logout' },
]

export const dashboardNavItems = [
  { label: 'Mis Torneos', path: '/dashboard/tournaments', icon: EmojiEventsIcon },
  { label: 'Mis Equipos', path: '/dashboard/teams', icon: GroupsIcon },
  { label: 'Mi Perfil', path: '/dashboard/profile', icon: PersonIcon },
  { label: 'Configuración', path: '/dashboard/config', icon: SettingsIcon },
]
