import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline, Container } from '@mui/material'
import ErrorDisplay from './components/ErrorDisplay'
import { OnlineProvider } from './contexts/OnlineContext'
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Tournaments from './pages/Tournaments'
import CreateTournament from './pages/CreateTournament'
import Teams from './pages/Teams'
import Team from './pages/Team'
import Profile from './pages/Profile'
import Config from './pages/Config'
import TournamentPage from './pages/TournamentPage'
import MatchDetailPage from './pages/MatchDetailPage'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00e676',
    },
    secondary: {
      main: '#ff6d00',
    },
    background: {
      default: '#0a0a0a',
      paper: '#121212',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
  },
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        {/* OnlineProvider detecta online/offline y expone el estado global */}
        <OnlineProvider>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/tournaments" element={<Tournaments />} />
          <Route path="/dashboard/tournaments/create" element={<CreateTournament />} />
          <Route path="/dashboard/teams" element={<Teams />} />
          <Route path="/dashboard/teams/:id" element={<Team />} />
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/user/:userId" element={<Profile />} />
          <Route path="/dashboard/config" element={<Config />} />
          <Route path="/tournament/:id" element={<TournamentPage />} />
          <Route path="/match/:id" element={<MatchDetailPage />} />
          <Route path="/team/:id" element={<Team />} />
          <Route path="*" element={<Container maxWidth="md"><ErrorDisplay type="PAGE_NOT_FOUND" size="lg" /></Container>} />
        </Routes>
        </OnlineProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
