import { Container, Typography } from '@mui/material'
import Navbar from '../components/Navbar'

function Config() {
  return (
    <>
      <Navbar />
      <Container>
        <Typography variant="h3" sx={{ mt: 8, textAlign: 'center' }}>
          Mis Configuraciones
        </Typography>
      </Container>
    </>
  )
}

export default Config
