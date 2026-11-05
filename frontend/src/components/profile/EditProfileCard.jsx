import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Paper, Box, Typography, Stack, TextField, Button,
  Chip, Alert, CircularProgress, Divider,
} from '@mui/material'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import LinkIcon from '@mui/icons-material/Link'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import SaveIcon from '@mui/icons-material/Save'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer'
import SportsBasketballIcon from '@mui/icons-material/SportsBasketball'
import SportsHandballIcon from '@mui/icons-material/SportsHandball'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'

import { useSports } from '../../hooks/useSportsConfig'
import { syncSports } from '../../data/sportsConfig'
import { updateUserProfile } from '../../data/users'
import UserAvatar from '../shared/UserAvatar'

// Formateo amigable de nombres de deportes
function formatSportName(name = '') {
  const map = {
    FUTBOL_7: 'Fútbol 7',
    FUTBOL_5: 'Fútbol 5',
    FUTBOL_11: 'Fútbol 11',
    BASQUETBALL: 'Básquet',
    HANDBALL: 'Handball',
    PADEL: 'Pádel',
    VOLEY: 'Vóley',
    TENIS: 'Tenis',
  }
  return map[name] || name.replace(/_/g, ' ')
}

// Icono correspondiente a cada disciplina
function getSportIcon(name = '') {
  if (name.includes('FUTBOL')) return <SportsSoccerIcon fontSize="small" />
  if (name.includes('BASQUET')) return <SportsBasketballIcon fontSize="small" />
  if (name.includes('HANDBALL')) return <SportsHandballIcon fontSize="small" />
  return <FitnessCenterIcon fontSize="small" />
}

// Compresión client-side de imágenes subidas a máx 400x400 para mantenerlas livianas
function processImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo seleccionado no es una imagen válida.'))
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const maxDim = 400
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        resolve(dataUrl)
      }
      img.onerror = () => reject(new Error('Error al decodificar la imagen.'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo.'))
    reader.readAsDataURL(file)
  })
}

