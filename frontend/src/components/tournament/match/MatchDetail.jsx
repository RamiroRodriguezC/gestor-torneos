import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Card, CardContent, Stack, Chip, Button, IconButton, Divider,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import PlaceIcon from '@mui/icons-material/Place'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import PersonIcon from '@mui/icons-material/Person'
import CompetitorPhoto from '../../shared/CompetitorPhoto'
import { useSport } from '../../../hooks/useSportsConfig'
import { getTeamScore, STATUS_STYLE, MATCH_STATUS_LABEL } from './matchUtils'
import MatchSheetDialog from './MatchSheetDialog'

const getCompetitorId = (c) => c?.participantId ?? c?.teamId

// Muestra el detalle de un partido (equipos, marcador, estado, fecha, cancha, eventos)
// y, si el usuario es el organizador del torneo, el botón para abrir la planilla.
function MatchDetail({ match, tournament, user }) {
  const navigate = useNavigate()
  const [sheetOpen, setSheetOpen] = useState(false)

  const sportConfigId =
    typeof match.sportConfigId === 'string' ? match.sportConfigId : match.sportConfigId?._id
  const sport = useSport(sportConfigId)

  const isOrganizer =
    tournament?.organizerId && user?._id &&
    String(tournament.organizerId) === String(user._id)

  const home = match.competitors?.[0]
  const away = match.competitors?.[1]
  const homeScore = getTeamScore(match, getCompetitorId(home))
  const awayScore = getTeamScore(match, getCompetitorId(away))
  const statusInfo = STATUS_STYLE[match.status] || STATUS_STYLE.PROGRAMADO

  const eventLabelMap = useMemo(() => {
    const map = {}
    for (const e of sport?.validEvents || []) map[e.code] = e.label
    return map
  }, [sport])

  const eventsByCompetitor = useMemo(() => {
    const groups = {}
    for (const comp of match.competitors || []) {
      groups[String(getCompetitorId(comp))] = []
    }
    const global = []

    for (const ev of match.keyEvents || []) {
      const label = eventLabelMap[ev.eventType] || ev.eventType

      // Buscar nombre del jugador en el lineUp del competidor si está disponible
      let playerName = ev.playerName || null
      if (!playerName && ev.playerId && ev.competitorId) {
        const comp = match.competitors?.find(
          (c) => String(getCompetitorId(c)) === String(ev.competitorId)
        )
        const lineUpMember = comp?.lineUp?.find(
          (p) => String(p.userId ?? p._id) === String(ev.playerId)
        )
        if (lineUpMember?.fullName) {
          playerName = lineUpMember.fullName
        }
      }

      const item = {
        key: `${ev.eventType}-${ev.competitorId || 'global'}-${groups[String(ev.competitorId)]?.length || global.length}`,
        eventType: ev.eventType,
        label,
        incrementScore: ev.incrementScore || 0,
        minute: ev.minute,
        playerId: ev.playerId,
        playerName,
      }

      if (ev.competitorId && groups[String(ev.competitorId)]) {
        groups[String(ev.competitorId)].push(item)
      } else {
        global.push(item)
      }
    }
    return { byCompetitor: groups, global }
  }, [match, eventLabelMap])

  const roundName = tournament?.rounds?.find(
    (r) => String(r._id) === String(match.round?.roundId) || r.roundNumber === match.round?.number
  )?.roundName

  if (!tournament || !match) return null

  return (
    <Box sx={{ mt: 2 }}>
      <IconButton onClick={() => navigate(`/tournament/${tournament._id}`)} sx={{ mb: 1, color: 'grey.400' }}>
        <ArrowBackIcon />
      </IconButton>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="body2" sx={{ color: 'grey.500' }}>
            {tournament.title} {roundName ? `· ${roundName}` : ''}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Detalle del partido
          </Typography>
        </Box>
        <Chip
          label={statusInfo.label}
          size="small"
          sx={{ bgcolor: statusInfo.color, color: '#000', fontWeight: 600 }}
        />
      </Stack>

      <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid', borderColor: 'divider', mb: 4 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ py: 2 }}>
            <Box sx={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              <CompetitorPhoto
                logoURL={home?.logoURLSnapshot}
                displayName={home?.displayNameSnapshot}
                size={64}
              />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {home?.displayNameSnapshot || 'Local'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', minWidth: 110 }}>
              {match.status === 'PROGRAMADO' ? (
                <Typography variant="h4" sx={{ color: 'grey.500', fontFamily: 'monospace' }}>vs</Typography>
              ) : (
                <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                  {homeScore} - {awayScore}
                </Typography>
              )}
              <Typography variant="caption" sx={{ color: 'grey.600', display: 'block', mt: 0.5 }}>
                {sport?.name || 'Deporte'}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
              <CompetitorPhoto
                logoURL={away?.logoURLSnapshot}
                displayName={away?.displayNameSnapshot}
                size={64}
              />
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {away?.displayNameSnapshot || 'Visitante'}
              </Typography>
            </Box>
          </Stack>
          <Divider sx={{ my: 1 }} />
          <Stack direction="row" justifyContent="center" spacing={3} sx={{ pt: 1, flexWrap: 'wrap', rowGap: 1 }}>
            {match.startAt && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <CalendarTodayIcon fontSize="small" sx={{ color: 'grey.500' }} />
                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                  {new Date(match.startAt).toLocaleString('es-AR', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Typography>
              </Stack>
            )}
            {match.field?.name && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <PlaceIcon fontSize="small" sx={{ color: 'grey.500' }} />
                <Typography variant="body2" sx={{ color: 'grey.400' }}>{match.field.name}</Typography>
              </Stack>
            )}
            <Chip
              label={MATCH_STATUS_LABEL[match.status] || match.status}
              size="small"
              variant="outlined"
              sx={{ color: 'grey.400', borderColor: 'grey.700' }}
            />
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
        Eventos
      </Typography>
      <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid', borderColor: 'divider', mb: 4 }}>
        <CardContent>
          {!match.keyEvents?.length ? (
            <Typography variant="body2" sx={{ color: 'grey.500', py: 2, textAlign: 'center' }}>
              Sin eventos cargados
            </Typography>
          ) : (
            <Stack spacing={2}>
              {match.competitors?.map((comp) => {
                const compId = getCompetitorId(comp)
                const events = eventsByCompetitor.byCompetitor[String(compId)] || []
                return (
                  <Box key={String(compId)}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <CompetitorPhoto
                        logoURL={comp.logoURLSnapshot}
                        displayName={comp.displayNameSnapshot}
                        size={24}
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {comp.displayNameSnapshot || compId}
                      </Typography>
                    </Stack>
                    {events.length === 0 ? (
                      <Typography variant="caption" sx={{ color: 'grey.600' }}>
                        Sin eventos
                      </Typography>
                    ) : (
                      <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', rowGap: 0.8 }}>
                        {events.map((ev) => {
                          const isGoal = ev.eventType.toUpperCase().includes('GOL')
                          const isYellow = ev.eventType.toUpperCase().includes('AMARILLA')
                          const isRed = ev.eventType.toUpperCase().includes('ROJA')
                          const iconPrefix = isGoal ? '⚽ ' : isYellow ? '🟨 ' : isRed ? '🟥 ' : ''
                          const playerText = ev.playerName ? ` (${ev.playerName})` : ''

                          return (
                            <Chip
                              key={ev.key}
                              label={`${iconPrefix}${ev.label}${ev.minute != null ? ` ${ev.minute}'` : ''}${playerText}`}
                              size="small"
                              sx={{
                                bgcolor: '#2a2a2a',
                                color: 'grey.200',
                                fontSize: '0.75rem',
                                '& .MuiChip-label': { px: 1 },
                              }}
                            />
                          )
                        })}
                      </Stack>
                    )}
                  </Box>
                )
              })}
              {eventsByCompetitor.global.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>Generales</Typography>
                  <Stack direction="row" spacing={0.8} sx={{ flexWrap: 'wrap', rowGap: 0.8 }}>
                    {eventsByCompetitor.global.map((ev) => (
                      <Chip
                        key={ev.key}
                        label={ev.label}
                        size="small"
                        sx={{ bgcolor: '#2a2a2a', color: 'grey.300', fontSize: '0.75rem' }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </CardContent>
      </Card>

      {isOrganizer && (
        <Stack direction="row" justifyContent="center" sx={{ mb: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<EmojiEventsIcon />}
            onClick={() => setSheetOpen(true)}
            sx={{ px: 4 }}
          >
            {match.status === 'FINALIZADO' ? 'Editar planilla' : 'Cargar planilla'}
          </Button>
        </Stack>
      )}

      <MatchSheetDialog
        open={sheetOpen}
        match={match}
        sportConfig={sport}
        onClose={() => setSheetOpen(false)}
      />
    </Box>
  )
}

export default MatchDetail