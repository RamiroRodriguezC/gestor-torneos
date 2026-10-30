import { useNavigate } from 'react-router-dom'
import {
  Box, Container, Typography, Button, Stack, Paper, Grid
} from '@mui/material'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import GroupsIcon from '@mui/icons-material/Groups'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import BarChartIcon from '@mui/icons-material/BarChart'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AuthNavbar from '../components/layout/AuthNavbar'
import Footer from '../components/layout/Footer'
import { useAuth } from '../hooks/useAuth'

function HomePage() {
  const navigate = useNavigate()
  const { isLoggedIn } = useAuth()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#0a0a0a', color: '#fff' }}>
      <AuthNavbar />

      <Box component="main" sx={{ flexGrow: 1 }}>
        {/* ── 1. HERO SECTION ── */}
        <Box
          sx={{
            position: 'relative',
            overflow: 'hidden',
            pt: { xs: 8, md: 11 },
            pb: { xs: 8, md: 12 },
            background: 'radial-gradient(circle at 50% 15%, rgba(0, 230, 118, 0.12) 0%, rgba(10, 10, 10, 0) 65%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <Container maxWidth="lg">
            <Stack spacing={3} alignItems="center" textAlign="center">
              {/* Título Principal */}
              <Typography
                variant="h1"
                component="h1"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '2.5rem', sm: '3.75rem', md: '4.75rem' },
                  letterSpacing: { xs: '-0.02em', md: '-0.03em' },
                  lineHeight: 1.1,
                  maxWidth: 920,
                  color: '#ffffff',
                }}
              >
                Organizá, competí y viví el deporte{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(90deg, #00e676 20%, #69f0ae 80%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline-block',
                  }}
                >
                  como un profesional
                </Box>
              </Typography>

              {/* Subtítulo */}
              <Typography
                variant="h6"
                sx={{
                  color: 'grey.400',
                  fontWeight: 400,
                  fontSize: { xs: '1.05rem', sm: '1.25rem' },
                  lineHeight: 1.6,
                  maxWidth: 720,
                }}
              >
                Creá torneos con fixtures automáticos, gestioná tus equipos con códigos de invitación
                y seguí resultados en tiempo real sin planillas complejas.
              </Typography>

              {/* CTAs */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ pt: 1, width: { xs: '100%', sm: 'auto' } }}
              >
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => navigate(isLoggedIn ? '/dashboard/tournaments' : '/torneos')}
                  sx={{
                    bgcolor: 'primary.main',
                    color: '#000',
                    fontWeight: 800,
                    fontSize: '1rem',
                    px: 4,
                    py: 1.4,
                    borderRadius: 2.5,
                    boxShadow: '0 0 25px rgba(0, 230, 118, 0.4)',
                    '&:hover': {
                      bgcolor: '#00c853',
                      boxShadow: '0 0 35px rgba(0, 230, 118, 0.6)',
                    },
                  }}
                >
                  {isLoggedIn ? 'Ir al Dashboard' : 'Explorar Torneos'}
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate(isLoggedIn ? '/dashboard/tournaments/create' : '/register')}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1rem',
                    px: 3.5,
                    py: 1.4,
                    borderRadius: 2.5,
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(0, 230, 118, 0.08)',
                    },
                  }}
                >
                  {isLoggedIn ? 'Crear un Torneo' : 'Crear Cuenta Gratis'}
                </Button>
              </Stack>

              {/* ── IMAGEN DEPORTIVA CINEMÁTICA ── */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 960,
                  mt: { xs: 4, md: 6 },
                  borderRadius: 4,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'rgba(0, 230, 118, 0.25)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 230, 118, 0.12)',
                }}
              >
                <Box
                  component="img"
                  src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80"
                  alt="Cancha y torneo nocturno"
                  loading="lazy"
                  sx={{
                    width: '100%',
                    height: { xs: 200, sm: 320, md: 400 },
                    objectFit: 'cover',
                    display: 'block',
                    filter: 'brightness(0.85) contrast(1.05)',
                  }}
                />
                {/* Degradado inferior con leyenda sobre deportes */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '45%',
                    background: 'linear-gradient(to top, rgba(10, 10, 10, 0.95) 0%, rgba(10, 10, 10, 0) 100%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    p: { xs: 2, sm: 3 },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <EmojiEventsIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={700} color="#fff" sx={{ fontSize: { xs: '0.8rem', sm: '0.95rem' } }}>
                      Fútbol • Básquet • Pádel • Vóley — La experiencia integral para tus competencias
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            </Stack>
          </Container>
        </Box>

        {/* ── 2. CARACTERÍSTICAS PRINCIPALES (3 PILARES SIN REDUNDANCIAS) ── */}
        <Box sx={{ py: { xs: 8, md: 12 } }}>
          <Container maxWidth="lg">
            <Stack spacing={2} textAlign="center" alignItems="center" sx={{ mb: 7 }}>
              <Typography
                variant="overline"
                color="primary.main"
                fontWeight={800}
                letterSpacing={1.5}
              >
                CARACTERÍSTICAS PRINCIPALES
              </Typography>
              <Typography variant="h3" fontWeight={800} sx={{ fontSize: { xs: '2rem', md: '2.75rem' } }}>
                Todo lo que necesitás para tu torneo
              </Typography>
              <Typography variant="body1" color="grey.400" maxWidth={620}>
                Herramientas diseñadas para organizadores, capitanes y jugadores apasionados.
              </Typography>
            </Stack>

            <Grid container spacing={3}>
              {[
                {
                  icon: CalendarMonthIcon,
                  title: 'Torneos y Fixtures Automáticos',
                  desc: 'Olvidate de armar cruces a mano. Nuestro algoritmo Round Robin genera automáticamente todas las fechas, balanceando localías y descansos con un solo clic.',
                },
                {
                  icon: GroupsIcon,
                  title: 'Equipos y Códigos de Invitación',
                  desc: 'Creá tu equipo y obtené un código único de unión (ej. TF-78AB). Compartilo por WhatsApp y que cada jugador se sume a la nómina por su cuenta.',
                },
                {
                  icon: BarChartIcon,
                  title: 'Tablas de Posiciones y Planillas',
                  desc: 'Cargá goles, puntos y resultados en cada fecha. La tabla general, estadísticas y coronación del campeón se actualizan en tiempo real.',
                },
              ].map((feature, index) => {
                const IconComp = feature.icon
                return (
                  <Grid item xs={12} md={4} key={index}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 3, sm: 4 },
                        height: '100%',
                        bgcolor: '#121212',
                        borderRadius: 3,
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        transition: 'all 0.25s ease-in-out',
                        '&:hover': {
                          borderColor: 'primary.main',
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 30px rgba(0, 230, 118, 0.12)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2.5,
                          bgcolor: 'rgba(0, 230, 118, 0.1)',
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2.5,
                        }}
                      >
                        <IconComp sx={{ fontSize: 26 }} />
                      </Box>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5, color: '#fff' }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="grey.400" sx={{ lineHeight: 1.7 }}>
                        {feature.desc}
                      </Typography>
                    </Paper>
                  </Grid>
                )
              })}
            </Grid>
          </Container>
        </Box>

        {/* ── 3. BANNER FINAL CTA ── */}
        <Box sx={{ pb: { xs: 10, md: 14 } }}>
          <Container maxWidth="md">
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, sm: 6 },
                textAlign: 'center',
                borderRadius: 4,
                background: 'linear-gradient(135deg, rgba(0, 230, 118, 0.15) 0%, rgba(18, 18, 18, 0.95) 50%, rgba(255, 109, 0, 0.12) 100%)',
                border: '1px solid rgba(0, 230, 118, 0.3)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 230, 118, 0.1)',
              }}
            >
              <Typography variant="h3" fontWeight={900} sx={{ mb: 2, fontSize: { xs: '1.85rem', md: '2.5rem' } }}>
                ¿Listo para llevar tu competencia al siguiente nivel?
              </Typography>
              <Typography variant="body1" color="grey.300" sx={{ mb: 4, maxWidth: 580, mx: 'auto', lineHeight: 1.7 }}>
                Unite a los equipos y organizadores que ya gestionan sus torneos con la mejor experiencia deportiva.
              </Typography>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate(isLoggedIn ? '/dashboard/tournaments' : '/register')}
                sx={{
                  bgcolor: 'primary.main',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: '1rem',
                  px: 5,
                  py: 1.5,
                  borderRadius: 2.5,
                  boxShadow: '0 0 30px rgba(0, 230, 118, 0.5)',
                  '&:hover': {
                    bgcolor: '#00c853',
                    boxShadow: '0 0 40px rgba(0, 230, 118, 0.7)',
                  },
                }}
              >
                {isLoggedIn ? 'Ir a mis torneos' : 'Comenzar gratis ahora'}
              </Button>
            </Paper>
          </Container>
        </Box>
      </Box>

      <Footer />
    </Box>
  )
}

export default HomePage
