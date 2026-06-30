import { useEffect, useState } from 'react'
import { ThemeProvider, createTheme, CssBaseline, Container, Typography, CircularProgress } from '@mui/material'
import { seedDexie } from './data/seedDexie.js'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7c4dff',
    },
    secondary: {
      main: '#ff6d00',
    },
  },
})

function App() {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    seedDexie()
      .then(() => setStatus('ready'))
      .catch((err) => {
        console.error(err)
        setStatus('error')
      })
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          TourneyFy
        </Typography>
        {status === 'loading' && <CircularProgress />}
        {status === 'error' && (
          <Typography color="error">
            No se pudo conectar con el backend. Asegurate de que esté corriendo en localhost:3000.
          </Typography>
        )}
        {status === 'ready' && (
          <Typography variant="body1">
            Welcome to TourneyFy!
          </Typography>
        )}
      </Container>
    </ThemeProvider>
  )
}

export default App
