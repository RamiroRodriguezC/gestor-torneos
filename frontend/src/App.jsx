import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline, Container } from '@mui/material'
import ErrorDisplay from './components/ErrorDisplay'
import ProtectedRoute from './components/ProtectedRoute'
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
import ExploreTournaments from './pages/ExploreTournaments'
import InscriptionPage from './pages/InscriptionPage'
import TournamentApplicationsPage from './pages/TournamentApplicationsPage'

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
          
          {/* Rutas públicas */}
          <Route path="/torneos" element={<ExploreTournaments />} />
          <Route path="/tournament/:id" element={<TournamentPage />} />
          <Route path="/user/:userId" element={<Profile />} />

          {/* Rutas protegidas que requieren autenticación */}
          <Route path="/dashboard" element={<ProtectedRoute><Navigate to="/dashboard/tournaments" replace /></ProtectedRoute>} />
          <Route path="/dashboard/tournaments" element={<ProtectedRoute><Tournaments /></ProtectedRoute>} />
          <Route path="/dashboard/tournaments/create" element={<ProtectedRoute><CreateTournament /></ProtectedRoute>} />
          <Route path="/dashboard/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
          <Route path="/dashboard/teams/:id" element={<ProtectedRoute><Team /></ProtectedRoute>} />
          <Route path="/dashboard/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/dashboard/config" element={<ProtectedRoute><Config /></ProtectedRoute>} />
          <Route path="/torneos/:id/inscripcion" element={<ProtectedRoute><InscriptionPage /></ProtectedRoute>} />
          <Route path="/torneos/:id/solicitudes" element={<ProtectedRoute><TournamentApplicationsPage /></ProtectedRoute>} />
          <Route path="/match/:id" element={<ProtectedRoute><MatchDetailPage /></ProtectedRoute>} />
          <Route path="/team/:id" element={<ProtectedRoute><Team /></ProtectedRoute>} />

          <Route path="*" element={<Container maxWidth="md"><ErrorDisplay type="PAGE_NOT_FOUND" size="lg" /></Container>} />
        </Routes>
        </OnlineProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
