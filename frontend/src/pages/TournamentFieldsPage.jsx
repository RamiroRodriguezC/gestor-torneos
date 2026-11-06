import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Container, Typography, Stack, Box, Card, CardContent, CardActions,
  Button, IconButton, Alert, Snackbar, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, TextField,
  CircularProgress,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import StadiumIcon from '@mui/icons-material/Stadium'
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant'
import PlaceIcon from '@mui/icons-material/Place'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import Navbar from '../components/layout/Navbar'
import ErrorDisplay from '../components/ErrorDisplay'
import { useAuth } from '../hooks/useAuth'
import { useTournament } from '../hooks/useTournaments'
import { useSport } from '../hooks/useSportsConfig'
import { useFieldsByTournament } from '../hooks/useFields'
import {
  fetchTournamentFields,
  createTournamentField,
  updateTournamentField,
  deleteTournamentField,
} from '../data/fields'

export default function TournamentFieldsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const tournament = useTournament(id)
  const sport = useSport(tournament?.sportConfigId)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [snack, setSnack] = useState('')

  // Estado para el modal de Crear/Editar
  const [modalOpen, setModalOpen] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [formName, setFormName] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [saving, setSaving] = useState(false)

  // Estado para confirmación de borrado
  const [deleteFieldId, setDeleteFieldId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fields = useFieldsByTournament(id)

  // Etiqueta del espacio según el deporte del torneo (Cancha, Mesa, Pista, etc.)
  const { labelSingular, labelPlural, IconComponent } = useMemo(() => {
    const rawLabel = sport?.sportProps?.locationLabel
    if (rawLabel) {
      const isMesa = rawLabel.toLowerCase().includes('mesa')
      return {
        labelSingular: rawLabel,
        labelPlural: rawLabel.endsWith('a') || rawLabel.endsWith('o') ? `${rawLabel}s` : `${rawLabel}es`,
        IconComponent: isMesa ? TableRestaurantIcon : StadiumIcon,
      }
    }

    const sportName = (sport?.name || '').toLowerCase()
    if (sportName.includes('mesa') || sportName.includes('ping') || sportName.includes('pool') || sportName.includes('billar')) {
      return { labelSingular: 'Mesa', labelPlural: 'Mesas', IconComponent: TableRestaurantIcon }
    }
    if (sportName.includes('pista') || sportName.includes('atletismo') || sportName.includes('patin')) {
      return { labelSingular: 'Pista', labelPlural: 'Pistas', IconComponent: StadiumIcon }
    }
    if (sportName.includes('ajedrez')) {
      return { labelSingular: 'Tablero', labelPlural: 'Tableros', IconComponent: TableRestaurantIcon }
    }

    return { labelSingular: 'Cancha', labelPlural: 'Canchas', IconComponent: StadiumIcon }
  }, [sport])

  useEffect(() => {
    if (id) {
      setLoading(true)
      fetchTournamentFields(id)
        .catch((err) => setError(err.message || 'Error al cargar los espacios de juego'))
        .finally(() => setLoading(false))
    }
  }, [id])

  if (!user || !tournament) return null

  const isOrganizadorOrAdmin =
    String(tournament.organizerId) === String(user._id) || user.globalRole === 'ADMIN'

  if (!isOrganizadorOrAdmin) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Container maxWidth="md" sx={{ py: 8 }}>
          <ErrorDisplay type="FORBIDDEN" size="lg" />
        </Container>
      </Box>
    )
  }

  const handleOpenCreate = () => {
    setEditingField(null)
    setFormName('')
    setFormLocation('')
    setFormAddress('')
    setModalOpen(true)
  }

  const handleOpenEdit = (field) => {
    setEditingField(field)
    setFormName(field.name || '')
    setFormLocation(field.location || '')
    setFormAddress(field.address || '')
    setModalOpen(true)
  }

  const handleSaveField = async (e) => {
    e.preventDefault()
    if (!formName.trim()) {
      setError(`El nombre de la ${labelSingular.toLowerCase()} es obligatorio.`)
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        name: formName.trim(),
        location: formLocation.trim(),
        address: formAddress.trim(),
      }

      if (editingField) {
        await updateTournamentField(tournament._id, editingField._id, payload)
        setSnack(`${labelSingular} actualizada correctamente`)
      } else {
        await createTournamentField(tournament._id, payload)
        setSnack(`${labelSingular} agregada correctamente`)
      }

      setModalOpen(false)
      await fetchTournamentFields(tournament._id)
    } catch (err) {
      setError(err.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteField = async () => {
    if (!deleteFieldId) return
    setDeleting(true)
    setError('')
    try {
      await deleteTournamentField(tournament._id, deleteFieldId)
      setSnack(`${labelSingular} eliminada correctamente`)
      setDeleteFieldId(null)
      await fetchTournamentFields(tournament._id)
    } catch (err) {
      setError(err.message || 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#0a0a0a', pb: 6 }}>
      <Navbar />

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Barra superior de navegación */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/tournament/${tournament._id}`)}
            sx={{
              color: 'grey.400',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { color: 'white' },
            }}
          >
            Volver al Torneo
          </Button>
        </Stack>

        {/* Encabezado */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'white' }}>
              {labelPlural} del Torneo
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.400', mt: 0.5 }}>
              Administrá los espacios de disputa asignados para{' '}
              <strong style={{ color: '#00e676' }}>{tournament.title}</strong>.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{
              color: '#0a0a0a',
              fontWeight: 700,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              alignSelf: { xs: 'flex-start', sm: 'center' },
            }}
          >
            Nueva {labelSingular}
          </Button>
        </Stack>

        {/* Alertas */}
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && (!fields || fields.length === 0) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        )}

        {/* Estado Vacío */}
        {!loading && fields && fields.length === 0 && (
          <Card
            sx={{
              bgcolor: '#141414',
              border: '1px dashed',
              borderColor: 'grey.800',
              borderRadius: 3,
              p: 5,
              textAlign: 'center',
            }}
          >
            <IconComponent sx={{ fontSize: 64, color: 'grey.600', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', mb: 1 }}>
              No hay {labelPlural.toLowerCase()} cargadas aún
            </Typography>
            <Typography variant="body2" sx={{ color: 'grey.400', maxWidth: 480, mx: 'auto', mb: 3 }}>
              Podés registrar las {labelPlural.toLowerCase()} disponibles para que el generador de fixture
              asigne automáticamente los lugares de cada partido.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{ color: '#0a0a0a', fontWeight: 700, textTransform: 'none' }}
            >
              Agregar la Primera {labelSingular}
            </Button>
          </Card>
        )}

        {/* Listado de Canchas / Ubicaciones */}
        {fields && fields.length > 0 && (
          <Stack spacing={2}>
            {fields.map((f) => (
              <Card
                key={f._id}
                sx={{
                  bgcolor: '#141414',
                  border: '1px solid',
                  borderColor: 'grey.800',
                  borderRadius: 2,
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: 'grey.700' },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ sm: 'center' }}
                    spacing={2}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                        <IconComponent sx={{ color: '#00e676', fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
                          {f.name}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                        {f.location && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'grey.400',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <PlaceIcon sx={{ fontSize: 16, color: '#ff6d00' }} />
                            {f.location}
                          </Typography>
                        )}
                        {f.address && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'grey.400',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <LocationOnIcon sx={{ fontSize: 16, color: 'grey.500' }} />
                            {f.address}
                          </Typography>
                        )}
                      </Stack>
                    </Box>

                    {/* Botones de acción */}
                    <CardActions sx={{ p: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="inherit"
                        startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                        onClick={() => handleOpenEdit(f)}
                        sx={{
                          color: 'grey.300',
                          borderColor: 'grey.700',
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Editar
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteFieldId(f._id)}
                        sx={{
                          bgcolor: 'rgba(239, 83, 80, 0.08)',
                          '&:hover': { bgcolor: 'rgba(239, 83, 80, 0.2)' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {/* Modal Dialog de Crear / Editar */}
        <Dialog
          open={modalOpen}
          onClose={() => !saving && setModalOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#181818',
              backgroundImage: 'none',
              border: '1px solid',
              borderColor: 'grey.800',
              borderRadius: 2,
            },
          }}
        >
          <form onSubmit={handleSaveField}>
            <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
              {editingField ? `Editar ${labelSingular}` : `Nueva ${labelSingular}`}
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
              <DialogContentText sx={{ color: 'grey.400', mb: 2.5, fontSize: '0.875rem' }}>
                Ingresá el nombre o número de la {labelSingular.toLowerCase()} para utilizarla en el fixture.
              </DialogContentText>

              <Stack spacing={2.5}>
                <TextField
                  label={`Nombre / Número de la ${labelSingular} *`}
                  placeholder={`Ej: ${labelSingular} 1, ${labelSingular} Central, 1`}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  fullWidth
                  required
                  autoFocus
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#121212',
                    },
                  }}
                />

                <TextField
                  label="Ubicación o Sector dentro del predio (opcional)"
                  placeholder="Ej: Sede Central, Planta Baja, Sector A"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#121212',
                    },
                  }}
                />

                <TextField
                  label="Dirección física (opcional)"
                  placeholder="Ej: Av. Vélez Sarsfield 1500"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#121212',
                    },
                  }}
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2.5, pt: 1 }}>
              <Button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                sx={{ color: 'grey.400', textTransform: 'none' }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving || !formName.trim()}
                startIcon={saving && <CircularProgress size={16} color="inherit" />}
                sx={{ color: '#0a0a0a', fontWeight: 700, textTransform: 'none' }}
              >
                {saving ? 'Guardando...' : editingField ? 'Guardar Cambios' : `Agregar ${labelSingular}`}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Dialog de Confirmación de Borrado */}
        <Dialog
          open={Boolean(deleteFieldId)}
          onClose={() => !deleting && setDeleteFieldId(null)}
          PaperProps={{
            sx: {
              bgcolor: '#181818',
              backgroundImage: 'none',
              border: '1px solid',
              borderColor: 'grey.800',
              borderRadius: 2,
            },
          }}
        >
          <DialogTitle sx={{ color: 'white', fontWeight: 700 }}>
            ¿Eliminar esta {labelSingular.toLowerCase()}?
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'grey.400' }}>
              Esta acción no se puede deshacer. La {labelSingular.toLowerCase()} dejará de estar disponible
              para este torneo.
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => setDeleteFieldId(null)}
              disabled={deleting}
              sx={{ color: 'grey.400', textTransform: 'none' }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteField}
              variant="contained"
              color="error"
              disabled={deleting}
              startIcon={deleting && <CircularProgress size={16} color="inherit" />}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar de feedback */}
        <Snackbar
          open={Boolean(snack)}
          autoHideDuration={4000}
          onClose={() => setSnack('')}
          message={snack}
        />
      </Container>
    </Box>
  )
}
