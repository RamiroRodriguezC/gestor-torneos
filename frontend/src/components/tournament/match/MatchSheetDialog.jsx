import { useEffect, useMemo, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Stack, IconButton, Divider, Alert, Chip, CircularProgress,
  TextField, Select, MenuItem, FormControl, InputLabel, Tab, Tabs,
  List, ListItem, ListItemText, ListItemSecondaryAction, Avatar,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import DeleteIcon from '@mui/icons-material/Delete'
import SportsScoreIcon from '@mui/icons-material/SportsScore'
import PersonIcon from '@mui/icons-material/Person'
import CompetitorPhoto from '../../shared/CompetitorPhoto'
import { updateMatchSheet } from '../../../data/matches.js'
import { db } from '../../../lib/db.js'
import {
  MATCH_STATUS_LABEL, STATUS_STYLE,
  buildSheetFromMatch, buildKeyEventsFromSheet,
} from './matchUtils'

const getCompetitorId = (c) => c?.participantId ?? c?.teamId

function EventCounter({ label, count, onChange, color = '#00e676' }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 0.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <IconButton
          size="small"
          onClick={() => onChange(Math.max(0, count - 1))}
          disabled={count <= 0}
          sx={{ color: 'grey.400', border: '1px solid', borderColor: 'divider' }}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ minWidth: 28, textAlign: 'center', fontWeight: 700 }}>{count}</Typography>
        <IconButton
          size="small"
          onClick={() => onChange(count + 1)}
          sx={{ color, border: '1px solid', borderColor: 'divider' }}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Stack>
  )
}

