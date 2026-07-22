import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Card, CardContent, Stack, TextField, InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import GroupsIcon from '@mui/icons-material/Groups'
import { useTeams } from '../../hooks/useTeams'

function TournamentTeams({ tournament }) {
  const navigate = useNavigate()
  const allTeams = useTeams()
  const [search, setSearch] = useState('')

  const participants = useMemo(() => {
    return (tournament.participantes || []).map((p) => {
      const team = allTeams.find((t) => String(t._id) === String(p.teamId))
      return { ...p, team }
    })
  }, [tournament, allTeams])

  const filtered = useMemo(() => {
    if (!search.trim()) return participants
    const q = search.toLowerCase()
    return participants.filter(
      (p) =>
        p.displayNameSnapshot?.toLowerCase().includes(q) ||
        p.team?.name?.toLowerCase().includes(q)
    )
  }, [participants, search])

  if (!tournament) return null

  return (
    <Box sx={{ mt: 4 }}>
      <TextField
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar equipo..."
        fullWidth
        variant="outlined"
        size="small"
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'grey.500' }} />
            </InputAdornment>
          ),
        }}
      />

      {filtered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <GroupsIcon sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'grey.500' }}>
            {search ? 'No se encontraron equipos' : 'No hay equipos en este torneo'}
          </Typography>
        </Box>
      )}

      <Stack spacing={1.5}>
        {filtered.map((p) => (
          <Card
            key={String(p.teamId)}
            onClick={() => p.team && navigate(`/team/${p.teamId}`)}
            sx={{
              bgcolor: '#1a1a1a',
              border: '1px solid',
              borderColor: 'divider',
              cursor: p.team ? 'pointer' : 'default',
              '&:hover': p.team ? { borderColor: '#00e676' } : {},
            }}
          >
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 44, height: 44, borderRadius: '50%', bgcolor: '#2a2a2a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', fontWeight: 700, color: '#00e676',
                    overflow: 'hidden', flexShrink: 0,
                  }}
                >
                  {p.team?.logoURL ? (
                    <Box component="img" src={p.team.logoURL} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    p.displayNameSnapshot?.[0] || p.team?.name?.[0] || '?'
                  )}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {p.displayNameSnapshot || p.team?.name || 'Equipo'}
                  </Typography>
                  {p.team?.name && p.displayNameSnapshot && p.team.name !== p.displayNameSnapshot && (
                    <Typography variant="caption" sx={{ color: 'grey.500' }}>
                      {p.team.name}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}

export default TournamentTeams
