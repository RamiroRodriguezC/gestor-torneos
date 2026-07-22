import AuthNavbar from '../components/layout/AuthNavbar'
import HeroBanner from '../components/layout/HeroBanner'
import Footer from '../components/layout/Footer'
import { Box } from '@mui/material'

function HomePage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AuthNavbar />
      <Box sx={{ flexGrow: 1 }}>
        <HeroBanner />
      </Box>
      <Footer />
    </Box>
  )
}

export default HomePage
