import { Container, Typography, Stack } from '@mui/material'
import Navbar from '../components/Navbar'
import TournamentCard from '../components/TournamentCard'
import { useAuth } from '../hooks/useAuth'
import { useTournamentsByUser } from '../hooks/useTournaments'

function Tournaments() {
  const { user } = useAuth()
  const tournaments = useTournamentsByUser(user?._id)

  if (!user) return null

  return (
    <>
      <Navbar />
      <Container>
        <Typography variant="h3" sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
          Mis Torneos
        </Typography>
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