function MatchSheetDialog({ open, match, sportConfig, onClose }) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState(0) // 0: Detallado (Minuto a minuto), 1: Rápido (Contadores)
  const [sheet, setSheet] = useState(null)
  const [keyEvents, setKeyEvents] = useState([])

  // Formulario para nuevo evento en modo detallado
  const [selectedEventType, setSelectedEventType] = useState('')
  const [selectedCompetitorId, setSelectedCompetitorId] = useState('')
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [minute, setMinute] = useState('')

  // Mapas de jugadores por competidor: { [competitorId]: Array<{ userId, fullName, photoURL }> }
  const [teamMembersMap, setTeamMembersMap] = useState({})

  const competitors = match?.competitors || []
  const validEvents = sportConfig?.validEvents || []
  const isTeamSport = sportConfig?.sportProps?.participantType === 'TEAM'
  const statusInfo = STATUS_STYLE[match?.status] || STATUS_STYLE.PROGRAMADO

  // Cargar miembros del plantel de cada competidor
  useEffect(() => {
    let isMounted = true

    async function loadMembers() {
      if (!open || !match?.competitors) return
      const map = {}

      for (const comp of match.competitors) {
        const compId = String(getCompetitorId(comp))
        // 1. Si el competidor ya tiene lineup definido en el match
        if (comp.lineUp && comp.lineUp.length > 0) {
          map[compId] = comp.lineUp.map((p) => ({
            userId: String(p.userId ?? p._id),
            fullName: p.fullName || 'Jugador',
            photoURL: p.photoURL || '',
          }))
          continue
        }

        // 2. Si es deporte por equipos, buscamos en Dexie db.teams y db.users
        if (isTeamSport && compId) {
          try {
            const team = await db.teams.get(compId)
            if (team && Array.isArray(team.members) && team.members.length > 0) {
              const userIds = team.members.map((m) => String(m.userId)).filter(Boolean)
              const users = await db.users.where('_id').anyOf(userIds).toArray()
              const usersById = new Map(users.map((u) => [String(u._id), u]))

              map[compId] = userIds.map((uId) => {
                const u = usersById.get(uId)
                return {
                  userId: uId,
                  fullName: u ? `${u.name} ${u.lastName}`.trim() : `Jugador (${uId.slice(-4)})`,
                  photoURL: u?.url_profile_photo || '',
                }
              })
              continue
            }
          } catch (e) {
            console.error('Error cargando miembros para competidor:', compId, e)
          }
        }

        // 3. Deporte individual o participante único
        map[compId] = [
          {
            userId: compId,
            fullName: comp.displayNameSnapshot || 'Participante',
            photoURL: comp.logoURLSnapshot || '',
          },
        ]
      }

      if (isMounted) {
        setTeamMembersMap(map)
      }
    }

    loadMembers()

    return () => {
      isMounted = false
    }
  }, [open, match, isTeamSport])

  const initialSheet = useMemo(
    () => (match && sportConfig ? buildSheetFromMatch(match, sportConfig) : null),
    [match, sportConfig]
  )

  const [hasOpened, setHasOpened] = useState(false)
  useEffect(() => {
    if (open) {
      if (!hasOpened) {
        setSheet(initialSheet)
        setKeyEvents(match?.keyEvents ? [...match.keyEvents] : [])
        if (validEvents.length > 0) setSelectedEventType(validEvents[0].code)
        if (competitors.length > 0) setSelectedCompetitorId(String(getCompetitorId(competitors[0])) || '')
        setSelectedPlayerId('')
        setMinute('')
        setHasOpened(true)
        setError('')
      }
    } else if (hasOpened) {
      setHasOpened(false)
      setSheet(null)
      setKeyEvents([])
    }
  }, [open, hasOpened, initialSheet, match, validEvents, competitors])

  const currentSheet = sheet ?? initialSheet

  const setCount = (eventType, competitorId, value) => {
    if (!currentSheet) return
    const next = { ...currentSheet, byEvent: { ...currentSheet.byEvent } }
    next.byEvent[`${eventType}__${competitorId}`] = value
    setSheet(next)
  }

  const setGlobalCount = (eventType, value) => {
    if (!currentSheet) return
    setSheet({
      ...currentSheet,
      globalByEvent: { ...currentSheet.globalByEvent, [eventType]: value },
    })
  }

  const isVersus = sportConfig?.sportProps?.matchExecution === 'VERSUS'

  // Lista de jugadores elegibles para el competidor seleccionado actualmente
  const availablePlayers = selectedCompetitorId ? (teamMembersMap[selectedCompetitorId] || []) : []

  const handleAddDetailedEvent = () => {
    if (!selectedEventType) return
    const eventDef = validEvents.find((e) => e.code === selectedEventType)

    let playerObj = null
    if (selectedCompetitorId && selectedPlayerId) {
      playerObj = availablePlayers.find((p) => String(p.userId) === String(selectedPlayerId))
    }

    const newEv = {
      eventType: selectedEventType,
      competitorId: selectedCompetitorId || undefined,
      playerId: selectedPlayerId || undefined,
      playerName: playerObj ? playerObj.fullName : undefined,
      playerPhotoURL: playerObj ? playerObj.photoURL : undefined,
      minute: minute !== '' ? Number(minute) : undefined,
      incrementScore: eventDef?.incrementScore || 0,
    }
    setKeyEvents((prev) => [...prev, newEv])
    setMinute('')
    setSelectedPlayerId('')
  }

  const handleDeleteEvent = (index) => {
    setKeyEvents((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!match) return
    setError('')
    setSaving(true)
    try {
      let finalKeyEvents = []
      if (tab === 1) {
        // Modo rápido (contadores)
        finalKeyEvents = buildKeyEventsFromSheet(currentSheet, match, sportConfig)
      } else {
        // Modo detallado (lista de eventos ordenados por minuto)
        finalKeyEvents = [...keyEvents].sort((a, b) => (a.minute || 0) - (b.minute || 0))
      }

      // Reconstruir o completar lineUp en competitors si no lo tenían
      const updatedCompetitors = (match.competitors || []).map((comp) => {
        const compId = String(getCompetitorId(comp))
        const existingLineUp = comp.lineUp && comp.lineUp.length > 0 ? comp.lineUp : []
        if (existingLineUp.length > 0) return comp

        const discovered = teamMembersMap[compId] || []
        if (discovered.length > 0) {
          return {
            ...comp,
            lineUp: discovered.map((d) => ({
              userId: d.userId,
              fullName: d.fullName,
              photoURL: d.photoURL || '',
            })),
          }
        }
        return comp
      })

      const updatedMatch = {
        ...match,
        sportConfigId: typeof match.sportConfigId === 'string' ? match.sportConfigId : match.sportConfigId?._id,
        status: 'FINALIZADO',
        keyEvents: finalKeyEvents,
        competitors: updatedCompetitors,
      }
      await updateMatchSheet(match._id, updatedMatch)
      onClose()
    } catch (err) {
      setError(err.message || 'No se pudo guardar la planilla.')
    } finally {
      setSaving(false)
    }
  }

  const getEventLabel = (code) => {
    const found = validEvents.find((e) => e.code === code)
    return found ? found.label : code
  }

  const getCompetitorLabel = (compId) => {
    if (!compId) return 'General'
    const comp = competitors.find((c) => String(getCompetitorId(c)) === String(compId))
    return comp?.displayNameSnapshot || compId
  }

  const resolvePlayerName = (ev) => {
    if (!ev.playerId) return null
    if (ev.playerName) return ev.playerName
    const compId = String(ev.competitorId)
    const players = teamMembersMap[compId] || []
    const matchLineUp = competitors.find((c) => String(getCompetitorId(c)) === compId)?.lineUp || []
    const foundLineUp = matchLineUp.find((p) => String(p.userId ?? p._id) === String(ev.playerId))
    if (foundLineUp?.fullName) return foundLineUp.fullName
    const found = players.find((p) => String(p.userId) === String(ev.playerId))
    return found ? found.fullName : null
  }

  const competitorEvents = validEvents.filter((e) => e.targetField === 'COMPETITOR')
  const playerEvents = validEvents.filter((e) => e.targetField !== 'COMPETITOR')

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <SportsScoreIcon sx={{ color: '#00e676' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {match?.status === 'FINALIZADO' ? 'Corregir planilla' : 'Cargar planilla'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'grey.500' }}>
              {sportConfig?.name || 'Deporte'}
            </Typography>
          </Box>
        </Stack>
        <Chip
          label={statusInfo.label}
          size="small"
          sx={{ bgcolor: statusInfo.color, color: '#000', fontWeight: 600, fontSize: '0.65rem', height: 20 }}
        />
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tab} onChange={(_, val) => setTab(val)} variant="fullWidth">
          <Tab label="Minuto a Minuto (Con Jugadores)" />
          <Tab label="Carga Rápida (Contadores)" />
        </Tabs>
      </Box>

      <DialogContent dividers>
        {!isVersus ? (
          <Alert severity="info">
            La planilla aún no está disponible para este tipo de ejecución (
            {sportConfig?.sportProps?.matchExecution || 'desconocido'}).
          </Alert>
        ) : (
          <Stack spacing={2}>
            {tab === 0 ? (
              /* TAB DETALLADO: MINUTO A MINUTO */
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#00e676' }}>
                  Agregar Evento al Partido
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <FormControl size="small" sx={{ flex: 1.2, minWidth: 140 }}>
                    <InputLabel>Evento</InputLabel>
                    <Select
                      value={selectedEventType}
                      label="Evento"
                      onChange={(e) => setSelectedEventType(e.target.value)}
                    >
                      {validEvents.map((ev) => (
                        <MenuItem key={ev.code} value={ev.code}>
                          {ev.label} {ev.incrementScore > 0 ? `(+${ev.incrementScore})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ flex: 1.4, minWidth: 150 }}>
                    <InputLabel>Participante / Equipo</InputLabel>
                    <Select
                      value={selectedCompetitorId}
                      label="Participante / Equipo"
                      onChange={(e) => {
                        setSelectedCompetitorId(e.target.value)
                        setSelectedPlayerId('')
                      }}
                    >
                      <MenuItem value="">General / Ninguno</MenuItem>
                      {competitors.map((comp) => {
                        const compId = String(getCompetitorId(comp))
                        return (
                          <MenuItem key={compId} value={compId}>
                            {comp.displayNameSnapshot || compId}
                          </MenuItem>
                        )
                      })}
                    </Select>
                  </FormControl>

                  {/* Selector de Jugador / Miembro del Lineup */}
                  <FormControl size="small" sx={{ flex: 1.6, minWidth: 160 }} disabled={!selectedCompetitorId}>
                    <InputLabel>Jugador</InputLabel>
                    <Select
                      value={selectedPlayerId}
                      label="Jugador"
                      onChange={(e) => setSelectedPlayerId(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Sin especificar / Equipo</em>
                      </MenuItem>
                      {availablePlayers.map((player) => (
                        <MenuItem key={player.userId} value={player.userId}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar
                              src={player.photoURL}
                              sx={{ width: 20, height: 20, fontSize: '0.75rem' }}
                            >
                              <PersonIcon fontSize="small" />
                            </Avatar>
                            <Typography variant="body2">{player.fullName}</Typography>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    label="Minuto"
                    type="number"
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    sx={{ width: { xs: '100%', sm: 80 } }}
                  />

                  <Button
                    variant="contained"
                    color="primary"
                    size="medium"
                    onClick={handleAddDetailedEvent}
                    disabled={!selectedEventType}
                    startIcon={<AddIcon />}
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                  >
                    Agregar
                  </Button>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Línea de Tiempo de Eventos ({keyEvents.length})
                </Typography>

                {keyEvents.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'grey.500', py: 2, textAlign: 'center' }}>
                    No hay eventos registrados. Usa el formulario superior para agregar goles o tarjetas.
                  </Typography>
                ) : (
                  <List dense sx={{ bgcolor: '#1e1e1e', borderRadius: 1 }}>
                    {keyEvents.map((ev, index) => {
                      const playerName = resolvePlayerName(ev)
                      const isGoal = ev.eventType.toUpperCase().includes('GOL')
                      const isYellow = ev.eventType.toUpperCase().includes('AMARILLA')
                      const isRed = ev.eventType.toUpperCase().includes('ROJA')

                      return (
                        <ListItem key={index} divider={index < keyEvents.length - 1}>
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                {ev.minute != null && (
                                  <Chip
                                    label={`${ev.minute}'`}
                                    size="small"
                                    sx={{ bgcolor: '#333', color: '#00e676', fontWeight: 700, height: 22 }}
                                  />
                                )}
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {isGoal ? '⚽ ' : isYellow ? '🟨 ' : isRed ? '🟥 ' : ''}
                                  {getEventLabel(ev.eventType)}
                                </Typography>
                                {ev.incrementScore > 0 && (
                                  <Typography variant="caption" sx={{ color: 'grey.400' }}>
                                    (+{ev.incrementScore})
                                  </Typography>
                                )}
                                {playerName ? (
                                  <Chip
                                    icon={<PersonIcon sx={{ fontSize: '1rem !important' }} />}
                                    label={playerName}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 22, fontSize: '0.75rem', borderColor: 'rgba(255,255,255,0.2)' }}
                                  />
                                ) : (
                                  <Typography variant="caption" sx={{ color: 'grey.500', fontStyle: 'italic' }}>
                                    (Sin especificar jugador)
                                  </Typography>
                                )}
                              </Stack>
                            }
                            secondary={`Equipo / Participante: ${getCompetitorLabel(ev.competitorId)}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton edge="end" size="small" onClick={() => handleDeleteEvent(index)} sx={{ color: 'error.main' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      )
                    })}
                  </List>
                )}
              </Box>
            ) : (
              /* TAB RAPIDO: CONTADORES */
              <Box>
                {competitorEvents.length === 0 && playerEvents.length === 0 && (
                  <Alert severity="info">
                    Este deporte no tiene eventos configurables para la planilla.
                  </Alert>
                )}

                {competitorEvents.map((event) => (
                  <Box key={event.code}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#00e676', mb: 0.5 }}>
                      {event.label}
                      {event.incrementScore > 0 && (
                        <Typography component="span" variant="caption" sx={{ color: 'grey.500', ml: 1 }}>
                          +{event.incrementScore} al marcador
                        </Typography>
                      )}
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                      {competitors.map((comp) => {
                        const compId = getCompetitorId(comp)
                        const key = `${event.code}__${compId}`
                        return (
                          <Box key={String(compId)} sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                              <CompetitorPhoto
                                logoURL={comp.logoURLSnapshot}
                                displayName={comp.displayNameSnapshot}
                                size={20}
                              />
                              <Typography
                                variant="caption"
                                sx={{ color: 'grey.400', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              >
                                {comp.displayNameSnapshot || compId}
                              </Typography>
                            </Stack>
                            <EventCounter
                              label={event.label}
                              count={currentSheet?.byEvent[key] || 0}
                              onChange={(v) => setCount(event.code, compId, v)}
                            />
                          </Box>
                        )
                      })}
                    </Stack>
                  </Box>
                ))}

                {competitorEvents.length > 0 && playerEvents.length > 0 && (
                  <Divider sx={{ my: 1 }} />
                )}

                {playerEvents.map((event) => (
                  <EventCounter
                    key={event.code}
                    label={`${event.label} (general)`}
                    count={currentSheet?.globalByEvent[event.code] || 0}
                    onChange={(v) => setGlobalCount(event.code, v)}
                    color="#ff6d00"
                  />
                ))}
              </Box>
            )}

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>

      {isVersus && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Typography variant="body2" sx={{ color: 'grey.500', mr: 'auto' }}>
            {MATCH_STATUS_LABEL.FINALIZADO} al guardar
          </Typography>
          <Button onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            onClick={handleSave}
            disabled={saving}
          >
            Guardar planilla
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}

export default MatchSheetDialog