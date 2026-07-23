import { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import MatchCard from '../match/MatchCard'

function getWinnerTeamId(match) {
  if (match.status !== 'FINALIZADO') return null
  const scores = (match.competitors || []).map((c) => {
    const score = (match.keyEvents || [])
      .filter((e) => String(e.competitorId) === String(c.teamId) && (e.incrementScore || 0) > 0)
      .reduce((s, e) => s + (e.incrementScore || 0), 0)
    return { teamId: c.teamId, score }
  })
  if (scores.length < 2) return null
  return scores[0].score > scores[1].score ? scores[0].teamId : scores[1].score > scores[0].score ? scores[1].teamId : null
}

function buildBracketData(matches, tournament) {
  const dates = tournament.dates || tournament.rounds || []
  if (dates.length === 0) return []

  const rounds = dates.map((d) => {
    const roundMatches = d.matches
      ? d.matches.map((mid) => matches.find((m) => m._id === mid)).filter(Boolean)
      : matches.filter((m) => m.round?.number === d.roundNumber).sort((a, b) => (a.round?.position || 0) - (b.round?.position || 0))
    return { ...d, matches: roundMatches }
  })

  const winnerMap = {}
  for (let ri = 0; ri < rounds.length; ri++) {
    const r = rounds[ri]
    r.matches.forEach((m, mi) => {
      const winner = getWinnerTeamId(m)
      if (winner) {
        const nextRi = ri + 1
        if (nextRi < rounds.length) {
          const nextMi = Math.floor(mi / 2)
          if (!winnerMap[nextRi]) winnerMap[nextRi] = {}
          if (!winnerMap[nextRi][nextMi]) winnerMap[nextRi][nextMi] = []
          winnerMap[nextRi][nextMi].push(winner)
        }
      }
    })
  }

  return { rounds, winnerMap }
}

function BracketMatch({ match, winnerTeams, myTeamId }) {
  return (
    <Box>
      <MatchCard match={match} myTeamId={myTeamId} />
      {winnerTeams && winnerTeams.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 0.5 }}>
          {winnerTeams.map((tid) => {
            const comp = match.competitors?.find((c) => String(c.teamId) === String(tid))
            return (
              <Typography key={tid} variant="caption" sx={{ color: '#00e676', fontWeight: 600, fontSize: '0.65rem' }}>
                Avanza: {comp?.displayNameSnapshot || tid}
              </Typography>
            )
          })}
        </Box>
      )}
    </Box>
  )
}

function BracketTree({ tournament, matches, myTeamId }) {
  const bracket = useMemo(() => buildBracketData(matches, tournament), [matches, tournament])
  const rounds = bracket.rounds || []

  if (rounds.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <EmojiEventsIcon sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'grey.500' }}>
          No hay datos de llaves disponibles
        </Typography>
      </Box>
    )
  }

  const maxMatches = Math.max(...rounds.map((r) => r.matches.length))
  const MATCH_HEIGHT = 100
  const CONNECTOR_HEIGHT = 32
  const totalHeight = maxMatches * MATCH_HEIGHT + (maxMatches - 1) * CONNECTOR_HEIGHT + 60

  return (
    <Box sx={{ overflowX: 'auto', py: 2 }}>
      <Box sx={{ display: 'flex', gap: 3, minWidth: rounds.length * 320, justifyContent: 'center' }}>
        {rounds.map((round, ri) => {
          const spacing = (totalHeight - round.matches.length * MATCH_HEIGHT) / (round.matches.length + 1)

          return (
            <Box key={ri} sx={{ display: 'flex', flexDirection: 'column', minWidth: 280, maxWidth: 320 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600, textAlign: 'center', mb: 1,
                  color: ri === rounds.length - 1 ? '#FFD700' : 'grey.300',
                }}
              >
                {round.roundName || `Ronda ${round.roundNumber}`}
              </Typography>

              {round.matches.map((match, mi) => {
                const nextWinners = bracket.winnerMap?.[ri]?.[mi]

                return (
                  <Box
                    key={match._id}
                    sx={{
                      mt: mi === 0 ? `${spacing}px` : `${CONNECTOR_HEIGHT}px`,
                      mb: mi === round.matches.length - 1 ? `${spacing}px` : 0,
                    }}
                  >
                    <BracketMatch match={match} winnerTeams={nextWinners} myTeamId={myTeamId} />
                  </Box>
                )
              })}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default BracketTree
