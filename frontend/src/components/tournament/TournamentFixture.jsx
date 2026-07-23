import { useState, useMemo } from 'react'
import {
  Box, Typography, Card, CardContent, Stack, Tabs, Tab,
} from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { useMatchesByTournament } from '../../hooks/useMatches'
import MatchCard from './match/MatchCard'

function TournamentFixture({ tournament, user }) {
  const allMatches = useMatchesByTournament(tournament._id)
  const rounds = tournament.rounds || []

  const myTeamId = useMemo(() => {
    const userTeamIds = user?.teams?.map((t) => t.teamId) || []
    const participantIds = tournament.participantes?.map((p) => p.teamId) || []
    return userTeamIds.find((id) => participantIds.some((pid) => String(pid) === String(id)))
  }, [user, tournament])

  const [tabIndex, setTabIndex] = useState(0)

  const roundTabs = useMemo(() => {
    return rounds.map((r, i) => ({ label: r.roundName || `Ronda ${r.roundNumber}`, value: r.roundNumber, index: i }))
  }, [rounds])

  const selectedRound = roundTabs[tabIndex]

  const roundMatches = useMemo(() => {
    if (!selectedRound) return []
    return allMatches.filter((m) => m.round?.number === selectedRound.value)
  }, [allMatches, selectedRound])

  const myUpcoming = useMemo(() => {
    return allMatches.filter(
      (m) =>
        m.competitors?.some((c) => String(c.teamId) === String(myTeamId)) &&
        m.status === 'PROGRAMADO'
    ).sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0))
  }, [allMatches, myTeamId])

  if (!tournament) return null

  return (
    <Box sx={{ mt: 4 }}>
      {myTeamId && myUpcoming.length > 0 && (
        <Card sx={{ bgcolor: '#1a2a1a', border: '1px solid', borderColor: '#00e67644', mb: 4 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, color: '#00e676' }}>
              Próximos partidos de mi equipo
            </Typography>
            <Stack spacing={1}>
              {myUpcoming.slice(0, 3).map((m) => (
                <MatchCard key={m._id} match={m} myTeamId={myTeamId} showDate />
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={tabIndex}
        onChange={(_, i) => setTabIndex(i)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          '& .MuiTab-root': { color: 'grey.500', textTransform: 'none', fontWeight: 500 },
          '& .Mui-selected': { color: '#00e676 !important' },
          '& .MuiTabs-indicator': { bgcolor: '#00e676' },
        }}
      >
        {roundTabs.map((rt) => (
          <Tab key={rt.value} label={rt.label} />
        ))}
      </Tabs>

      {roundMatches.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CalendarMonthIcon sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'grey.500' }}>
            No hay partidos en esta ronda
          </Typography>
        </Box>
      )}

      <Stack spacing={1}>
        {roundMatches.map((match) => (
          <MatchCard key={match._id} match={match} myTeamId={myTeamId} showDate />
        ))}
      </Stack>
    </Box>
  )
}

export default TournamentFixture
