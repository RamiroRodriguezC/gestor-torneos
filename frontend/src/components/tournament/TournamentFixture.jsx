import { useState, useMemo } from 'react'
import {
  Box, Typography, Card, CardContent, Stack, Chip, Tabs, Tab,
} from '@mui/material'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { useMatchesByTournament } from '../../hooks/useMatches'

const STATUS_STYLE = {
  PROGRAMADO: { label: 'PROGRAMADO', color: 'grey.500' },
  EN_CURSO: { label: 'EN CURSO', color: '#00e676' },
  FINALIZADO: { label: 'FINALIZADO', color: '#42a5f5' },
}

function FixtureMatch({ match, myTeamId }) {
  const home = match.competitors?.[0]
  const away = match.competitors?.[1]
  const statusInfo = STATUS_STYLE[match.status] || STATUS_STYLE.PROGRAMADO
  const isMyMatch = myTeamId && match.competitors?.some((c) => String(c.teamId) === String(myTeamId))

  const homeScore = match.keyEvents
    ?.filter((e) => String(e.competitorId) === String(home?.teamId) && (e.incrementScore || 0) > 0)
    ?.reduce((s, e) => s + (e.incrementScore || 0), 0) || 0
  const awayScore = match.keyEvents
    ?.filter((e) => String(e.competitorId) === String(away?.teamId) && (e.incrementScore || 0) > 0)
    ?.reduce((s, e) => s + (e.incrementScore || 0), 0) || 0

  return (
    <Card sx={{
      bgcolor: isMyMatch ? '#1a2a1a' : '#1a1a1a',
      border: '1px solid',
      borderColor: isMyMatch ? '#00e67644' : 'divider',
      '&:hover': { borderColor: isMyMatch ? '#00e676' : 'grey.600' },
    }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ flex: 1, textAlign: 'right' }}>
            <Typography variant="body2" sx={{
              fontWeight: String(home?.teamId) === String(myTeamId) ? 700 : 400,
              color: String(home?.teamId) === String(myTeamId) ? '#00e676' : 'text.primary',
            }}>
              {home?.teamId || 'Local'}
            </Typography>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 70, justifyContent: 'center' }}>
            {match.status === 'FINALIZADO' || match.status === 'EN_CURSO' ? (
              <Typography variant="body1" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                {homeScore} - {awayScore}
              </Typography>
            ) : (
              <Typography variant="caption" sx={{ color: 'grey.500' }}>vs</Typography>
            )}
          </Stack>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" sx={{
              fontWeight: String(away?.teamId) === String(myTeamId) ? 700 : 400,
              color: String(away?.teamId) === String(myTeamId) ? '#00e676' : 'text.primary',
            }}>
              {away?.teamId || 'Visitante'}
            </Typography>
          </Box>
          <Box sx={{ minWidth: 80, textAlign: 'right' }}>
            <Chip label={statusInfo.label} size="small" sx={{
              bgcolor: statusInfo.color, color: '#000', fontWeight: 600, fontSize: '0.65rem', height: 20,
            }} />
          </Box>
        </Stack>
        {match.startAt && (
          <Typography variant="caption" sx={{ color: 'grey.600', display: 'block', textAlign: 'right', mt: 0.5 }}>
            {new Date(match.startAt).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

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
                <FixtureMatch key={m._id} match={m} myTeamId={myTeamId} />
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
          <FixtureMatch key={match._id} match={match} myTeamId={myTeamId} />
        ))}
      </Stack>
    </Box>
  )
}

export default TournamentFixture
