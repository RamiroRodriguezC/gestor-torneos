import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Container, Box, Stack, Button, Chip, Alert, CircularProgress } from '@mui/material'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import PublishIcon from '@mui/icons-material/Publish'
import UnpublishedIcon from '@mui/icons-material/Unpublished'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useAuth } from '../hooks/useAuth'
import { useTournament } from '../hooks/useTournaments'
import { useApplicationsByApplicant } from '../hooks/useApplications'
import { publishTournament, fetchTournament } from '../data/tournaments'
import TournamentNavbar from '../components/layout/TournamentNavbar'
import TournamentGeneral from '../components/tournament/TournamentGeneral'
import TournamentStandings from '../components/tournament/TournamentStandings'
import TournamentParticipants from '../components/tournament/TournamentParticipants'
import TournamentStats from '../components/tournament/TournamentStats'
import TournamentFixture from '../components/tournament/TournamentFixture'
import UnderConstruction from '../components/UnderConstruction'
import ErrorDisplay from '../components/ErrorDisplay'
import { findMyParticipation } from '../utils/participant'

function TournamentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const tournament = useTournament(id)
  const myApplications = useApplicationsByApplicant(user?._id)
  const [activeSection, setActiveSection] = useState('general')
  const [publishError, setPublishError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadingBackend, setLoadingBackend] = useState(false)
  const fetchedRef = useRef(false)

  // Si Dexie ya terminó de consultar (tournament === null) y confirmó que NO está localmente,
  // intentamos traerlo del backend una única vez por si navegó directamente por URL en un dispositivo nuevo.
  useEffect(() => {
    if (tournament === null && !fetchedRef.current && id) {
      fetchedRef.current = true
      let isMounted = true
      setLoadingBackend(true)
      fetchTournament(id)
        .catch((err) => {
          console.warn('No se pudo obtener el torneo del backend:', err)
        })
        .finally(() => {
          if (isMounted) setLoadingBackend(false)
        })
      return () => { isMounted = false }
    }
  }, [id, tournament])

  const isOrganizer = tournament && user && String(tournament.organizerId) === String(user._id)

  // Estado de inscripción del usuario actual respecto de este torneo.
  const inscription = useMemo(() => {
    if (!tournament || !user) return { state: 'none' }
    const myParticipationId = findMyParticipation(tournament, user)
    if (myParticipationId) return { state: 'inscripto', participantId: myParticipationId }

    const myPending = (myApplications || []).find(
      (a) => String(a.tournamentId) === String(tournament._id) && a.status === 'PENDIENTE'
    )
    if (myPending) return { state: 'pendiente' }
    return { state: 'none' }
  }, [tournament, user, myApplications])

  const registrationOpen =
    tournament?.status === 'PUBLICADO' &&
    (!tournament.registrationCloseAt || new Date(tournament.registrationCloseAt) > new Date())

  // Mostrar spinner si Dexie aún está consultando (undefined) o si Dexie terminó en null pero el backend está en vuelo.
  if (tournament === undefined || (tournament === null && loadingBackend)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    )
  }

  if (!tournament) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <ErrorDisplay type="PAGE_NOT_FOUND" message="El torneo no existe o fue eliminado." size="lg" />
      </Container>
    )
  }

  const canPublish = isOrganizer && tournament.status === 'BORRADOR'
  const canUnpublish = isOrganizer && tournament.status === 'PUBLICADO'

  const handlePublish = async (status) => {
    setBusy(true)
    setPublishError('')
    try {
      await publishTournament(tournament._id, status)
    } catch (err) {
      setPublishError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TournamentNavbar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <Container>
        {activeSection === 'general' && (
          <>
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}>
              {/* Organizador: publicar/despublicar + acceso a solicitudes */}
              {canPublish && (
                <Button size="small" variant="contained" color="primary" startIcon={<PublishIcon />} disabled={busy} onClick={() => handlePublish('PUBLICADO')}>
                  Publicar torneo
                </Button>
              )}
              {canUnpublish && (
                <Button size="small" variant="outlined" color="warning" startIcon={<UnpublishedIcon />} disabled={busy} onClick={() => handlePublish('BORRADOR')}>
                  Despublicar
                </Button>
              )}
              {isOrganizer && (
                <Button size="small" variant="outlined" startIcon={<PendingActionsIcon />} onClick={() => navigate(`/torneos/${tournament._id}/solicitudes`)}>
                  Solicitudes
                </Button>
              )}

              {/* Jugador no inscripto: CTA a la página de inscripción */}
              {!isOrganizer && inscription.state === 'none' && registrationOpen && (
                <Button size="small" variant="contained" color="primary" startIcon={<AssignmentTurnedInIcon />} onClick={() => navigate(`/torneos/${tournament._id}/inscripcion`)}>
                  Inscribirme
                </Button>
              )}
              {!isOrganizer && inscription.state === 'pendiente' && (
                <Chip icon={<PendingActionsIcon />} label="Solicitud pendiente de aprobación" color="warning" size="small" variant="outlined" />
              )}
              {!isOrganizer && inscription.state === 'inscripto' && (
                <Chip icon={<CheckCircleIcon />} label="Ya inscripto" color="primary" size="small" variant="outlined" />
              )}
            </Stack>

            {publishError && <Alert severity="error" sx={{ mt: 1 }}>{publishError}</Alert>}
            {isOrganizer && tournament.status === 'BORRADOR' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Este torneo está en borrador. Publicalo para que la gente pueda verlo e inscribirse.
              </Alert>
            )}

            <TournamentGeneral tournament={tournament} user={user} />
          </>
        )}
        {activeSection === 'standings' && (
          <TournamentStandings tournament={tournament} user={user} />
        )}
        {activeSection === 'teams' && (
          <TournamentParticipants tournament={tournament} />
        )}
        {activeSection === 'stats' && (
          <TournamentStats tournament={tournament} />
        )}
        {activeSection === 'fixture' && (
          <TournamentFixture tournament={tournament} user={user} />
        )}
        {activeSection === 'announcements' && (
          <UnderConstruction feature="Anuncios" status="development" size="lg" />
        )}
      </Container>
    </Box>
  )
}

export default TournamentPage
