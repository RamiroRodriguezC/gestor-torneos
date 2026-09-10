import { useNavigate, useParams } from 'react-router-dom'
import {
  Container, Typography, Avatar, Chip, Box, Paper, Grid, Divider, Stack,
  Button, CircularProgress,
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import CakeIcon from '@mui/icons-material/Cake'
import EditIcon from '@mui/icons-material/Edit'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import GroupsIcon from '@mui/icons-material/Groups'
import Navbar from '../components/layout/Navbar'
import { UsernameTag, SportsTag } from '../components/Tags'
import { useAuth } from '../hooks/useAuth'
import { useSports } from '../hooks/useSportsConfig'
import { useUser } from '../hooks/useUsers'
import { useTeamsByUser } from '../hooks/useTeams'
import { useTournamentsByUser } from '../hooks/useTournaments'
import ErrorDisplay from '../components/ErrorDisplay'

// ─── Etiquetas de roles ────────────────────────────────────────────────────────
const TEAM_ROLE_LABEL = { CAPITAN: 'Capitán', MIEMBRO: 'Miembro' }
const TOURNAMENT_ROLE_LABEL = {
  ORGANIZADOR: 'Organizador',
  COORDINADOR: 'Coordinador',
  JUGADOR: 'Jugador',
}
const ROLE_BG = {
  CAPITAN: '#00e676',
  ORGANIZADOR: '#ff6d00',
  COORDINADOR: '#ffb300',
  JUGADOR: '#424242',
  MIEMBRO: '#424242',
}

function RoleChip({ role, label }) {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        bgcolor: ROLE_BG[role] || 'grey.700',
        color: role === 'JUGADOR' || role === 'MIEMBRO' ? 'grey.200' : '#000',
        fontWeight: 700,
        fontSize: '0.68rem',
        height: 22,
      }}
    />
  )
}

function InfoRow({ icon: Icon, children }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Icon sx={{ color: 'grey.600', fontSize: 18 }} />
      <Typography variant="body2" color="grey.400">
        {children}
      </Typography>
    </Stack>
  )
}

