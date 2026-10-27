import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Stack,
  Avatar,
  Box,
  CircularProgress,
} from '@mui/material'
import ShieldIcon from '@mui/icons-material/Shield'
import { useSports } from '../../hooks/useSportsConfig'
import { createTeam } from '../../data/teams'

function formatSportName(name = '') {
  return name.replace(/_/g, ' ')
}

function CreateTeamModal({ open, onClose, onSuccess }) {
  const sports = useSports()
  const teamSports = sports.filter(
    (s) => !s.sportProps || s.sportProps.participantType === 'TEAM'
  )

  const [name, setName] = useState('')
  const [discipline, setDiscipline] = useState('')
  const [logoURL, setLogoURL] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  // Limpiar campos al abrir
  useEffect(() => {
    if (open) {
      setName('')
      setLogoURL('')
      setError(null)
      setFieldErrors({})
      if (teamSports.length > 0) {
        setDiscipline((prev) => prev || teamSports[0]._id)
      }
    }
  }, [open, teamSports])

  const validate = () => {
    const errs = {}
    if (!name.trim()) errs.name = 'El nombre del equipo es requerido'
    if (!discipline) errs.discipline = 'Selecciona una disciplina deportiva'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setError(null)

    try {
      const payload = {
        name: name.trim(),
        discipline,
        logoURL: logoURL.trim() || '',
      }
      const created = await createTeam(payload)
      if (onSuccess) onSuccess(created)
      onClose()
    } catch (err) {
      setError(err.message || 'Error al crear el equipo. Inténtalo nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
        Crear Nuevo Equipo
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent dividers sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}

            {/* Vista previa de logo / escudo */}
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Avatar
                src={logoURL.trim() || undefined}
                variant="rounded"
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: '#262626',
                  color: 'primary.main',
                  fontSize: '1.8rem',
                  fontWeight: 700,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                {name.trim() ? name.trim().charAt(0).toUpperCase() : <ShieldIcon />}
              </Avatar>
              <Box>
                <Box sx={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {name.trim() || 'Nombre del equipo'}
                </Box>
                <Box sx={{ fontSize: '0.8rem', color: 'grey.500' }}>
                  {discipline
                    ? formatSportName(teamSports.find((s) => s._id === discipline)?.name)
                    : 'Seleccioná un deporte'}
                </Box>
              </Box>
            </Stack>

            <TextField
              label="Nombre del equipo"
              required
              fullWidth
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }))
              }}
              error={!!fieldErrors.name}
              helperText={fieldErrors.name}
              placeholder="Ej: Los Leones FC, Tigres del Norte"
            />

            <FormControl fullWidth required error={!!fieldErrors.discipline}>
              <InputLabel id="sport-select-label">Deporte / Disciplina</InputLabel>
              <Select
                labelId="sport-select-label"
                value={discipline}
                label="Deporte / Disciplina"
                onChange={(e) => {
                  setDiscipline(e.target.value)
                  if (fieldErrors.discipline) setFieldErrors((prev) => ({ ...prev, discipline: null }))
                }}
              >
                {teamSports.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {formatSportName(s.name)}
                    {s.sportProps?.maxParticipants ? ` (${s.sportProps.maxParticipants} vs ${s.sportProps.maxParticipants})` : ''}
                  </MenuItem>
                ))}
              </Select>
              {fieldErrors.discipline && (
                <FormHelperText>{fieldErrors.discipline}</FormHelperText>
              )}
            </FormControl>

            <TextField
              label="URL del escudo / logo (opcional)"
              fullWidth
              value={logoURL}
              onChange={(e) => setLogoURL(e.target.value)}
              placeholder="https://ejemplo.com/logo.png"
              helperText="Enlace público a una imagen cuadrada recomendada."
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={loading} color="inherit">
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {loading ? 'Creando...' : 'Crear Equipo'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export default CreateTeamModal
