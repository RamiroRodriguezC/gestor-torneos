import { Box, Typography, Card, CardContent, Stack, Chip } from '@mui/material'
import CompetitorPhoto from '../../shared/CompetitorPhoto'
import { getTeamScore, STATUS_STYLE } from './matchUtils'

function MatchCardVersus({ match, myTeamId, showDate }) {
  const home = match.competitors?.[0]
  const away = match.competitors?.[1]
  const statusInfo = STATUS_STYLE[match.status] || STATUS_STYLE.PROGRAMADO
  const isMyMatch = myTeamId && match.competitors?.some((c) => String(c.teamId) === String(myTeamId))

  const homeScore = getTeamScore(match, home?.teamId)
  const awayScore = getTeamScore(match, away?.teamId)

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
            <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: 'flex-end' }}>
              <Typography variant="body1" sx={{
                fontWeight: String(home?.teamId) === String(myTeamId) ? 700 : 400,
                color: String(home?.teamId) === String(myTeamId) ? '#00e676' : 'text.primary',
                fontSize: '0.9rem',
              }}>
                {home?.displayNameSnapshot || home?.teamId || 'Local'}
              </Typography>
              <CompetitorPhoto
                logoURL={home?.logoURLSnapshot}
                displayName={home?.displayNameSnapshot}
                size={24}
              />
            </Stack>
          </Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 80, justifyContent: 'center' }}>
            {match.status === 'FINALIZADO' ? (
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                {homeScore} - {awayScore}
              </Typography>
            ) : match.status === 'EN_CURSO' ? (
              <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#00e676' }}>
                {homeScore} - {awayScore}
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: 'grey.500' }}>vs</Typography>
            )}
          </Stack>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CompetitorPhoto
                logoURL={away?.logoURLSnapshot}
                displayName={away?.displayNameSnapshot}
                size={24}
              />
              <Typography variant="body1" sx={{
                fontWeight: String(away?.teamId) === String(myTeamId) ? 700 : 400,
                color: String(away?.teamId) === String(myTeamId) ? '#00e676' : 'text.primary',
                fontSize: '0.9rem',
              }}>
                {away?.displayNameSnapshot || away?.teamId || 'Visitante'}
              </Typography>
            </Stack>
          </Box>
          <Box sx={{ minWidth: 60, textAlign: 'right' }}>
            <Chip
              label={statusInfo.label}
              size="small"
              sx={{
                bgcolor: statusInfo.color,
                color: '#000',
                fontWeight: 600,
                fontSize: '0.65rem',
                height: 20,
                animation: match.status === 'EN_CURSO' ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
              }}
            />
          </Box>
        </Stack>
        {showDate && match.startAt && (
          <Typography variant="caption" sx={{ color: 'grey.600', display: 'block', textAlign: 'right', mt: 0.5 }}>
            {new Date(match.startAt).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default MatchCardVersus
