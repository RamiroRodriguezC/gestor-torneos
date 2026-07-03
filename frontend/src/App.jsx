import { useState } from 'react'
import { ThemeProvider, createTheme, CssBaseline, Container, Typography, Button, Box, Paper, Chip } from '@mui/material'
import { syncUserEnvironment } from './data/userSync.js'
import { db } from './lib/db.js'

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

const TEST_USER_ID = '60c72b2f9b1d8b2bad000031'

async function readIndexedDB() {
  const tables = ['users', 'teams', 'tournaments', 'matches', 'fields', 'sportsConfig', 'applications']
  const result = {}
  for (const table of tables) {
    try {
      const data = await db[table].toArray()
      result[table] = data
    } catch {
      result[table] = []
    }
  }
  return result
}

function App() {
  const [syncResult, setSyncResult] = useState(null)
  const [syncCounts, setSyncCounts] = useState(null)
  const [dbContents, setDbContents] = useState(null)
  const [loadingDb, setLoadingDb] = useState(false)

  async function handleSync() {
    setSyncResult('syncing')
    setSyncCounts(null)
    setDbContents(null)
    try {
      const counts = await syncUserEnvironment(TEST_USER_ID)
      setSyncCounts(counts)
      setSyncResult('ok')
    } catch (err) {
      console.error(err)
      setSyncResult('error')
    }
  }

  async function handleViewDB() {
    setLoadingDb(true)
    try {
      const contents = await readIndexedDB()
      setDbContents(contents)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDb(false)
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          TourneyFy
        </Typography>
        <Typography variant="body1" gutterBottom>
          Presioná el botón para sincronizar los datos del usuario de prueba desde la API a IndexedDB.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Button variant="contained" onClick={handleSync} disabled={syncResult === 'syncing'}>
            {syncResult === 'syncing' ? 'Sincronizando...' : 'Sincronizar usuario de prueba'}
          </Button>
          <Button variant="outlined" onClick={handleViewDB} disabled={loadingDb}>
            {loadingDb ? 'Cargando...' : 'Ver IndexedDB'}
          </Button>
        </Box>

        {syncResult === 'ok' && syncCounts && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom color="success.main">
              Sync completado
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(syncCounts).map(([key, val]) => (
                <Chip key={key} label={`${key}: ${val}`} color={val > 0 ? 'primary' : 'default'} variant={val > 0 ? 'filled' : 'outlined'} />
              ))}
            </Box>
          </Paper>
        )}

        {syncResult === 'error' && (
          <Typography color="error" sx={{ mt: 1 }}>
            Error al sincronizar — revisá la consola para más detalles
          </Typography>
        )}

        {dbContents && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Contenido de IndexedDB
            </Typography>
            {Object.entries(dbContents).map(([table, data]) => (
              <Box key={table} sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  {table} ({data.length} documentos)
                </Typography>
                {data.length > 0 && (
                  <Box component="pre" sx={{ fontSize: 12, maxHeight: 200, overflow: 'auto', bgcolor: '#fafafa', p: 1, borderRadius: 1 }}>
                    {JSON.stringify(data.slice(0, 3), null, 2)}
                    {data.length > 3 && `\n... y ${data.length - 3} más`}
                  </Box>
                )}
              </Box>
            ))}
          </Paper>
        )}
      </Container>
    </ThemeProvider>
  )
}

export default App
