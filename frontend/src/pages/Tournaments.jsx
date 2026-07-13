import { Container, Typography } from '@mui/material'
import Navbar from '../components/Navbar'

function Tournaments() {
  return (
    <>
      <Navbar />
      <Container>
        <Typography variant="h3" sx={{ mt: 8, textAlign: 'center' }}>
          Mis Torneos
        </Typography>
      </Container>
    </>
  )
}

export default Tournaments
