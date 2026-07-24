import { Container, Typography, Stack, Button, Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add'
import Navbar from '../components/layout/Navbar'
import TournamentCard from '../components/tournament/TournamentCard'
import { useAuth } from '../hooks/useAuth'
import { useTournamentsByUser } from '../hooks/useTournaments'

function Tournaments() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const tournaments = useTournamentsByUser(user?._id)

  if (!user) return null

  return (
    <>
      <Navbar />
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 8, mb: 4 }}>
          <Typography variant="h3">
            Mis Torneos
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/dashboard/tournaments/create')}
          >
            Crear Torneo
          </Button>
        </Box>
        <Stack spacing={2} useFlexGap>
          {tournaments.map((t) => (
            <TournamentCard key={t._id} tournament={t} />
          ))}
          {tournaments.length === 0 && (
            <Typography variant="body1" color="grey.500" sx={{ textAlign: 'center', mt: 4 }}>
              No tenés torneos aún
            </Typography>
          )}
        </Stack>
      </Container>
    </>
  )
}

export default Tournaments
