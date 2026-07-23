import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Card, CardContent, Stack, IconButton, Grid,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CompetitorPhoto from '../shared/CompetitorPhoto'
import { useTeam } from '../../hooks/useTeams'
import { useMatchesByTournament } from '../../hooks/useMatches'
import MatchCard from './match/MatchCard'
import { getTeamScore, getOpponentScore } from './match/matchUtils'

function RoundSelector({ rounds, selected, onChange }) {
  const currentIndex = rounds.findIndex((r) => r.roundNumber === selected)
  const prevRounds = rounds.filter((r) => r.roundNumber < selected)
  const nextRounds = rounds.filter((r) => r.roundNumber > selected)

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mt: 2, mb: 3 }}>
      <IconButton
        onClick={() => onChange(prevRounds[prevRounds.length - 1]?.roundNumber)}
        disabled={!prevRounds.length}
        sx={{ color: prevRounds.length ? '#00e676' : 'grey.700' }}
      >
        <ChevronLeftIcon />
      </IconButton>
      <Typography variant="h6" sx={{ fontWeight: 600, minWidth: 160, textAlign: 'center' }}>
        {rounds.find((r) => r.roundNumber === selected)?.roundName || `Ronda ${selected}`}
      </Typography>
      <IconButton
        onClick={() => onChange(nextRounds[0]?.roundNumber)}
        disabled={!nextRounds.length}
        sx={{ color: nextRounds.length ? '#00e676' : 'grey.700' }}
      >
        <ChevronRightIcon />
      </IconButton>
    </Stack>
  )
}

function TeamCard({ team, myTeamId, allMatches }) {
  const navigate = useNavigate()

  const last5 = useMemo(() => {
    const myCompleted = allMatches
      .filter((m) => m.competitors?.some((c) => String(c.teamId) === String(myTeamId)) && m.status === 'FINALIZADO')
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
        m.competitors?.some((c) => String(c.teamId) === String(myTeamId)) &&
        m.status === 'PROGRAMADO'
    )
  }, [allMatches, myTeamId])

  const nextOpponent = nextMatch?.competitors?.find(
    (c) => String(c.teamId) !== String(myTeamId)
  )

  if (!myTeamId) return null

  const WDLColors = { W: '#00e676', D: '#ffc107', L: '#ef5350' }

  return (
    <Card
      sx={{ bgcolor: '#1a1a1a', border: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { borderColor: '#00e676' } }}
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
                      width: 26, height: 26, borderRadius: '50%',
                      bgcolor: WDLColors[r], display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '0.7rem',
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

function TournamentGeneral({ tournament, user }) {
  const allMatches = useMatchesByTournament(tournament._id)
  const rounds = tournament.rounds || []

  const myTeamId = useMemo(() => {
    const userTeamIds = user?.teams?.map((t) => t.teamId) || []
    const participantIds = tournament.participantes?.map((p) => p.teamId) || []
    return userTeamIds.find((id) => participantIds.some((pid) => String(pid) === String(id)))
  }, [user, tournament])

  const myTeam = useTeam(myTeamId)

  const currentRound = useMemo(() => {
    return rounds.find((r) => r.status === 'IN_PROCESS')
      || rounds.filter((r) => r.status === 'SCHEDULED')[0]
      || rounds[rounds.length - 1]
  }, [rounds])

  const [selectedRound, setSelectedRound] = useState(currentRound?.roundNumber || 1)

  const roundMatches = useMemo(() => {
    return allMatches.filter((m) => m.round?.number === selectedRound)
  }, [allMatches, selectedRound])

  if (!tournament) return null

  return (
    <Box sx={{ mt: 4 }}>
      <RoundSelector
        rounds={rounds}
        selected={selectedRound}
        onChange={setSelectedRound}
      />

      <Grid container spacing={3}>
        {myTeamId && (
          <Grid item xs={12} md={4}>
            <TeamCard team={myTeam} myTeamId={myTeamId} allMatches={allMatches} />
          </Grid>
        )}
        <Grid item xs={12} md={myTeamId ? 8 : 12}>
          <Stack spacing={1}>
            {roundMatches.length === 0 && (
              <Typography sx={{ color: 'grey.500', textAlign: 'center', py: 4 }}>
                No hay partidos en esta ronda
              </Typography>
            )}
            {roundMatches.map((match) => (
              <MatchCard key={match._id} match={match} myTeamId={myTeamId} />
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}

export default TournamentGeneral
