import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import HomePage from './pages/HomePage'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Tournaments from './pages/Tournaments'
import Teams from './pages/Teams'
import Profile from './pages/Profile'
import Config from './pages/Config'

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
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/tournaments" element={<Tournaments />} />
          <Route path="/dashboard/teams" element={<Teams />} />
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/dashboard/config" element={<Config />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
