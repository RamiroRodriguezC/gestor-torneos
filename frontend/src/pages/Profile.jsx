import { useNavigate, useParams } from 'react-router-dom'
import {
  Container, Typography, Avatar, Chip, Box, Paper, Grid, Stack,
  Button, CircularProgress,
} from '@mui/material'
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 6, pb: 8 }}>
        
        {/* ── BLOQUE SUPERIOR (HEADER HORIZONTAL ESTILO RED SOCIAL) ── */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            mb: 4,
          }}
        >
          {/* Banner de portada decorativo con gradiente representativo de la marca */}
          <Box
            sx={{
              height: { xs: 90, sm: 130 },
              background: 'linear-gradient(90deg, rgba(0, 230, 118, 0.22) 0%, rgba(18, 18, 18, 0.95) 45%, rgba(255, 109, 0, 0.18) 100%)',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          />

          {/* Cuerpo del encabezado */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, pt: 0 }}>
            {/* Avatar superpuesto + Botón de acción */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                mt: { xs: '-45px', sm: '-60px' },
                mb: 2,
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Avatar
                src={user.url_profile_photo || ''}
                sx={{
                  width: { xs: 90, sm: 120 },
                  height: { xs: 90, sm: 120 },
                  bgcolor: 'primary.main',
                  color: '#000',
                  fontSize: { xs: 34, sm: 46 },
                  fontWeight: 800,
                  border: '4px solid',
                  borderColor: 'background.paper',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
                }}
              >
                {user.name?.[0]}{user.lastName?.[0]}
              </Avatar>

              {isOwnProfile && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate('/dashboard/config')}
                  sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2,
                    py: 0.75,
                    '&:hover': {
                      borderColor: 'primary.light',
                      bgcolor: 'rgba(0, 230, 118, 0.08)',
                    },
                  }}
                >
                  Editar perfil
                </Button>
              )}
            </Box>

            {/* Nombre, username y rol de usuario */}
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
                <Typography variant="h5" fontWeight={800} sx={{ color: '#fff' }}>
                  {user.name} {user.lastName}
                </Typography>
                {user.globalRole === 'ADMIN' && (
                  <Chip
                    label="Administrador"
                    size="small"
                    color="warning"
                    sx={{ fontWeight: 700, height: 22, fontSize: '0.72rem' }}
                  />
                )}
              </Stack>
              <Box sx={{ mt: 0.5 }}>
                <UsernameTag username={user.username} />
              </Box>
            </Box>

            {/* Biografía en lugar de correo y fecha de nacimiento */}
            {user.bio ? (
              <Typography
                variant="body1"
                sx={{
                  color: 'grey.300',
                  lineHeight: 1.7,
                  maxWidth: 900,
                  whiteSpace: 'pre-line',
                  mb: 2,
                }}
              >
                {user.bio}
              </Typography>
            ) : (
              <Typography
                variant="body2"
                sx={{
                  color: 'grey.500',
                  fontStyle: 'italic',
                  mb: 2,
                }}
              >
                {isOwnProfile
                  ? 'Aún no agregaste una biografía. Hacé clic en "Editar perfil" para presentarte ante la comunidad.'
                  : 'Este usuario no tiene biografía pública.'}
              </Typography>
            )}

            {/* Deportes de interés */}
            {userSports.length > 0 && (
              <Stack
                direction="row"
                spacing={1}
                flexWrap="wrap"
                useFlexGap
                alignItems="center"
                sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}
              >
                <Typography
                  variant="caption"
                  color="grey.500"
                  fontWeight={600}
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  Deportes de interés:
                </Typography>
                {userSports.map((sport) => (
                  <SportsTag key={sport} sport={sport} />
                ))}
              </Stack>
            )}
          </Box>
        </Paper>

        {/* ── BLOQUES INFERIORES: EQUIPOS Y TORNEOS ── */}
        <Grid container spacing={3}>

          {/* Bloque: Equipos */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: 'background.paper',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <GroupsIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6" fontWeight={700}>
                  Equipos
                </Typography>
                <Chip
                  label={teams.length}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    color: 'grey.300',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: 22,
                  }}
                />
              </Stack>

              {teams.length > 0 ? (
                <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
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
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'rgba(0, 230, 118, 0.04)',
                          },
                          transition: 'all 0.15s ease-in-out',
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
              ) : (
                <Box
                  sx={{
                    py: 4,
                    px: 2,
                    textAlign: 'center',
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: 'divider',
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" color="grey.500" sx={{ mb: isOwnProfile ? 1.5 : 0 }}>
                    {isOwnProfile
                      ? 'Aún no pertenecés a ningún equipo.'
                      : 'Este usuario no forma parte de ningún equipo.'}
                  </Typography>
                  {isOwnProfile && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => navigate('/dashboard/teams')}
                      sx={{ color: 'primary.main', fontWeight: 600, textTransform: 'none' }}
                    >
                      Explorar o unirse a un equipo
                    </Button>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Bloque: Torneos */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                bgcolor: 'background.paper',
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                <EmojiEventsIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                <Typography variant="h6" fontWeight={700}>
                  Torneos
                </Typography>
                <Chip
                  label={tournaments.length}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                    color: 'grey.300',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: 22,
                  }}
                />
              </Stack>

              {tournaments.length > 0 ? (
                <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
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
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: 'rgba(0, 230, 118, 0.04)',
                          },
                          transition: 'all 0.15s ease-in-out',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {t.title}
                          </Typography>
                          <Typography variant="caption" color="grey.500">
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
              ) : (
                <Box
                  sx={{
                    py: 4,
                    px: 2,
                    textAlign: 'center',
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: 'divider',
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="body2" color="grey.500" sx={{ mb: isOwnProfile ? 1.5 : 0 }}>
                    {isOwnProfile
                      ? 'Aún no participás en ningún torneo.'
                      : 'Este usuario no participa en ningún torneo.'}
                  </Typography>
                  {isOwnProfile && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => navigate('/torneos')}
                      sx={{ color: 'primary.main', fontWeight: 600, textTransform: 'none' }}
                    >
                      Explorar torneos disponibles
                    </Button>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>

        </Grid>
      </Container>
    </>
  )
}

export default Profile
