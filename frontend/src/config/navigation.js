import DashboardIcon from '@mui/icons-material/Dashboard'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import ExploreIcon from '@mui/icons-material/Explore'
import GroupsIcon from '@mui/icons-material/Groups'
import BarChartIcon from '@mui/icons-material/BarChart'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CampaignIcon from '@mui/icons-material/Campaign'
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'

export const authNavItems = [
  { label: 'Torneos', path: '/torneos', type: 'navigation' },
  { label: 'Login', path: '/login', variant: 'outlined', type: 'navigation' },
  { label: 'Registrarse', path: '/register', variant: 'contained', type: 'navigation' },
]

export const authNavItemsLoggedIn = [
  { label: 'Torneos', path: '/torneos', type: 'navigation' },
  { label: 'Ir al Dashboard', path: '/dashboard', variant: 'contained', type: 'navigation' },
  { label: 'Cerrar sesión', variant: 'outlined', action: 'logout', type: 'action' },
]

export const dashboardNavItems = [
  { label: 'Explorar', path: '/torneos', icon: ExploreIcon, type: 'navigation' },
  { label: 'Equipos', path: '/dashboard/teams', icon: GroupsIcon, type: 'navigation' },
  { label: 'Torneos', path: '/dashboard/tournaments', icon: EmojiEventsIcon, type: 'navigation', isCenter: true },
  { label: 'Perfil', path: '/dashboard/profile', icon: PersonIcon, type: 'navigation' },
  { label: 'Ajustes', path: '/dashboard/config', icon: SettingsIcon, type: 'navigation' },
]

export const tournamentSections = [
  { label: 'Posiciones', value: 'standings', icon: EmojiEventsIcon, type: 'navigation' },
  { label: 'Equipos', value: 'teams', icon: GroupsIcon, type: 'navigation' },
  { label: 'Fixture', value: 'fixture', icon: CalendarMonthIcon, type: 'navigation', isCenter: true },
  { label: 'Estadísticas', value: 'stats', icon: BarChartIcon, type: 'navigation' },
  { label: 'Anuncios', value: 'announcements', icon: CampaignIcon, type: 'navigation' },
]
