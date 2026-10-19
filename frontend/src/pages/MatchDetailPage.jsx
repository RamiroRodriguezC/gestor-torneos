import { useParams } from 'react-router-dom'
import { Container } from '@mui/material'
import Navbar from '../components/layout/Navbar'
import ErrorDisplay from '../components/ErrorDisplay'
import MatchDetail from '../components/tournament/match/MatchDetail'
import { useAuth } from '../hooks/useAuth'
import { useMatch } from '../hooks/useMatches'
import { useTournament } from '../hooks/useTournaments'

function MatchDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const match = useMatch(id)
  const tournament = useTournament(match?.tournamentId)

  if (!user) return null

  if (!match || !tournament) {
    return (
      <>
        <Navbar />
        <Container maxWidth="md">
          <ErrorDisplay type="MATCH_NOT_FOUND" />
        </Container>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ mt: 1 }}>
        <MatchDetail match={match} tournament={tournament} user={user} />
      </Container>
    </>
  )
}

export default MatchDetailPage
