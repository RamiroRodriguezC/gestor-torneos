import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Box } from '@mui/material'
import { useAuth } from '../hooks/useAuth'
import { useTournament } from '../hooks/useTournaments'
import TournamentNavbar from '../components/layout/TournamentNavbar'
import TournamentGeneral from '../components/tournament/TournamentGeneral'
import TournamentStandings from '../components/tournament/TournamentStandings'
import TournamentParticipants from '../components/tournament/TournamentParticipants'
import TournamentStats from '../components/tournament/TournamentStats'
import TournamentFixture from '../components/tournament/TournamentFixture'

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
          <TournamentGeneral tournament={tournament} user={user} />
        )}
        {activeSection === 'standings' && (
          <TournamentStandings tournament={tournament} />
        )}
        {activeSection === 'teams' && (
          <TournamentParticipants tournament={tournament} />
        )}
        {activeSection === 'stats' && (
          <TournamentStats tournament={tournament} />
        )}
        {activeSection === 'fixture' && (
          <TournamentFixture tournament={tournament} user={user} />
        )}
      </Container>
    </Box>
  )
}

export default TournamentPage