export default function EditProfileCard({ user }) {
  const sports = useSports()
  const fileInputRef = useRef(null)

  // Sincronizar catálogo completo de deportes desde el backend
  useEffect(() => {
    syncSports()
  }, [])

  // Estados locales editables
  const [photoURL, setPhotoURL] = useState(user?.url_profile_photo || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [name, setName] = useState(user?.name || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '')
  const [selectedSports, setSelectedSports] = useState(() =>
    (user?.sportsInterests || []).map((id) => (typeof id === 'object' ? id._id : String(id)))
  )

  // Modos de entrada de foto
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [tempUrl, setTempUrl] = useState('')

  // Estados de feedback y guardado
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Reiniciar estados cuando cambie el usuario base (si no se está editando activamente)
  useEffect(() => {
    if (user) {
      setPhotoURL(user.url_profile_photo || '')
      setBio(user.bio || '')
      setName(user.name || '')
      setLastName(user.lastName || '')
      setPhoneNumber(user.phoneNumber || '')
      setSelectedSports(
        (user.sportsInterests || []).map((id) => (typeof id === 'object' ? id._id : String(id)))
      )
    }
  }, [user?._id])

  // Detectar si hubo cambios respecto a los datos originales
  const isDirty = useMemo(() => {
    if (!user) return false
    const origPhoto = user.url_profile_photo || ''
    const origBio = user.bio || ''
    const origName = user.name || ''
    const origLastName = user.lastName || ''
    const origPhone = user.phoneNumber || ''
    const origSports = (user.sportsInterests || []).map((id) =>
      typeof id === 'object' ? id._id : String(id)
    ).sort()

    const currentSports = [...selectedSports].sort()
    const sportsChanged =
      origSports.length !== currentSports.length ||
      origSports.some((id, idx) => id !== currentSports[idx])

    return (
      photoURL !== origPhoto ||
      bio !== origBio ||
      name !== origName ||
      lastName !== origLastName ||
      phoneNumber !== origPhone ||
      sportsChanged
    )
  }, [user, photoURL, bio, name, lastName, phoneNumber, selectedSports])

  // Manejador de subida de archivo
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErrorMsg('')
    try {
      const compressedDataUrl = await processImageFile(file)
      setPhotoURL(compressedDataUrl)
      setShowUrlInput(false)
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar la imagen seleccionada')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Manejador de aplicación de URL de imagen
  const handleApplyUrl = () => {
    if (!tempUrl.trim()) return
    setPhotoURL(tempUrl.trim())
    setTempUrl('')
    setShowUrlInput(false)
  }

  // Quitar foto de perfil
  const handleRemovePhoto = () => {
    setPhotoURL('')
    setShowUrlInput(false)
    setTempUrl('')
  }

  // Toggle de selección de deportes de interés
  const handleToggleSport = (sportId) => {
    const idStr = String(sportId)
    setSelectedSports((prev) =>
      prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
    )
  }

  // Descartar cambios y volver a los valores originales
  const handleReset = () => {
    if (!user) return
    setPhotoURL(user.url_profile_photo || '')
    setBio(user.bio || '')
    setName(user.name || '')
    setLastName(user.lastName || '')
    setPhoneNumber(user.phoneNumber || '')
    setSelectedSports(
      (user.sportsInterests || []).map((id) => (typeof id === 'object' ? id._id : String(id)))
    )
    setShowUrlInput(false)
    setTempUrl('')
    setErrorMsg('')
  }

  // Guardar perfil en backend y sincronizar Dexie
  const handleSave = async () => {
    if (!user?._id) return
    if (!name.trim() || !lastName.trim()) {
      setErrorMsg('El nombre y el apellido son requeridos.')
      return
    }

    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const payload = {
        name: name.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        url_profile_photo: photoURL.trim(),
        bio: bio.trim(),
        sportsInterests: selectedSports,
      }

      await updateUserProfile(user._id, payload)
      setSuccessMsg('¡Perfil actualizado con éxito!')
      setTimeout(() => setSuccessMsg(''), 4500)
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error al guardar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        bgcolor: '#1a1a1a',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
      }}
    >
      {/* Encabezado del módulo */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
        <AccountCircleIcon sx={{ fontSize: 26, color: 'primary.main' }} />
        <Typography variant="h6" fontWeight={700}>
          Editar Perfil
        </Typography>
      </Stack>
      <Typography variant="body2" color="grey.400" sx={{ mb: 3 }}>
        Personalizá tu foto, tu biografía y tus deportes de interés para tu perfil público en CopaHub.
      </Typography>

      {/* Alertas de Feedback */}
      {successMsg && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMsg('')}>
          {successMsg}
        </Alert>
      )}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      <Stack spacing={3.5}>
        {/* ── 1. FOTO DE PERFIL ── */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'grey.300', mb: 1.5 }}>
            Foto de Perfil
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2.5}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
          >
            {/* Avatar preview grande */}
            <UserAvatar
              src={photoURL}
              name={`${name} ${lastName}`}
              size={80}
              sx={{
                border: '2px solid',
                borderColor: 'primary.main',
                boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
              }}
            />

            {/* Acciones de foto */}
            <Stack spacing={1} sx={{ flexGrow: 1 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PhotoCameraIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Subir foto
                </Button>

                <Button
                  variant="text"
                  size="small"
                  startIcon={<LinkIcon />}
                  onClick={() => setShowUrlInput((v) => !v)}
                  sx={{ textTransform: 'none', color: 'grey.300' }}
                >
                  Pegar enlace
                </Button>

                {photoURL && (
                  <Button
                    variant="text"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={handleRemovePhoto}
                    sx={{ textTransform: 'none' }}
                  >
                    Quitar foto
                  </Button>
                )}
              </Stack>

              {/* Input desplegable para URL directa */}
              {showUrlInput && (
                <Stack direction="row" spacing={1} sx={{ mt: 1, maxWidth: 450 }}>
                  <TextField
                    size="small"
                    placeholder="https://ejemplo.com/mifoto.jpg"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    fullWidth
                    sx={{
                      '& .MuiInputBase-input': { fontSize: '0.875rem' },
                    }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleApplyUrl}
                    disabled={!tempUrl.trim()}
                    sx={{ textTransform: 'none' }}
                  >
                    Aplicar
                  </Button>
                </Stack>
              )}

              <Typography variant="caption" color="grey.500">
                Formatos recomendados: JPG, PNG o WebP. Se optimiza automáticamente.
              </Typography>
            </Stack>
          </Stack>
        </Box>

        <Divider sx={{ borderColor: 'divider' }} />

        {/* ── 2. BIOGRAFÍA ── */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'grey.300', mb: 1 }}>
            Biografía
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Contá un poco sobre vos, tu estilo de juego, tu experiencia o tus equipos..."
            value={bio}
            onChange={(e) => {
              if (e.target.value.length <= 300) {
                setBio(e.target.value)
              }
            }}
            helperText={`${bio.length} / 300 caracteres`}
            FormHelperTextProps={{
              sx: { textAlign: 'right', color: 'grey.500' },
            }}
          />
        </Box>

        <Divider sx={{ borderColor: 'divider' }} />

        {/* ── 3. DEPORTES DE INTERÉS ── */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'grey.300', mb: 0.5 }}>
            Deportes de Interés
          </Typography>
          <Typography variant="body2" color="grey.500" sx={{ mb: 2 }}>
            Seleccioná los deportes que practicás o te gustaría seguir. Aparecerán destacados en tu perfil.
          </Typography>

          {(!sports || sports.length === 0) ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={18} color="primary" />
              <Typography variant="body2" color="grey.500">
                Cargando disciplinas deportivas...
              </Typography>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
              {sports.map((sport) => {
                const isSelected = selectedSports.includes(String(sport._id))
                return (
                  <Chip
                    key={sport._id}
                    icon={isSelected ? <CheckIcon /> : getSportIcon(sport.name)}
                    label={formatSportName(sport.name)}
                    clickable
                    color={isSelected ? 'primary' : 'default'}
                    variant={isSelected ? 'filled' : 'outlined'}
                    onClick={() => handleToggleSport(sport._id)}
                    sx={{
                      fontWeight: 600,
                      px: 0.5,
                      py: 2,
                      fontSize: '0.85rem',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      color: isSelected ? '#000' : 'grey.300',
                      bgcolor: isSelected ? 'primary.main' : 'transparent',
                      '&:hover': {
                        bgcolor: isSelected ? 'primary.light' : 'rgba(255,255,255,0.06)',
                      },
                      transition: 'all 0.15s ease-in-out',
                    }}
                  />
                )
              })}
            </Stack>
          )}
        </Box>

        <Divider sx={{ borderColor: 'divider' }} />

        {/* ── 4. DATOS PERSONALES (NOMBRE, APELLIDO Y TELÉFONO) ── */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'grey.300', mb: 1.5 }}>
            Datos Personales
          </Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Nombre"
                fullWidth
                size="small"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <TextField
                label="Apellido"
                fullWidth
                size="small"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </Stack>

            <TextField
              label="Teléfono de contacto (opcional)"
              fullWidth
              size="small"
              placeholder="+54 9 11 1234-5678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </Stack>
        </Box>

        {/* ── BOTONES DE ACCIÓN ── */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          sx={{ pt: 1 }}
        >
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
            disabled={!isDirty || saving}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'grey.400' }}
          >
            Descartar
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={!isDirty || saving}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              color: '#000',
              boxShadow: isDirty ? '0 4px 12px rgba(0, 230, 118, 0.3)' : 'none',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  )
}
