import { useMemo } from 'react'
import { useMatchesByTournament } from '../../hooks/useMatches'
import StandingsTable from './standings/StandingsTable'
import BracketTree from './standings/BracketTree'
import UnderConstruction from '../UnderConstruction'
import { findMyParticipation } from '../../utils/participant'

function TournamentStandings({ tournament, user }) {
  const allMatches = useMatchesByTournament(tournament._id)
  const format = tournament.rules?.format

  const myTeamId = useMemo(() => findMyParticipation(tournament, user), [user, tournament])

  switch (format) {
    case 'ROUND_ROBIN':
      return <StandingsTable tournament={tournament} matches={allMatches} myTeamId={myTeamId} />

    case 'SINGLE_ELIMINATION':
    case 'DOUBLE_ELIMINATION':
      return <BracketTree tournament={tournament} matches={allMatches} myTeamId={myTeamId} />

    case 'SWISS':
      return <UnderConstruction feature="Sistema Suizo" status="development" size="lg" />

    default:
      return <StandingsTable tournament={tournament} matches={allMatches} myTeamId={myTeamId} />
  }
}

export default TournamentStandings
