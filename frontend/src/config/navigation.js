import DashboardIcon from '@mui/icons-material/Dashboard'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import GroupsIcon from '@mui/icons-material/Groups'
import BarChartIcon from '@mui/icons-material/BarChart'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CampaignIcon from '@mui/icons-material/Campaign'
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'

export const authNavItems = [
  { label: 'Login', path: '/login', variant: 'outlined', type: 'navigation' },
  { label: 'Registrarse', path: '/register', variant: 'contained', type: 'navigation' },
]

export const authNavItemsLoggedIn = [
  { label: 'Ir al Dashboard', path: '/dashboard', variant: 'contained', type: 'navigation' },
  { label: 'Cerrar sesión', variant: 'outlined', action: 'logout', type: 'action' },
]

export const dashboardNavItems = [
  { label: 'Mis Torneos', path: '/dashboard/tournaments', icon: EmojiEventsIcon, type: 'navigation' },
  { label: 'Mis Equipos', path: '/dashboard/teams', icon: GroupsIcon, type: 'navigation' },
  { label: 'Mi Perfil', path: '/dashboard/profile', icon: PersonIcon, type: 'navigation' },
  { label: 'Configuración', path: '/dashboard/config', icon: SettingsIcon, type: 'navigation' },
]

export const tournamentSections = [
  { label: 'General', value: 'general', icon: DashboardIcon, type: 'navigation' },
  { label: 'Clasificación', value: 'standings', icon: EmojiEventsIcon, type: 'navigation' },
  { label: 'Participantes', value: 'teams', icon: GroupsIcon, type: 'navigation' },
  { label: 'Estadísticas', value: 'stats', icon: BarChartIcon, type: 'navigation' },
  { label: 'Fixture', value: 'fixture', icon: CalendarMonthIcon, type: 'navigation' },
  { label: 'Anuncios', value: 'announcements', icon: CampaignIcon, type: 'navigation' },
]
