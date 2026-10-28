import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Container, Box, Stack, Button, Chip, CircularProgress, Card, CardContent, Typography } from '@mui/material'
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import CompetitorPhoto from '../components/shared/CompetitorPhoto'
import { useAuth } from '../hooks/useAuth'
import { useTournament } from '../hooks/useTournaments'
import { useApplicationsByApplicant } from '../hooks/useApplications'
import { fetchTournament } from '../data/tournaments'
import TournamentNavbar from '../components/layout/TournamentNavbar'
import TournamentStandings from '../components/tournament/TournamentStandings'
import TournamentParticipants from '../components/tournament/TournamentParticipants'
import TournamentStats from '../components/tournament/TournamentStats'
import TournamentFixture from '../components/tournament/TournamentFixture'
import TournamentAdminSettings from '../components/tournament/TournamentAdminSettings'
import UnderConstruction from '../components/UnderConstruction'
import ErrorDisplay from '../components/ErrorDisplay'
import { findMyParticipation } from '../utils/participant'

function TournamentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const tournament = useTournament(id)
  const myApplications = useApplicationsByApplicant(user?._id)
  const [activeSection, setActiveSection] = useState('fixture')
  const [loadingBackend, setLoadingBackend] = useState(false)
  const fetchedRef = useRef(false)

  // Sincronizar el torneo desde el backend para mantener al día su ciclo de vida y resultados (stale-while-revalidate)
  useEffect(() => {
    if (!id || fetchedRef.current) return
    fetchedRef.current = true
    let isMounted = true

    if (tournament === null) {
      setLoadingBackend(true)
    }

    if (navigator.onLine) {
      fetchTournament(id)
        .catch((err) => {
          console.warn('No se pudo refrescar el torneo del backend:', err)
        })
        .finally(() => {
          if (isMounted) setLoadingBackend(false)
        })
    }
    return () => { isMounted = false }
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TournamentNavbar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOrganizer={isOrganizer}
      />
      <Container sx={{ pb: 8 }}>
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}>
          {/* Chip de estado actual del torneo */}
          <Chip
            label={
              tournament.status === 'FINALIZADO'
                ? 'Torneo: FINALIZADO 🏆'
                : `Torneo: ${tournament.status || 'BORRADOR'}`
            }
            color={
              tournament.status === 'EN_CURSO'
                ? 'success'
                : tournament.status === 'PUBLICADO'
                ? 'info'
                : tournament.status === 'FINALIZADO'
                ? 'primary'
                : 'warning'
            }
            size="small"
            sx={{
              fontWeight: 700,
              ...(tournament.status === 'FINALIZADO' && {
                bgcolor: '#FFD700',
                color: '#000',
              }),
            }}
          />

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

        {/* Hero Card de Coronación de Campeón (cuando el torneo finalizó) */}
        {tournament.status === 'FINALIZADO' && (
          <Card
            sx={{
              mt: 2.5,
              mb: 1,
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(20, 20, 20, 0.95) 100%)',
              border: '2px solid #FFD700',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(255, 215, 0, 0.15)',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems="center"
                justifyContent="space-between"
                spacing={2.5}
              >
                <Stack direction="row" alignItems="center" spacing={2.5}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 215, 0, 0.18)',
                      border: '2px solid #FFD700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: 36 }} />
                  </Box>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip
                        label="CAMPEÓN OFICIAL 🏆"
                        size="small"
                        sx={{
                          bgcolor: '#FFD700',
                          color: '#000',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          height: 22,
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'grey.400' }}>
                        Torneo Culminado
                      </Typography>
                    </Stack>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', mt: 0.5 }}>
                      {tournament.champion?.displayNameSnapshot || 'Campeón Consagrado'}
                    </Typography>
                  </Box>
                </Stack>

                <CompetitorPhoto
                  logoURL={tournament.champion?.logoURL}
                  displayName={tournament.champion?.displayNameSnapshot}
                  size={60}
                />
              </Stack>
            </CardContent>
          </Card>
        )}

        {activeSection === 'fixture' && (
          <TournamentFixture
            tournament={tournament}
            user={user}
            onGoToAdmin={() => setActiveSection('admin')}
          />
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
        {activeSection === 'announcements' && (
          <UnderConstruction feature="Anuncios" status="development" size="lg" />
        )}
        {activeSection === 'admin' && isOrganizer && (
          <TournamentAdminSettings
            tournament={tournament}
            user={user}
            onSectionChange={setActiveSection}
            onTournamentUpdated={fetchTournament}
          />
        )}
      </Container>
    </Box>
  )
}

export default TournamentPage
