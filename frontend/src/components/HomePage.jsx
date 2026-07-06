import Navbar from './Navbar'
import HeroBanner from './HeroBanner'
import Footer from './Footer'
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
