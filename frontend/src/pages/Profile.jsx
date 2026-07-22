import { useParams } from 'react-router-dom'
import { Container, Typography, Avatar, Chip, Box, Paper, Grid, Divider, Stack } from '@mui/material'
import Navbar from '../components/layout/Navbar'
import { UsernameTag, SportsTag } from '../components/Tags'
import { useAuth } from '../hooks/useAuth'
import { useSports } from '../hooks/useSportsConfig'
import { useUser } from '../hooks/useUsers'
import ErrorDisplay from '../components/ErrorDisplay'

function Profile() {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const profileUser = useUser(userId)
  const sports = useSports()

  if (userId && profileUser === null) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md">
          <ErrorDisplay message="Cargando perfil..." />
        </Container>
      </>
    )
  }

  if (userId && profileUser === undefined) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md">
          <ErrorDisplay type="USER_NOT_FOUND" />
        </Container>
      </>
    )
  }

  const user = userId ? profileUser : currentUser

  if (!user) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md">
          <ErrorDisplay type="USER_NOT_FOUND" />
        </Container>
      </>
    )
  }

  const sportMap = Object.fromEntries(
    (sports || []).map((s) => [s._id, s.name])
  )

  const userSports = (user.sportsInterests || [])
    .map((id) => sportMap[id])
    .filter(Boolean)

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={0} sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4, flexWrap: 'wrap' }}>
            <Avatar

              src={user?.url_profile_photo || ''}
              sx={{ width: 100, height: 100, bgcolor: 'primary.main', fontSize: 40 }}
            >
              {user?.name?.[0]}{user?.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h4">
                {user?.name} {user?.lastName}
              </Typography>
              <UsernameTag username={user?.username} />
            </Box>
            <Box>
              
            </Box>
          </Box>
          
          <Divider variant="middle" color="primary.main" />

          {userSports.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
                Deportes de interés
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {userSports.map((sport) => (
                  <SportsTag key={sport} sport={sport} />
                ))}
              </Stack>
            </Box>
          )}

        </Paper>
      </Container>
    </>
  )
}

export default Profile
  