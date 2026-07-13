import { Container, Typography } from '@mui/material'
import Navbar from '../components/Navbar'

function Teams() {
  return (
    <>
      <Navbar />
      <Container>
        <Typography variant="h3" sx={{ mt: 8, textAlign: 'center' }}>
          Mis Equipos
        </Typography>
      </Container>
    </>
  )
}

export default Teams
