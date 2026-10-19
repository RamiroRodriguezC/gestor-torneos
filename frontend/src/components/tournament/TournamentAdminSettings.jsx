import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import SettingsIcon from '@mui/icons-material/Settings'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import PublishIcon from '@mui/icons-material/Publish'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import GroupsIcon from '@mui/icons-material/Groups'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useApplicationsByTournament } from '../../hooks/useApplications'
import { publishTournament, generateFixture } from '../../data/tournaments'

function TournamentAdminSettings({ tournament, user, onSectionChange, onTournamentUpdated }) {
  const navigate = useNavigate()
  const applications = useApplicationsByTournament(tournament?._id)

  const [busy, setBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [openUnpublishDialog, setOpenUnpublishDialog] = useState(false)

  const pendingApplications = useMemo(() => {
    return (applications || []).filter((a) => a.status === 'PENDIENTE')
  }, [applications])

  const approvedApplications = useMemo(() => {
    return (applications || []).filter((a) => a.status === 'APROBADA')
  }, [applications])

  const participantCount = tournament?.participantes?.length || 0
  const hasRounds = tournament?.rounds && tournament.rounds.length > 0

  const handleStatusChange = async (newStatus) => {
    setBusy(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await publishTournament(tournament._id, newStatus)
      await onTournamentUpdated?.(tournament._id)
      setSuccessMessage(
        newStatus === 'PUBLICADO'
          ? '¡Torneo publicado con éxito! Ya es visible en el explorador.'
          : 'El torneo ha vuelto al estado Borrador.'
      )
    } catch (err) {
      setErrorMessage(err.message || 'Error al cambiar el estado del torneo')
    } finally {
      setBusy(false)
      setOpenUnpublishDialog(false)
    }
  }

  const handleGenerateFixture = async () => {
    setBusy(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      await generateFixture(tournament._id)
      await onTournamentUpdated?.(tournament._id)
      setSuccessMessage('¡Fixture generado con éxito! Ya podés consultar los emparejamientos.')
    } catch (err) {
      setErrorMessage(err.message || 'Error al generar el fixture')
    } finally {
      setBusy(false)
    }
  }

  if (!tournament) return null

  return (
    <Box sx={{ mt: 3, maxWidth: 860, mx: 'auto', pb: 4 }}>
      {/* Encabezado del Panel */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
        <SettingsIcon sx={{ color: '#00e676', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
          Ajustes del Torneo
        </Typography>
        <Chip
          label={tournament.status || 'BORRADOR'}
          color={tournament.status === 'PUBLICADO' ? 'info' : tournament.status === 'BORRADOR' ? 'warning' : 'default'}
          size="small"
          sx={{ fontWeight: 700, ml: 'auto' }}
        />
      </Stack>
      <Typography variant="body2" sx={{ color: 'grey.400', mb: 3 }}>
        Panel de control y acciones de administración exclusivas para el organizador de este torneo.
      </Typography>

      {/* Alertas de resultado */}
      {errorMessage && (
        <Alert severity="error" onClose={() => setErrorMessage('')} sx={{ mb: 3 }}>
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Stack spacing={2.5}>
        {/* Tarjeta 1: Solicitudes de Inscripción */}
        <Card sx={{ bgcolor: '#141414', border: '1px solid', borderColor: 'grey.800', borderRadius: 2 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <PendingActionsIcon sx={{ color: '#00e676', fontSize: 22 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                    Solicitudes de Inscripción
                  </Typography>
                  {pendingApplications.length > 0 && (
                    <Chip
                      label={`${pendingApplications.length} pendientes`}
                      size="small"
                      color="warning"
                      sx={{ fontWeight: 700, height: 22, fontSize: '0.75rem' }}
                    />
                  )}
                </Stack>
                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                  Revisá, aprobá o rechazá los equipos y jugadores que solicitaron sumarse al torneo.
                </Typography>
                <Typography variant="caption" sx={{ color: 'grey.500', display: 'block', mt: 0.5 }}>
                  {approvedApplications.length} solicitudes aprobadas · {applications?.length || 0} registradas en total
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(`/torneos/${tournament._id}/solicitudes`)}
                sx={{
                  color: '#0a0a0a',
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  alignSelf: { xs: 'flex-start', sm: 'center' },
                }}
              >
                Ver Solicitudes
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Tarjeta 2: Fixture y Sorteo */}
        <Card sx={{ bgcolor: '#141414', border: '1px solid', borderColor: 'grey.800', borderRadius: 2 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <CalendarMonthIcon sx={{ color: '#ff6d00', fontSize: 22 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                    Sorteo y Fixture
                  </Typography>
                  {hasRounds && (
                    <Chip
                      icon={<CheckCircleIcon sx={{ fontSize: '16px !important' }} />}
                      label="Generado"
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.75rem' }}
                    />
                  )}
                </Stack>
                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                  {hasRounds
                    ? `El fixture ya fue generado con ${tournament.rounds.length} jornadas/fechas.`
                    : 'Generá automáticamente el calendario de partidos y fechas bajo formato Liga (Round Robin).'}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 0.8, alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'grey.400', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <GroupsIcon sx={{ fontSize: 16, color: '#00e676' }} />
                    {participantCount} equipos participantes
                  </Typography>
                  {tournament.rules?.format && (
                    <Typography variant="caption" sx={{ color: 'grey.500' }}>
                      Formato: {tournament.rules.format}
                    </Typography>
                  )}
                </Stack>
              </Box>

              {hasRounds ? (
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => onSectionChange?.('fixture')}
                  sx={{
                    color: 'grey.300',
                    borderColor: 'grey.700',
                    textTransform: 'none',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    alignSelf: { xs: 'flex-start', sm: 'center' },
                  }}
                >
                  Ver Fixture
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                  disabled={busy || participantCount < 2}
                  onClick={handleGenerateFixture}
                  sx={{
                    fontWeight: 700,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    alignSelf: { xs: 'flex-start', sm: 'center' },
                  }}
                >
                  Generar Fixture
                </Button>
              )}
            </Stack>
            {!hasRounds && participantCount < 2 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Se necesitan al menos 2 equipos participantes confirmados para poder generar el fixture.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Tarjeta 3: Publicación (cuando el torneo está en Borrador) */}
        {tournament.status === 'BORRADOR' && (
          <Card sx={{ bgcolor: '#141414', border: '1px solid', borderColor: 'grey.800', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <PublishIcon sx={{ color: '#00e676', fontSize: 22 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                      Publicar Torneo
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                    Tu torneo está en borrador. Al publicarlo, aparecerá en el catálogo público y los capitanes podrán inscribir sus equipos.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={busy}
                  onClick={() => handleStatusChange('PUBLICADO')}
                  sx={{
                    color: '#0a0a0a',
                    fontWeight: 700,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    alignSelf: { xs: 'flex-start', sm: 'center' },
                  }}
                >
                  Publicar Torneo
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Tarjeta 4: DANGER ZONE (Estilo GitHub) */}
        <Box
          sx={{
            border: '1px solid #f85149',
            borderRadius: 2,
            bgcolor: 'rgba(248, 81, 73, 0.04)',
            overflow: 'hidden',
          }}
        >
          {/* Header de Danger Zone */}
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(248, 81, 73, 0.25)', display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberIcon sx={{ color: '#f85149', fontSize: 20 }} />
            <Typography variant="subtitle2" sx={{ color: '#f85149', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              Danger Zone
            </Typography>
          </Box>

          <Box sx={{ p: 2.5 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ sm: 'center' }}
              spacing={2}
            >
              <Box sx={{ pr: { sm: 2 } }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white', mb: 0.5 }}>
                  Despublicar torneo
                </Typography>
                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                  Cambia el estado del torneo a <strong>Borrador</strong>. El torneo dejará de ser visible en el explorador público y se suspenderán las solicitudes de inscripción.
                </Typography>
                {tournament.status === 'BORRADOR' && (
                  <Typography variant="caption" sx={{ color: 'grey.500', display: 'block', mt: 0.5 }}>
                    El torneo ya se encuentra actualmente en estado Borrador (despublicado).
                  </Typography>
                )}
              </Box>

              <Button
                variant="outlined"
                color="error"
                disabled={busy || tournament.status === 'BORRADOR'}
                onClick={() => setOpenUnpublishDialog(true)}
                sx={{
                  borderColor: '#f85149',
                  color: '#f85149',
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  alignSelf: { xs: 'flex-start', sm: 'center' },
                  '&:hover': {
                    borderColor: '#ff7b72',
                    bgcolor: 'rgba(248, 81, 73, 0.1)',
                  },
                }}
              >
                Despublicar torneo
              </Button>
            </Stack>
          </Box>
        </Box>
      </Stack>

      {/* Diálogo de confirmación para Despublicar */}
      <Dialog
        open={openUnpublishDialog}
        onClose={() => !busy && setOpenUnpublishDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: '#181818',
            border: '1px solid #f85149',
            borderRadius: 2,
            maxWidth: 480,
          },
        }}
      >
        <DialogTitle sx={{ color: '#f85149', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon sx={{ color: '#f85149' }} />
          ¿Despublicar torneo?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'grey.300' }}>
            Esta acción pasará el torneo a estado <strong>Borrador</strong>.
            <br /><br />
            El torneo dejará de aparecer en el catálogo público y los usuarios no podrán enviar nuevas solicitudes de inscripción hasta que decidas volver a publicarlo.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setOpenUnpublishDialog(false)}
            disabled={busy}
            sx={{ color: 'grey.400', textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => handleStatusChange('BORRADOR')}
            disabled={busy}
            variant="contained"
            color="error"
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: '#d32f2f',
              '&:hover': { bgcolor: '#b71c1c' },
            }}
          >
            Sí, despublicar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TournamentAdminSettings
