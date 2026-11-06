import { useState, useMemo, useEffect } from 'react'
import Card from '@mui/material/Card'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import StadiumIcon from '@mui/icons-material/Stadium'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lun', fullName: 'Lunes' },
  { value: 2, label: 'Mar', fullName: 'Martes' },
  { value: 3, label: 'Mié', fullName: 'Miércoles' },
  { value: 4, label: 'Jue', fullName: 'Jueves' },
  { value: 5, label: 'Vie', fullName: 'Viernes' },
  { value: 6, label: 'Sáb', fullName: 'Sábado' },
  { value: 0, label: 'Dom', fullName: 'Domingo' },
]

export default function GenerateFixtureModal({
  open,
  onClose,
  tournament,
  fields = [],
  locationLabel = 'Canchas',
  onGenerate,
  busy = false,
}) {
  const [rounds, setRounds] = useState('single')
  const [startDate, setStartDate] = useState('')
  const [matchDays, setMatchDays] = useState([6, 0])
  const [startTime, setStartTime] = useState('14:00')
  const [endTime, setEndTime] = useState('21:00')
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(90)
  const [restDaysBetweenRounds, setRestDaysBetweenRounds] = useState(6)
  const [selectedFieldIds, setSelectedFieldIds] = useState([])
  const [validationError, setValidationError] = useState('')

  // Inicializar valores al abrir el modal o cambiar el torneo
  useEffect(() => {
    if (open && tournament) {
      setRounds(tournament.rules?.rounds || 'single')
      const initialDate = tournament.startDate
        ? new Date(tournament.startDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)
      setStartDate(initialDate)

      const savedSchedule = tournament.scheduleConfig || {}
      setMatchDays(
        Array.isArray(savedSchedule.matchDays) && savedSchedule.matchDays.length
          ? savedSchedule.matchDays
          : [6, 0]
      )
      setStartTime(savedSchedule.startTime || '14:00')
      setEndTime(savedSchedule.endTime || '21:00')
      setSlotDurationMinutes(savedSchedule.slotDurationMinutes || 90)
      setRestDaysBetweenRounds(savedSchedule.restDaysBetweenRounds ?? 6)

      // Por defecto seleccionar todas las canchas activas
      const activeFieldIds = fields.map((f) => f._id)
      if (Array.isArray(savedSchedule.fieldIds) && savedSchedule.fieldIds.length) {
        const intersection = savedSchedule.fieldIds.filter((id) => activeFieldIds.includes(id))
        setSelectedFieldIds(intersection.length ? intersection : activeFieldIds)
      } else {
        setSelectedFieldIds(activeFieldIds)
      }
      setValidationError('')
    }
  }, [open, tournament, fields])

  const toggleDay = (dayValue) => {
    setMatchDays((prev) => {
      if (prev.includes(dayValue)) {
        return prev.filter((d) => d !== dayValue)
      }
      return [...prev, dayValue]
    })
  }

  const toggleField = (fieldId) => {
    setSelectedFieldIds((prev) => {
      if (prev.includes(fieldId)) {
        return prev.filter((id) => id !== fieldId)
      }
      return [...prev, fieldId]
    })
  }

  const handleSelectAllFields = () => {
    if (selectedFieldIds.length === fields.length) {
      setSelectedFieldIds([])
    } else {
      setSelectedFieldIds(fields.map((f) => f._id))
    }
  }

  // Cálculos de capacidad y resumen del fixture
  const metrics = useMemo(() => {
    const participantsCount = tournament?.participantes?.length || 0
    if (participantsCount < 2) return null

    const matchesPerRound = Math.floor(participantsCount / 2)
    const baseRounds = participantsCount % 2 === 0 ? participantsCount - 1 : participantsCount
    const totalRounds = rounds === 'double' ? baseRounds * 2 : baseRounds
    const totalMatches = matchesPerRound * totalRounds

    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const startMinutes = (sh || 0) * 60 + (sm || 0)
    const endMinutes = (eh || 0) * 60 + (em || 0)

    const duration = Number(slotDurationMinutes) || 1
    const windowMinutes = Math.max(0, endMinutes - startMinutes)
    const slotsPerDay = duration > 0 ? Math.floor(windowMinutes / duration) : 0
    const fieldsCount = selectedFieldIds.length
    const dailyCapacity = slotsPerDay * fieldsCount

    const daysNeededPerRound = dailyCapacity > 0 ? Math.ceil(matchesPerRound / dailyCapacity) : 0

    return {
      participantsCount,
      matchesPerRound,
      totalRounds,
      totalMatches,
      slotsPerDay,
      fieldsCount,
      dailyCapacity,
      daysNeededPerRound,
      isTimeWindowValid: windowMinutes >= duration && slotsPerDay > 0,
    }
  }, [tournament, rounds, startTime, endTime, slotDurationMinutes, selectedFieldIds])

  const handleSubmit = async () => {
    setValidationError('')

    if (!startDate) {
      setValidationError('Ingresá una fecha de inicio válida.')
      return
    }
    if (!matchDays.length) {
      setValidationError('Seleccioná al menos un día permitido de juego (ej. Sábado o Domingo).')
      return
    }
    if (!selectedFieldIds.length) {
      setValidationError(`Seleccioná al menos una ${locationLabel.toLowerCase().slice(0, -1) || 'cancha'} para disputar los partidos.`)
      return
    }
    if (!metrics?.isTimeWindowValid) {
      setValidationError('La franja horaria no permite albergar ningún turno de la duración indicada.')
      return
    }

    try {
      await onGenerate({
        rounds,
        startDate,
        matchDays,
        startTime,
        endTime,
        slotDurationMinutes: Number(slotDurationMinutes),
        restDaysBetweenRounds: Number(restDaysBetweenRounds),
        fieldIds: selectedFieldIds,
      })
    } catch (err) {
      setValidationError(err.message || 'Error al generar el fixture')
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => !busy && onClose()}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#141414',
          border: '1px solid',
          borderColor: 'grey.800',
          borderRadius: 2.5,
          color: 'white',
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'grey.900', pb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <AutoAwesomeIcon sx={{ color: '#00e676', fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
              Parametrización y Generación de Fixture
            </Typography>
            <Typography variant="caption" sx={{ color: 'grey.400' }}>
              Configurá los días, horarios y espacios para armar el calendario de partidos sin colisiones.
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {validationError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setValidationError('')}>
            {validationError}
          </Alert>
        )}

        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Fila 1: Formato de Ruedas y Fecha de Inicio */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: 'grey.400', fontWeight: 600, display: 'block', mb: 1 }}>
                FORMATO DE COMPETICIÓN
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
                sx={{
                  bgcolor: '#1c1c1c',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.800' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.700' },
                }}
              >
                <MenuItem value="single">Rueda Simple (Solo Ida)</MenuItem>
                <MenuItem value="double">Doble Rueda (Ida y Vuelta)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: 'grey.400', fontWeight: 600, display: 'block', mb: 1 }}>
                FECHA DE INICIO DE LA 1° FECHA
              </Typography>
              <TextField
                type="date"
                fullWidth
                size="small"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  bgcolor: '#1c1c1c',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.800' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.700' },
                }}
              />
            </Grid>
          </Grid>

          {/* Días permitidos de juego */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <CalendarMonthIcon sx={{ color: '#00e676', fontSize: 18 }} />
              <Typography variant="caption" sx={{ color: 'grey.400', fontWeight: 600, textTransform: 'uppercase' }}>
                Días de Disputa Permitidos
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: 'grey.500', display: 'block', mb: 1.5 }}>
              Seleccioná los días de la semana en los que pueden programarse partidos.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = matchDays.includes(day.value)
                return (
                  <Chip
                    key={day.value}
                    label={day.fullName}
                    onClick={() => toggleDay(day.value)}
                    color={isSelected ? 'success' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    sx={{
                      fontWeight: 600,
                      cursor: 'pointer',
                      bgcolor: isSelected ? '#00e676' : '#1c1c1c',
                      color: isSelected ? '#000' : 'grey.400',
                      borderColor: isSelected ? '#00e676' : 'grey.800',
                      '&:hover': {
                        bgcolor: isSelected ? '#00c853' : 'grey.800',
                      },
                    }}
                  />
                )
              })}
            </Stack>
          </Box>

          {/* Franja horaria y duración del turno */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <AccessTimeIcon sx={{ color: '#00e676', fontSize: 18 }} />
              <Typography variant="caption" sx={{ color: 'grey.400', fontWeight: 600, textTransform: 'uppercase' }}>
                Franja Horaria y Turnos
              </Typography>
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" sx={{ color: 'grey.400', display: 'block', mb: 0.5 }}>
                  Hora Desde
                </Typography>
                <TextField
                  type="time"
                  fullWidth
                  size="small"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    bgcolor: '#1c1c1c',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.800' },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="caption" sx={{ color: 'grey.400', display: 'block', mb: 0.5 }}>
                  Hora Hasta
                </Typography>
                <TextField
                  type="time"
                  fullWidth
                  size="small"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    bgcolor: '#1c1c1c',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.800' },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="caption" sx={{ color: 'grey.400', display: 'block', mb: 0.5 }}>
                  Duración del Turno (min)
                </Typography>
                <TextField
                  type="number"
                  fullWidth
                  size="small"
                  value={slotDurationMinutes}
                  onChange={(e) => setSlotDurationMinutes(e.target.value)}
                  inputProps={{ min: 15, step: 15 }}
                  helperText="Incluye tiempo de partido y margen"
                  sx={{
                    bgcolor: '#1c1c1c',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.800' },
                    '& .MuiFormHelperText-root': { color: 'grey.500' },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Días de descanso entre fechas */}
          <Box>
            <Typography variant="caption" sx={{ color: 'grey.400', fontWeight: 600, textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
              Descanso Mínimo entre Jornadas (Días)
            </Typography>
            <TextField
              type="number"
              size="small"
              value={restDaysBetweenRounds}
              onChange={(e) => setRestDaysBetweenRounds(e.target.value)}
              inputProps={{ min: 0, max: 30 }}
              helperText="Días de descanso mínimos requeridos antes de disputar la siguiente fecha"
              sx={{
                maxWidth: 320,
                bgcolor: '#1c1c1c',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'grey.800' },
                '& .MuiFormHelperText-root': { color: 'grey.500' },
              }}
            />
          </Box>

          {/* Selección de Canchas disponibles */}
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <StadiumIcon sx={{ color: '#00e676', fontSize: 18 }} />
                <Typography variant="caption" sx={{ color: 'grey.400', fontWeight: 600, textTransform: 'uppercase' }}>
                  {locationLabel} Habilitadas para el Fixture
                </Typography>
              </Stack>
              {fields.length > 0 && (
                <Button
                  size="small"
                  onClick={handleSelectAllFields}
                  sx={{ color: '#00e676', textTransform: 'none', fontSize: 12, p: 0 }}
                >
                  {selectedFieldIds.length === fields.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                </Button>
              )}
            </Stack>

            {fields.length === 0 ? (
              <Alert severity="warning" icon={<WarningAmberIcon sx={{ color: '#ff9800' }} />} sx={{ bgcolor: 'rgba(255,152,0,0.08)' }}>
                No hay {locationLabel.toLowerCase()} registradas para este torneo. Creá al menos una desde la gestión de canchas.
              </Alert>
            ) : (
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                {fields.map((f) => {
                  const isChecked = selectedFieldIds.includes(f._id)
                  return (
                    <Grid item xs={12} sm={6} md={4} key={f._id}>
                      <Box
                        onClick={() => toggleField(f._id)}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1.5,
                          borderRadius: 1.5,
                          cursor: 'pointer',
                          bgcolor: isChecked ? 'rgba(0, 230, 118, 0.08)' : '#1c1c1c',
                          border: '1px solid',
                          borderColor: isChecked ? '#00e676' : 'grey.800',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            borderColor: isChecked ? '#00e676' : 'grey.700',
                          },
                        }}
                      >
                        <Checkbox
                          checked={isChecked}
                          size="small"
                          sx={{
                            p: 0,
                            color: 'grey.600',
                            '&.Mui-checked': { color: '#00e676' },
                          }}
                        />
                        <Box sx={{ overflow: 'hidden' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'white', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {f.name}
                          </Typography>
                          {f.location && (
                            <Typography variant="caption" sx={{ color: 'grey.400', display: 'block', fontSize: 11 }}>
                              {f.location}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>
            )}
          </Box>

          {/* Resumen y desglose en tiempo real */}
          {metrics && (
            <Card sx={{ bgcolor: 'rgba(0, 230, 118, 0.04)', border: '1px solid rgba(0, 230, 118, 0.2)', borderRadius: 2 }}>
              <Box sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <InfoOutlinedIcon sx={{ color: '#00e676', fontSize: 20 }} />
                  <Typography variant="subtitle2" sx={{ color: '#00e676', fontWeight: 700 }}>
                    Capacidad y Proyección del Calendario
                  </Typography>
                </Stack>

                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: 'grey.400', display: 'block' }}>
                      Partidos / Jornada
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'white' }}>
                      {metrics.matchesPerRound} encuentros
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: 'grey.400', display: 'block' }}>
                      Total Jornadas
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'white' }}>
                      {metrics.totalRounds} fechas ({metrics.totalMatches} partidos)
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: 'grey.400', display: 'block' }}>
                      Turnos por Día
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'white' }}>
                      {metrics.slotsPerDay} turnos
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" sx={{ color: 'grey.400', display: 'block' }}>
                      Capacidad Diaria
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#00e676' }}>
                      {metrics.dailyCapacity} partidos / día
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <Typography variant="body2" sx={{ color: 'grey.300' }}>
                    {metrics.dailyCapacity === 0 ? (
                      <span style={{ color: '#f85149' }}>
                        No hay capacidad suficiente configurada. Aumentá la franja horaria o seleccioná al menos una cancha.
                      </span>
                    ) : metrics.dailyCapacity >= metrics.matchesPerRound ? (
                      `✓ Cada jornada de ${metrics.matchesPerRound} partidos se completará en 1 solo día de juego con ${metrics.fieldsCount} cancha(s) en simultáneo.`
                    ) : (
                      `⚠️ Por capacidad horaria, cada jornada de ${metrics.matchesPerRound} partidos se repartirá a lo largo de ${metrics.daysNeededPerRound} días de juego permitidos consecutivos.`
                    )}
                  </Typography>
                </Box>
              </Box>
            </Card>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderColor: 'grey.900' }}>
        <Button
          onClick={onClose}
          disabled={busy}
          sx={{ color: 'grey.400', textTransform: 'none' }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="secondary"
          disabled={busy || !metrics?.dailyCapacity || !matchDays.length || !selectedFieldIds.length}
          onClick={handleSubmit}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
          sx={{
            fontWeight: 700,
            textTransform: 'none',
            px: 3,
            bgcolor: '#00e676',
            color: '#000',
            '&:hover': { bgcolor: '#00c853' },
            '&.Mui-disabled': { bgcolor: 'grey.800', color: 'grey.600' },
          }}
        >
          {busy ? 'Generando Fixture...' : 'Generar Fixture Oficial'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