// ─── Componente principal ──────────────────────────────────────────────────────
function Profile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()

  // profileUser: solo se usa al visitar el perfil de OTRO usuario (/user/:userId).
  // useUser(undefined) → devuelve null sin consultar Dexie; los guards con "userId &&" lo filtran.
  const profileUser = useUser(userId)
  const sports = useSports()

  // ── Determinar qué usuario mostrar ────────────────────────────────────────────
  const user = userId ? profileUser : currentUser
  const isOwnProfile = !userId || (currentUser && String(userId) === String(currentUser._id))

  // ── Hooks de datos (siempre se invocan; se protegen internamente con el id) ──
  const teams = useTeamsByUser(user?._id)
  const tournaments = useTournamentsByUser(user?._id)

  // ── Guards de carga / error ────────────────────────────────────────────────
  // Perfil ajeno: Dexie aún resolviendo (null = defaultResult del hook)
  if (userId && profileUser === null) {
    return (
      <>
        <Navbar />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress color="primary" />
        </Box>
      </>
    )
  }

  // Perfil ajeno: Dexie terminó y no encontró el usuario
  if (userId && !profileUser) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md" sx={{ mt: 8 }}>
          <ErrorDisplay type="USER_NOT_FOUND" />
        </Container>
      </>
    )
  }

  // Perfil propio: sesión todavía no cargó
  if (!user) return null

  // ── Datos derivados ────────────────────────────────────────────────────────
  const sportMap = Object.fromEntries((sports || []).map((s) => [s._id, s.name]))
  const userSports = (user.sportsInterests || []).map((id) => sportMap[id]).filter(Boolean)

  // Mapas rol por entidad (vienen del subdocumento del usuario, no del objeto del equipo/torneo)
  const teamRoleMap = Object.fromEntries(
    (user.teams || []).map((t) => [String(t.teamId), t.role])
  )
  const tournamentRoleMap = Object.fromEntries(
    (user.tournaments || []).map((t) => [String(t.tournamentId), t.role])
  )

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const hasRightColumn = user.bio || teams.length > 0 || tournaments.length > 0

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6, pb: 8 }}>
        <Grid container spacing={3}>

          {/* ── COLUMNA IZQUIERDA: identidad + contacto + deportes ── */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 3 }}
            >
              {/* Avatar + nombre + username */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  mb: 3,
                }}
              >
                <Avatar
                  src={user.url_profile_photo || ''}
                  sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: 40, mb: 2 }}
                >
                  {user.name?.[0]}{user.lastName?.[0]}
                </Avatar>

                <Typography variant="h5" fontWeight={700}>
                  {user.name} {user.lastName}
                </Typography>
                <UsernameTag username={user.username} sx={{ mt: 0.5 }} />

                {user.globalRole === 'ADMIN' && (
                  <Chip
                    label="Administrador"
                    size="small"
                    color="warning"
                    sx={{ mt: 1, fontWeight: 700 }}
                  />
                )}

                {isOwnProfile && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/dashboard/config')}
                  >
                    Editar perfil
                  </Button>
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Datos de contacto */}
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <InfoRow icon={EmailIcon}>{user.email}</InfoRow>
                {user.phoneNumber && (
                  <InfoRow icon={PhoneIcon}>{user.phoneNumber}</InfoRow>
                )}
                {user.dateOfBirth && (
                  <InfoRow icon={CakeIcon}>{formatDate(user.dateOfBirth)}</InfoRow>
                )}
              </Stack>

              {/* Deportes de interés */}
              {userSports.length > 0 && (
                <>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Deportes de interés
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {userSports.map((sport) => (
                      <SportsTag key={sport} sport={sport} />
                    ))}
                  </Stack>
                </>
              )}
            </Paper>
          </Grid>

          {/* ── COLUMNA DERECHA: bio + equipos + torneos ── */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>

              {/* Bio */}
              {user.bio && (
                <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Sobre mí
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'grey.300', lineHeight: 1.8 }}>
                    {user.bio}
                  </Typography>
                </Paper>
              )}

              {/* Equipos */}
              {teams.length > 0 && (
                <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <GroupsIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Equipos
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {teams.map((team) => {
                      const role = teamRoleMap[String(team._id)]
                      return (
                        <Box
                          key={team._id}
                          onClick={() => navigate(`/dashboard/teams/${team._id}`)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: '#1a1a1a',
                            border: '1px solid',
                            borderColor: 'divider',
                            cursor: 'pointer',
                            '&:hover': { borderColor: 'primary.main' },
                            transition: 'border-color 0.15s',
                          }}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {team.name}
                          </Typography>
                          {role && (
                            <RoleChip role={role} label={TEAM_ROLE_LABEL[role] || role} />
                          )}
                        </Box>
                      )
                    })}
                  </Stack>
                </Paper>
              )}

              {/* Torneos */}
              {tournaments.length > 0 && (
                <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <EmojiEventsIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="subtitle1" fontWeight={700}>
                      Torneos
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    {tournaments.map((t) => {
                      const role = tournamentRoleMap[String(t._id)]
                      return (
                        <Box
                          key={t._id}
                          onClick={() => navigate(`/tournament/${t._id}`)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: '#1a1a1a',
                            border: '1px solid',
                            borderColor: 'divider',
                            cursor: 'pointer',
                            '&:hover': { borderColor: 'primary.main' },
                            transition: 'border-color 0.15s',
                          }}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {t.title}
                            </Typography>
                            <Typography variant="caption" color="grey.600">
                              {t.status}
                            </Typography>
                          </Box>
                          {role && (
                            <RoleChip
                              role={role}
                              label={TOURNAMENT_ROLE_LABEL[role] || role}
                            />
                          )}
                        </Box>
                      )
                    })}
                  </Stack>
                </Paper>
              )}

              {/* Empty state: perfil propio sin contenido aún */}
              {isOwnProfile && !hasRightColumn && (
                <Paper
                  elevation={0}
                  sx={{ p: 5, bgcolor: 'background.paper', borderRadius: 3, textAlign: 'center' }}
                >
                  <Typography variant="body1" color="grey.500">
                    Tu perfil está vacío. ¡Creá un torneo o unite a uno para empezar!
                  </Typography>
                </Paper>
              )}

            </Stack>
          </Grid>

        </Grid>
      </Container>
    </>
  )
}


export default Profile