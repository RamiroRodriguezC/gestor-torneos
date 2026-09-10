import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Card, CardContent, Stack, Tabs, Tab, Grid,
} from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import CompetitorPhoto from '../shared/CompetitorPhoto'
import { useTeam } from '../../hooks/useTeams'
import { useMatchesByTournament } from '../../hooks/useMatches'
import MatchCard from './match/MatchCard'
import { getTeamScore, getOpponentScore } from './match/matchUtils'
import { findMyParticipation } from '../../utils/participant'

function TeamCard({ team, myTeamId, allMatches }) {
  const navigate = useNavigate()

  const last5 = useMemo(() => {
    const myCompleted = allMatches
      .filter(
        (m) =>
          m.competitors?.some((c) => String(c.teamId) === String(myTeamId) || String(c.participantId) === String(myTeamId)) &&
          m.status === 'FINALIZADO'
      )
      .sort((a, b) => (b.round?.number || 0) - (a.round?.number || 0))
      .slice(0, 5)
      .reverse()

    return myCompleted.map((m) => {
      const myScore = getTeamScore(m, myTeamId)
      const oppScore = getOpponentScore(m, myTeamId)
      if (myScore > oppScore) return 'W'
      if (myScore < oppScore) return 'L'
      return 'D'
    })
  }, [allMatches, myTeamId])

  const nextMatch = useMemo(() => {
    return allMatches.find(
      (m) =>
        m.competitors?.some((c) => String(c.teamId) === String(myTeamId) || String(c.participantId) === String(myTeamId)) &&
        m.status === 'PROGRAMADO'
    )
  }, [allMatches, myTeamId])

  const nextOpponent = nextMatch?.competitors?.find(
    (c) => String(c.teamId) !== String(myTeamId) && String(c.participantId) !== String(myTeamId)
  )

  if (!myTeamId) return null

  const WDLColors = { W: '#00e676', D: '#ffc107', L: '#ef5350' }

  return (
    <Card
      sx={{
        bgcolor: '#1a1a1a',
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        height: '100%',
        '&:hover': { borderColor: '#00e676' },
      }}
      onClick={() => navigate(`/team/${myTeamId}`)}
    >
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <CompetitorPhoto logoURL={team?.logoURL} displayName={team?.name} size={52} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{team?.name || 'Mi equipo'}</Typography>
            {last5.length > 0 && (
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                {last5.map((r, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      bgcolor: WDLColors[r],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                    }}
                  >
                    {r}
                  </Box>
                ))}
              </Stack>
            )}
            {nextMatch && nextOpponent && (
              <Typography variant="caption" sx={{ color: 'grey.500', mt: 0.5, display: 'block' }}>
                Próximo: vs {nextOpponent.displayNameSnapshot || nextOpponent.teamId}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

function TournamentFixture({ tournament, user }) {
  const allMatches = useMatchesByTournament(tournament?._id)
  const rounds = tournament?.rounds || []

  const myTeamId = useMemo(() => findMyParticipation(tournament, user), [user, tournament])
  const myTeam = useTeam(myTeamId)

  const initialRoundIndex = useMemo(() => {
    if (!rounds.length) return 0
    const inProcessIdx = rounds.findIndex((r) => r.status === 'IN_PROCESS')
    if (inProcessIdx !== -1) return inProcessIdx
    const scheduledIdx = rounds.findIndex((r) => r.status === 'SCHEDULED')
    if (scheduledIdx !== -1) return scheduledIdx
    return 0
  }, [rounds])

  const [tabIndex, setTabIndex] = useState(initialRoundIndex)

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
        m.competitors?.some((c) => String(c.teamId) === String(myTeamId) || String(c.participantId) === String(myTeamId)) &&
        m.status === 'PROGRAMADO'
    ).sort((a, b) => new Date(a.startAt || 0) - new Date(b.startAt || 0))
  }, [allMatches, myTeamId])

  if (!tournament) return null

  return (
    <Box sx={{ mt: 3 }}>
      {/* Sección Mi Equipo: Tarjeta con racha W/D/L y Próximos Partidos */}
      {myTeamId && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={myUpcoming.length > 0 ? 5 : 12}>
            <TeamCard team={myTeam} myTeamId={myTeamId} allMatches={allMatches} />
          </Grid>
          {myUpcoming.length > 0 && (
            <Grid item xs={12} md={7}>
              <Card sx={{ bgcolor: '#1a2a1a', border: '1px solid', borderColor: '#00e67644', height: '100%' }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#00e676' }}>
                    Próximos partidos de mi equipo
                  </Typography>
                  <Stack spacing={1}>
                    {myUpcoming.slice(0, 2).map((m) => (
                      <MatchCard key={m._id} match={m} myTeamId={myTeamId} showDate />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Selector de Rondas */}
      <Tabs
        value={tabIndex < roundTabs.length ? tabIndex : 0}
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
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CalendarMonthIcon sx={{ fontSize: 56, color: 'grey.600', mb: 1.5 }} />
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
