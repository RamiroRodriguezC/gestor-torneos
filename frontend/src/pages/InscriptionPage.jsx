import { useState, useMemo } from 'react'
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import {
  Container, Typography, Stack, Box, Card, CardContent, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Alert, Chip, Divider, Snackbar,
} from '@mui/material'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import GroupsIcon from '@mui/icons-material/Groups'
import PersonIcon from '@mui/icons-material/Person'
import Navbar from '../components/layout/Navbar'
import { useAuth } from '../hooks/useAuth'
import { useTournament } from '../hooks/useTournaments'
import { useSport } from '../hooks/useSportsConfig'
import { useTeamsByUser } from '../hooks/useTeams'
import { useApplicationsByApplicant } from '../hooks/useApplications'
import { createApplication } from '../data/applications'
import { findMyParticipation, getParticipantId } from '../utils/participant'

// Página de inscripción a un torneo. Muestra el manifestInscripcion como
// instructivo; en deportes TEAM hay que elegir el equipo (solo capitán);
// en INDIVIDUAL te inscribís vos mismo.
function InscriptionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const tournament = useTournament(id)
  const sport = useSport(tournament?.sportConfigId)
  const myTeams = useTeamsByUser(user?._id)
  const myApplications = useApplicationsByApplicant(user?._id)

  const [teamId, setTeamId] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [okOpen, setOkOpen] = useState(false)

  const isTeamSport = sport?.sportProps?.participantType === 'TEAM'

  // Equipos que el usuario capitanes y que todavía no están en el torneo ni con solicitud activa.
  const eligibleTeams = useMemo(() => {
    if (!tournament || !user) return []
    const participantIds = (tournament.participantes || [])
      .map((p) => String(getParticipantId(p)))
      .filter(Boolean)
    const activeParticipantIds = (myApplications || [])
      .filter((a) => a && String(a.tournamentId) === String(tournament._id) && ['PENDIENTE', 'APROBADA'].includes(a.status))
      .map((a) => String(a.participantId))
      .filter(Boolean)
    return (myTeams || []).filter(
      (t) =>
        t &&
        String(t.capitanId) === String(user._id) &&
        !participantIds.includes(String(t._id)) &&
        !activeParticipantIds.includes(String(t._id))
    )
  }, [tournament, user, myTeams, myApplications])

  const myParticipation = useMemo(() => findMyParticipation(tournament, user), [tournament, user])
  const myPending = (myApplications || []).some(
    (a) =>
      a &&
      String(a.tournamentId) === String(tournament?._id) &&
      a.status === 'PENDIENTE' &&
      (isTeamSport ? String(a.participantId) !== String(user?._id) : true)
  )

  const isFull = tournament?.maxRegistrations > 0 &&
    (tournament.participantes?.length || 0) >= tournament.maxRegistrations

  const isOpen = tournament?.status === 'PUBLICADO' &&
    (!tournament.registrationCloseAt || new Date(tournament.registrationCloseAt) > new Date()) &&
    !isFull

  if (!user || !tournament) return null

  const handleSubmit = async () => {
    setError('')
    if (isTeamSport && !teamId) {
      setError('Elegí el equipo que querés inscribir.')
      return
    }
    setSubmitting(true)
    try {
      const participantId = isTeamSport ? teamId : user._id
      await createApplication({
        tournamentId: tournament._id,
        participantId,
        notesCapitan: notes || undefined,
      })
      setOkOpen(true)
      setTimeout(() => navigate(`/tournament/${tournament._id}`), 1200)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const manifest = tournament.manifestInscripcion || {}
  const cupoInfo = tournament.maxRegistrations > 0
    ? `${tournament.participantes?.length ?? 0} / ${tournament.maxRegistrations}`
    : `${tournament.participantes?.length ?? 0} anotados`

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar backTo={`/tournament/${tournament._id}`} />
      <Container maxWidth="md" sx={{ pb: 8 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: 6, mb: 3 }}>
          <AssignmentTurnedInIcon sx={{ color: '#00e676', fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Inscripción</Typography>
            <Typography variant="body2" color="grey.500">{tournament.title}</Typography>
          </Box>
        </Stack>

        {/* Estado: ya inscripto o solicitud enviada */}
        {myParticipation && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Ya estás inscripto en este torneo.
            <Button component={RouterLink} to={`/tournament/${tournament._id}`} size="small" sx={{ ml: 2 }}>
              Volver al torneo
            </Button>
          </Alert>
        )}
        {!myParticipation && myPending && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Ya enviaste una solicitud de inscripción. Está pendiente de aprobación por el organizador.
          </Alert>
        )}
        {isFull && !myParticipation && !myPending && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            El torneo alcanzó su cupo máximo de participantes ({tournament.maxRegistrations}). Ya no se aceptan nuevas inscripciones.
          </Alert>
        )}
        {!isOpen && !isFull && !myParticipation && !myPending && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Este torneo no está abierto a inscripciones (no está publicado o la inscripción cerró).
          </Alert>
        )}

        {isOpen && !myParticipation && !myPending && (
          <>
            {/* Instructivo del manifestInscripcion */}
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid', borderColor: 'divider', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Requisitos e instrucciones</Typography>
                {manifest.instructions ? (
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 1.5 }}>{manifest.instructions}</Typography>
                ) : (
                  <Typography variant="body2" color="grey.500" sx={{ mb: 1.5 }}>
                    El organizador no cargó instrucciones particulares.
                  </Typography>
                )}
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {manifest.requiresDigitalDoc && <Chip label="Requiere documentación digital" color="secondary" size="small" variant="outlined" />}
                  {manifest.requiresPhysicalDoc && <Chip label="Requiere documentación física" color="secondary" size="small" variant="outlined" />}
                  {(tournament.entryFee > 0) && <Chip label={`Arancel: $${tournament.entryFee}`} size="small" variant="outlined" />}
                  {tournament.registrationCloseAt && (
                    <Chip
                      label={`Cierre: ${new Date(tournament.registrationCloseAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      size="small" variant="outlined"
                    />
                  )}
                  <Chip label={`Cupo: ${cupoInfo}`} size="small" variant="outlined" />
                </Stack>
              </CardContent>
            </Card>

            {/* Selector de participante */}
            <Card sx={{ bgcolor: '#1a1a1a', border: '1px solid', borderColor: 'divider', mb: 3 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  {isTeamSport ? <GroupsIcon sx={{ color: '#00e676' }} /> : <PersonIcon sx={{ color: '#00e676' }} />}
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {isTeamSport ? 'Elegí el equipo a inscribir' : 'Te inscribís vos'}
                  </Typography>
                </Stack>

                {isTeamSport ? (
                  eligibleTeams.length === 0 ? (
                    <Alert severity="info">
                      No tenés equipos disponibles para inscribir en este torneo. Necesitás ser capitán de un equipo de {sport?.name || 'este deporte'} que no esté ya anotado.
                    </Alert>
                  ) : (
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                      <InputLabel>Equipo</InputLabel>
                      <Select value={teamId} label="Equipo" onChange={(e) => setTeamId(e.target.value)}>
                        {eligibleTeams.map((t) => (
                          <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )
                ) : (
                  <Alert severity="info">
                    Te vas a inscribir como participante individual: <strong>{user.name} {user.lastName}</strong>.
                  </Alert>
                )}

                {eligibleTeams.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="grey.500" sx={{ display: 'block', mb: 0.5 }}>
                      Nota para el organizador (opcional)
                    </Typography>
                    <TextField
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Comentarios sobre el equipo, documentación adjunta, etc."
                      size="small"
                      fullWidth
                      multiline
                      minRows={2}
                    />
                  </Box>
                )}

                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={submitting || (isTeamSport && eligibleTeams.length === 0)}
                    onClick={handleSubmit}
                  >
                    {submitting ? 'Enviando...' : 'Enviar solicitud'}
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate(`/tournament/${tournament._id}`)}
                  >
                    Cancelar
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </>
        )}
      </Container>
      <Snackbar
        open={okOpen}
        autoHideDuration={1200}
        onClose={() => setOkOpen(false)}
        message="Solicitud enviada. Cuando el organizador la apruebe vas a quedar inscripto."
      />
      <Divider />
    </Box>
  )
}

export default InscriptionPage
