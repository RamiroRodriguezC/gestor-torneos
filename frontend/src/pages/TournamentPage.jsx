import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Typography, Box } from '@mui/material'
import { useAuth } from '../hooks/useAuth'
import { useTournament } from '../hooks/useTournaments'
import TournamentNavbar from '../components/TournamentNavbar'

function TournamentPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const tournament = useTournament(id)
  const [activeSection, setActiveSection] = useState('general')

  if (!user || !tournament) return null

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TournamentNavbar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <Container>
        {activeSection === 'general' && (
          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              Bienvenido al torneo {tournament.title}
            </Typography>
          </Box>
        )}
      </Container>
    </Box>
  )
}

export default TournamentPage
