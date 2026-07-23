import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Card, CardContent, Stack, TextField, InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import GroupsIcon from '@mui/icons-material/Groups'
import PersonIcon from '@mui/icons-material/Person'
import CompetitorPhoto from '../shared/CompetitorPhoto'
import { useSport } from '../../hooks/useSportsConfig'
import { useTeamsByDiscipline } from '../../hooks/useTeams'

function TournamentParticipants({ tournament }) {
  const navigate = useNavigate()
  const sport = useSport(tournament.sportConfigId)
  const [search, setSearch] = useState('')

  const isTeamSport = sport?.sportProps?.participantType === 'TEAM'
  const allSportTeams = useTeamsByDiscipline(tournament.sportConfigId)
  const teamMap = useMemo(() => {
    if (!allSportTeams) return {}
    return Object.fromEntries(allSportTeams.map((t) => [t._id, t]))
  }, [allSportTeams])
  const list = tournament.participantes || []

  const filtered = !search.trim()
    ? list
    : list.filter((p) =>
        p.displayNameSnapshot?.toLowerCase().includes(search.toLowerCase())
      )

  if (!tournament) return null

  return (
    <Box sx={{ mt: 4 }}>
      <TextField
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={`Buscar ${isTeamSport ? 'equipo' : 'participante'}...`}
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
          {isTeamSport ? (
            <GroupsIcon sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
          ) : (
            <PersonIcon sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
          )}
          <Typography variant="h6" sx={{ color: 'grey.500' }}>
            {search
              ? `No se encontraron ${isTeamSport ? 'equipos' : 'participantes'}`
              : `No hay ${isTeamSport ? 'equipos' : 'participantes'} en este torneo`}
          </Typography>
        </Box>
      )}

      <Stack spacing={1.5}>
        {filtered.map((p) => (
          <Card
            key={String(p.teamId)}
            onClick={() => {
              if (isTeamSport) navigate(`/team/${p.teamId}`)
            }}
            sx={{
              bgcolor: '#1a1a1a',
              border: '1px solid',
              borderColor: 'divider',
              cursor: isTeamSport ? 'pointer' : 'default',
              '&:hover': isTeamSport ? { borderColor: '#00e676' } : {},
            }}
          >
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <CompetitorPhoto
                  logoURL={p.logoURL || teamMap[p.teamId]?.logoURL || ''}
                  displayName={p.displayNameSnapshot || teamMap[p.teamId]?.name || ''}
                  size={44}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {p.displayNameSnapshot || teamMap[p.teamId]?.name || (isTeamSport ? 'Equipo' : 'Participante')}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}

export default TournamentParticipants
