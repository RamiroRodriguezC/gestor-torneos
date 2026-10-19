import { useEffect, useMemo, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Stack, IconButton, Divider, Alert, Chip, CircularProgress,
  TextField, Select, MenuItem, FormControl, InputLabel, Tab, Tabs,
  List, ListItem, ListItemText, ListItemSecondaryAction,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import DeleteIcon from '@mui/icons-material/Delete'
import SportsScoreIcon from '@mui/icons-material/SportsScore'
import CompetitorPhoto from '../../shared/CompetitorPhoto'
import { updateMatchSheet } from '../../../data/matches.js'
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
  const [minute, setMinute] = useState('')

  const competitors = match?.competitors || []
  const validEvents = sportConfig?.validEvents || []
  const competitorEvents = validEvents.filter((e) => e.targetField === 'COMPETITOR')
  const playerEvents = validEvents.filter((e) => e.targetField !== 'COMPETITOR')
  const statusInfo = STATUS_STYLE[match?.status] || STATUS_STYLE.PROGRAMADO

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
        if (competitors.length > 0) setSelectedCompetitorId(getCompetitorId(competitors[0]) || '')
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

  const handleAddDetailedEvent = () => {
    if (!selectedEventType) return
    const eventDef = validEvents.find((e) => e.code === selectedEventType)
    const newEv = {
      eventType: selectedEventType,
      competitorId: selectedCompetitorId || undefined,
      minute: minute !== '' ? Number(minute) : undefined,
      incrementScore: eventDef?.incrementScore || 0,
    }
    setKeyEvents((prev) => [...prev, newEv])
    setMinute('')
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

      const updatedMatch = {
        ...match,
        sportConfigId: typeof match.sportConfigId === 'string' ? match.sportConfigId : match.sportConfigId?._id,
        status: 'FINALIZADO',
        keyEvents: finalKeyEvents,
        competitors: match.competitors,
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
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
          <Tab label="Minuto a Minuto" />
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
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
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

                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Participante</InputLabel>
                    <Select
                      value={selectedCompetitorId}
                      label="Participante"
                      onChange={(e) => setSelectedCompetitorId(e.target.value)}
                    >
                      <MenuItem value="">General / Ninguno</MenuItem>
                      {competitors.map((comp) => {
                        const compId = getCompetitorId(comp)
                        return (
                          <MenuItem key={String(compId)} value={compId}>
                            {comp.displayNameSnapshot || compId}
                          </MenuItem>
                        )
                      })}
                    </Select>
                  </FormControl>

                  <TextField
                    size="small"
                    label="Minuto"
                    type="number"
                    value={minute}
                    onChange={(e) => setMinute(e.target.value)}
                    sx={{ width: 90 }}
                  />

                  <Button
                    variant="contained"
                    color="primary"
                    size="medium"
                    onClick={handleAddDetailedEvent}
                    disabled={!selectedEventType}
                    startIcon={<AddIcon />}
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
                    {keyEvents.map((ev, index) => (
                      <ListItem key={index} divider={index < keyEvents.length - 1}>
                        <ListItemText
                          primary={
                            <Stack direction="row" alignItems="center" spacing={1}>
                              {ev.minute != null && (
                                <Chip
                                  label={`${ev.minute}'`}
                                  size="small"
                                  sx={{ bgcolor: '#333', color: '#00e676', fontWeight: 700, height: 22 }}
                                />
                              )}
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {getEventLabel(ev.eventType)}
                              </Typography>
                              {ev.incrementScore > 0 && (
                                <Typography variant="caption" sx={{ color: 'grey.400' }}>
                                  (+{ev.incrementScore})
                                </Typography>
                              )}
                            </Stack>
                          }
                          secondary={`Participante: ${getCompetitorLabel(ev.competitorId)}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" size="small" onClick={() => handleDeleteEvent(index)} sx={{ color: 'error.main' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
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
