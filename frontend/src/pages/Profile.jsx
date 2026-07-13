import { Container, Typography } from '@mui/material'
import Navbar from '../components/Navbar'

function Profile() {
  return (
    <>
      <Navbar />
      <Container>
        <Typography variant="h3" sx={{ mt: 8, textAlign: 'center' }}>
          Mi Perfil
        </Typography>
      </Container>
    </>
  )
}

export default Profile
