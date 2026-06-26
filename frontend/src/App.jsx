import { ThemeProvider, createTheme, CssBaseline, Container, Typography } from '@mui/material'
import { useState } from 'react'

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
  const [count, setCount] = useState(0)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          TourneyFy
        </Typography>
        <Typography variant="body1">
          Welcome to TourneyFy!
        </Typography>
      </Container>
    </ThemeProvider>
  )
}

export default App
