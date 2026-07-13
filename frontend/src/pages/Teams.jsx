import { Container, Typography, Stack } from '@mui/material'
import Navbar from '../components/Navbar'
import TeamCard from '../components/TeamCard'
import { useAuth } from '../hooks/useAuth'
import { useTeamsByUser } from '../hooks/useTeams'

function Teams() {
  const { user } = useAuth()
  const teams = useTeamsByUser(user?._id)

  if (!user) return null

  return (
    <>
      <Navbar />
      <Container>
        <Typography variant="h3" sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
          Mis Equipos
        </Typography>
        <Stack spacing={2} useFlexGap>
          {teams.map((team) => (
            <TeamCard key={team._id} team={team} userId={user._id} />
          ))}
          {teams.length === 0 && (
            <Typography variant="body1" color="grey.500" sx={{ textAlign: 'center', mt: 4 }}>
              No tenés equipos aún
            </Typography>
          )}
        </Stack>
      </Container>
    </>
  )
}

export default Teams
