import Navbar from '../components/Navbar'
import HeroBanner from '../components/HeroBanner'
import Footer from '../components/Footer'
import { Box } from '@mui/material'

function HomePage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box sx={{ flexGrow: 1 }}>
        <HeroBanner />
      </Box>
      <Footer />
    </Box>
  )
}

export default HomePage
