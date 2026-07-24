import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Card from '@mui/material/Card'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import { styled } from '@mui/material/styles'
import AppLogo from '../components/layout/AppLogo'
import { putUser } from '../data/users'
import { syncUserEnvironment } from '../data/userSync'
import { getApiBaseUrl } from '../utils/env.js'

const API = getApiBaseUrl()

const StyledCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '550px',
  },
}))

const Container = styled(Stack)(({ theme }) => ({
  minHeight: '100dvh',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
}))

const steps = ['Datos personales', 'Deportes de interés', 'Confirmar']

function Register() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sports, setSports] = useState([])
  const [sportsLoading, setSportsLoading] = useState(true)

  const [form, setForm] = useState({
    name: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    dateOfBirth: '',
    sportsInterests: [],
  })

  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    fetch(`${API}/sports`)
      .then((r) => r.json())
      .then((json) => {
        const data = json.data ?? json ?? []
        setSports(Array.isArray(data) ? data : [])
      })
      .catch(() => setSports([]))
      .finally(() => setSportsLoading(false))
  }, [])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setFieldErrors((prev) => ({ ...prev, [field]: false }))
  }

  const toggleSport = (sportId) => {
    setForm((prev) => {
      const has = prev.sportsInterests.includes(sportId)
      return {
        ...prev,
        sportsInterests: has
          ? prev.sportsInterests.filter((id) => id !== sportId)
          : [...prev.sportsInterests, sportId],
      }
    })
  }

  const validateStep1 = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'El nombre es requerido'
    if (!form.lastName.trim()) errs.lastName = 'El apellido es requerido'
    if (!form.username.trim()) errs.username = 'El nombre de usuario es requerido'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email))
      errs.email = 'Ingresá un email válido'
    if (!form.password || form.password.length < 6)
      errs.password = 'La contraseña debe tener al menos 6 caracteres'
    if (!form.dateOfBirth) errs.dateOfBirth = 'La fecha de nacimiento es requerida'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (activeStep === 0 && !validateStep1()) return
    setError(null)
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setError(null)
    setActiveStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          lastName: form.lastName.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          hashedPassword: form.password,
          dateOfBirth: form.dateOfBirth,
          sportsInterests: form.sportsInterests,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error?.message || 'Error al registrarse')
      }

      const { data } = await res.json()
      if (!data) throw new Error('No se pudo crear el usuario')

      const loginRes = await fetch(`${API}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      })

      if (!loginRes.ok) {
        navigate('/login')
        return
      }

      const { usuario, token } = await loginRes.json()
      localStorage.setItem('token', token)
      localStorage.setItem('currentUserId', usuario.id)
      await putUser({ _id: usuario.id, ...usuario })
      await syncUserEnvironment(usuario.id)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sportMap = Object.fromEntries(
    (sports || []).map((s) => [s._id, s.name])
  )

  return (
    <Container direction="column" sx={{ justifyContent: 'center' }}>
      <StyledCard variant="outlined">
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
          <AppLogo />
        </Box>
        <Typography variant="h4" sx={{ textAlign: 'center', mb: 2 }}>
          Crear cuenta
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl>
              <FormLabel>Nombre</FormLabel>
              <TextField
                value={form.name}
                onChange={handleChange('name')}
                error={!!fieldErrors.name}
                helperText={fieldErrors.name}
                placeholder="Tu nombre"
                fullWidth
                variant="outlined"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Apellido</FormLabel>
              <TextField
                value={form.lastName}
                onChange={handleChange('lastName')}
                error={!!fieldErrors.lastName}
                helperText={fieldErrors.lastName}
                placeholder="Tu apellido"
                fullWidth
                variant="outlined"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Nombre de usuario</FormLabel>
              <TextField
                value={form.username}
                onChange={handleChange('username')}
                error={!!fieldErrors.username}
                helperText={fieldErrors.username}
                placeholder="Tu nombre de usuario"
                fullWidth
                variant="outlined"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <TextField
                value={form.email}
                onChange={handleChange('email')}
                error={!!fieldErrors.email}
                helperText={fieldErrors.email}
                placeholder="tu@email.com"
                type="email"
                fullWidth
                variant="outlined"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Contraseña</FormLabel>
              <TextField
                value={form.password}
                onChange={handleChange('password')}
                error={!!fieldErrors.password}
                helperText={fieldErrors.password}
                placeholder="••••••"
                type="password"
                fullWidth
                variant="outlined"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Fecha de nacimiento</FormLabel>
              <TextField
                value={form.dateOfBirth}
                onChange={handleChange('dateOfBirth')}
                error={!!fieldErrors.dateOfBirth}
                helperText={fieldErrors.dateOfBirth}
                type="date"
                fullWidth
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </FormControl>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
              Seleccioná los deportes que te interesan para personalizar tu experiencia.
            </Typography>
            {sportsLoading ? (
              <Typography color="text.secondary">Cargando deportes...</Typography>
            ) : sports.length === 0 ? (
              <Typography color="text.secondary">
                No hay deportes disponibles. Podés seguir sin seleccionar.
              </Typography>
            ) : (
              <Grid container spacing={1}>
                {sports.map((sport) => {
                  const selected = form.sportsInterests.includes(sport._id)
                  return (
                    <Grid item key={sport._id}>
                      <Chip
                        label={sport.name}
                        clickable
                        color={selected ? 'primary' : 'default'}
                        variant={selected ? 'filled' : 'outlined'}
                        onClick={() => toggleSport(sport._id)}
                        icon={selected ? <Checkbox checked /> : undefined}
                      />
                    </Grid>
                  )
                })}
              </Grid>
            )}
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Revisá tus datos
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              <Typography><strong>Nombre:</strong> {form.name}</Typography>
              <Typography><strong>Apellido:</strong> {form.lastName}</Typography>
              <Typography><strong>Email:</strong> {form.email}</Typography>
              <Typography><strong>Fecha de nacimiento:</strong> {form.dateOfBirth}</Typography>
              <Typography>
                <strong>Deportes de interés:</strong>{' '}
                {form.sportsInterests.length === 0
                  ? 'Ninguno'
                  : form.sportsInterests
                      .map((id) => sportMap[id] || id)
                      .join(', ')}
              </Typography>
            </Box>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Anterior
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button onClick={handleNext} variant="contained" color="primary">
              Siguiente
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </Button>
          )}
        </Box>

        <Typography sx={{ textAlign: 'center', mt: 2, color: 'text.secondary' }}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" style={{ color: '#00e676' }}>
            Iniciá sesión
          </Link>
        </Typography>
      </StyledCard>
    </Container>
  )
}

export default Register
