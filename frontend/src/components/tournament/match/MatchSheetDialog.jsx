import { useEffect, useMemo, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Box, Typography, Stack, IconButton, Divider, Alert, Chip, CircularProgress,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import SportsScoreIcon from '@mui/icons-material/SportsScore'
import CompetitorPhoto from '../../shared/CompetitorPhoto'
import { updateMatchSheet } from '../../../data/matches.js'
import {
  MATCH_STATUS_LABEL, STATUS_STYLE,
  buildSheetFromMatch, buildKeyEventsFromSheet,
} from './matchUtils'

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

// Planilla "cerrada" multideporte: los controles se generan a partir de sportConfig.validEvents
// (eventos que suman al score por equipo + eventos globales sin equipo). Se guarda todo de una
// con updateMatchSheet (online directo / offline a cola) y el partido pasa a FINALIZADO.
function MatchSheetDialog({ open, match, sportConfig, onClose }) {
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [sheet, setSheet] = useState(null)

  const competitors = match?.competitors || []
  const validEvents = sportConfig?.validEvents || []
  const competitorEvents = validEvents.filter((e) => e.targetField === 'COMPETITOR')
  const playerEvents = validEvents.filter((e) => e.targetField !== 'COMPETITOR')
  const statusInfo = STATUS_STYLE[match?.status] || STATUS_STYLE.PROGRAMADO

  const initialSheet = useMemo(
    () => (match && sportConfig ? buildSheetFromMatch(match, sportConfig) : null),
    [match, sportConfig]
  )

  // Cargamos la planilla al abrir el diálogo (para reflejar los keyEvents ya guardados)
  const [hasOpened, setHasOpened] = useState(false)
  useEffect(() => {
    if (open) {
      if (!hasOpened && initialSheet) {
        setSheet(initialSheet)
        setHasOpened(true)
        setError('')
      }
    } else if (hasOpened) {
      setHasOpened(false)
      setSheet(null)
    }
  }, [open, hasOpened, initialSheet])

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

  const handleSave = async () => {
    if (!match || !currentSheet) return
    setError('')
    setSaving(true)
    try {
      const keyEvents = buildKeyEventsFromSheet(currentSheet, match, sportConfig)
      const updatedMatch = {
        ...match,
        sportConfigId: typeof match.sportConfigId === 'string' ? match.sportConfigId : match.sportConfigId?._id,
        status: 'FINALIZADO',
        keyEvents,
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

      <DialogContent dividers>
        {!isVersus ? (
          <Alert severity="info">
            La planilla aún no está disponible para este tipo de ejecución (
            {sportConfig?.sportProps?.matchExecution || 'desconocido'}).
          </Alert>
        ) : (
          <Stack spacing={2}>
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
                    const key = `${event.code}__${comp.teamId}`
                    return (
                      <Box key={String(comp.teamId)} sx={{ flex: 1, minWidth: 0 }}>
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
                            {comp.displayNameSnapshot || comp.teamId}
                          </Typography>
                        </Stack>
                        <EventCounter
                          label={event.label}
                          count={currentSheet?.byEvent[key] || 0}
                          onChange={(v) => setCount(event.code, comp.teamId, v)}
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
