import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container, Typography, Box, TextField, Button,
  FormControl, FormLabel, Select, MenuItem, Alert,
  Card, Stack, Grid,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import Navbar from '../components/layout/Navbar'
import { useAuth } from '../hooks/useAuth'
import { useSports } from '../hooks/useSportsConfig'
import { createTournament, putTournament } from '../data/tournaments'

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '700px',
  },
}))

const FORMATS = [
  { value: 'SINGLE_ELIMINATION', label: 'Eliminación Simple' },
  { value: 'DOUBLE_ELIMINATION', label: 'Doble Eliminación' },
  { value: 'ROUND_ROBIN', label: 'Todos contra todos' },
  { value: 'SWISS', label: 'Suizo' },
]

function CreateTournament() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const sports = useSports()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    sportConfigId: '',
    format: 'SINGLE_ELIMINATION',
    isOnline: false,
    city: '',
    country: '',
    maxRegistrations: '',
    startDate: '',
    endDate: '',
    entryFee: '',
    prizes: '',
    contactMail: '',
    contactPhone: '',
    registrationCloseAt: '',
  })

  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => ({ ...prev, [field]: false }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'El título es requerido'
    if (!form.sportConfigId) errs.sportConfigId = 'Seleccioná un deporte'
    if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate))
      errs.endDate = 'La fecha de fin debe ser posterior al inicio'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        sportConfigId: form.sportConfigId,
        organizerId: user._id,
        rules: { format: form.format },
        location: { city: form.city.trim(), country: form.country.trim() },
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        entryFee: form.entryFee ? Number(form.entryFee) : 0,
        prizes: form.prizes.trim(),
        contactMail: form.contactMail.trim(),
        contactPhone: form.contactPhone.trim(),
        maxRegistrations: form.maxRegistrations ? Number(form.maxRegistrations) : 0,
        registrationCloseAt: form.registrationCloseAt || undefined,
      }

      const tournament = await createTournament(payload)
      await putTournament(tournament)
      navigate(`/tournament/${tournament._id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container>
        <Stack spacing={2} sx={{ mt: 8, mb: 4 }}>
          <Typography variant="h3" sx={{ textAlign: 'center' }}>
            Crear Torneo
          </Typography>

          <StyledCard variant="outlined" component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error">{error}</Alert>}

            <Typography variant="h6">Información básica</Typography>

            <FormControl>
              <FormLabel>Título</FormLabel>
              <TextField
                value={form.title}
                onChange={handleChange('title')}
                error={!!fieldErrors.title}
                helperText={fieldErrors.title}
                placeholder="Nombre del torneo"
                fullWidth
                variant="outlined"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Descripción</FormLabel>
              <TextField
                value={form.description}
                onChange={handleChange('description')}
                placeholder="Descripción del torneo"
                fullWidth
                multiline
                rows={3}
                variant="outlined"
              />
            </FormControl>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel>Deporte</FormLabel>
                  <Select
                    value={form.sportConfigId}
                    onChange={handleChange('sportConfigId')}
                    error={!!fieldErrors.sportConfigId}
                    displayEmpty
                  >
                    <MenuItem value="" disabled>Seleccioná un deporte</MenuItem>
                    {sports.map((s) => (
                      <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>
                    ))}
                  </Select>
                  {fieldErrors.sportConfigId && (
                    <Typography variant="caption" color="error">{fieldErrors.sportConfigId}</Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel>Formato</FormLabel>
                  <Select value={form.format} onChange={handleChange('format')}>
                    {FORMATS.map((f) => (
                      <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 2 }}>Ubicación</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel>Ciudad</FormLabel>
                  <TextField
                    value={form.city}
                    onChange={handleChange('city')}
                    placeholder="Ciudad"
                    fullWidth
                    variant="outlined"
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel>País</FormLabel>
                  <TextField
                    value={form.country}
                    onChange={handleChange('country')}
                    placeholder="País"
                    fullWidth
                    variant="outlined"
                  />
                </FormControl>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 2 }}>Fechas</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel>Fecha de inicio</FormLabel>
                  <TextField
                    value={form.startDate}
                    onChange={handleChange('startDate')}
                    type="date"
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel>Fecha de fin</FormLabel>
                  <TextField
                    value={form.endDate}
                    onChange={handleChange('endDate')}
                    type="date"
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                    error={!!fieldErrors.endDate}
                    helperText={fieldErrors.endDate}
                  />
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel>Cierre de inscripción</FormLabel>
                  <TextField
                    value={form.registrationCloseAt}
                    onChange={handleChange('registrationCloseAt')}
                    type="date"
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel>Cupo máximo</FormLabel>
                  <TextField
                    value={form.maxRegistrations}
                    onChange={handleChange('maxRegistrations')}
                    type="number"
                    placeholder="0 = sin límite"
                    fullWidth
                    variant="outlined"
                  />
                </FormControl>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 2 }}>Contacto</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel>Email de contacto</FormLabel>
                  <TextField
                    value={form.contactMail}
                    onChange={handleChange('contactMail')}
                    placeholder="email@ejemplo.com"
                    type="email"
                    fullWidth
                    variant="outlined"
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel>Teléfono</FormLabel>
                  <TextField
                    value={form.contactPhone}
                    onChange={handleChange('contactPhone')}
                    placeholder="Teléfono"
                    fullWidth
                    variant="outlined"
                  />
                </FormControl>
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mt: 2 }}>Extras</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel>Costo de inscripción</FormLabel>
                  <TextField
                    value={form.entryFee}
                    onChange={handleChange('entryFee')}
                    type="number"
                    placeholder="0 = gratuito"
                    fullWidth
                    variant="outlined"
                  />
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <FormLabel>Premios</FormLabel>
                  <TextField
                    value={form.prizes}
                    onChange={handleChange('prizes')}
                    placeholder="Descripción de premios"
                    fullWidth
                    variant="outlined"
                  />
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={() => navigate('/dashboard/tournaments')} variant="outlined">
                Cancelar
              </Button>
              <Button type="submit" variant="contained" color="primary" disabled={loading}>
                {loading ? 'Creando…' : 'Crear Torneo'}
              </Button>
            </Box>
          </StyledCard>
        </Stack>
      </Container>
    </Box>
  )
}

export default CreateTournament
