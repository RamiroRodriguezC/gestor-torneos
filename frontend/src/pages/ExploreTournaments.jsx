import { useEffect, useMemo, useState } from 'react'
import { Container, Typography, Stack, Box, TextField, InputAdornment, MenuItem, Select, FormControl, InputLabel } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import Navbar from '../components/layout/Navbar'
import TournamentCard from '../components/tournament/TournamentCard'
import { useAuth } from '../hooks/useAuth'
import { useActiveTournaments } from '../hooks/useTournaments'
import { useSports } from '../hooks/useSportsConfig'
import { fetchPublicTournaments } from '../data/tournaments'

// Panel público de torneos: descubre torneos PUBLICADO para inscribirse.
// La fuente reactiva es Dexie (useActiveTournaments); al montar refrescamos
// contra el backend público y volcamos a Dexie (cache-first + revalidate).
function ExploreTournaments() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sportId, setSportId] = useState('')
  const [error, setError] = useState('')

  const tournaments = useActiveTournaments()
  const sports = useSports()

  useEffect(() => {
    let mounted = true
    fetchPublicTournaments()
      .catch((err) => {
        if (mounted) setError(err.message)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (tournaments || []).filter((t) => {
      if (sportId && String(t.sportConfigId) !== String(sportId)) return false
      if (q && !t.title.toLowerCase().includes(q) && !(t.location?.city || '').toLowerCase().includes(q)) return false
      return true
    })
  }, [tournaments, search, sportId])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} sx={{ mt: 8, mb: 4, gap: 2 }}>
          <Box>
            <Typography variant="h3">Torneos</Typography>
            <Typography variant="body1" color="grey.500">
              {user ? 'Explorá torneos abiertos y anotá a tu equipo' : 'Explorá torneos abiertos e inscribite'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o ciudad..."
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'grey.500' }} />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Deporte</InputLabel>
            <Select
              value={sportId}
              label="Deporte"
              onChange={(e) => setSportId(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {(sports || []).map((s) => (
                <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {loading && tournaments.length === 0 && (
          <Typography color="grey.500" sx={{ textAlign: 'center', mt: 6 }}>Cargando torneos...</Typography>
        )}

        {error && (
          <Typography color="error" sx={{ textAlign: 'center', mt: 2 }}>{error}</Typography>
        )}

        {!loading && !error && filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <EmojiEventsIcon sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
            <Typography variant="h6" color="grey.500">
              No hay torneos abiertos con esos filtros
            </Typography>
          </Box>
        )}

        <Stack spacing={2} useFlexGap sx={{ pb: 6 }}>
          {filtered.map((t) => (
            <TournamentCard key={t._id} tournament={t} />
          ))}
        </Stack>
      </Container>
    </Box>
  )
}

export default ExploreTournaments
