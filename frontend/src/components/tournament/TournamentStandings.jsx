import { useMemo } from 'react'
import { useMatchesByTournament } from '../../hooks/useMatches'
import StandingsTable from './standings/StandingsTable'
import UnderConstruction from '../UnderConstruction'

function TournamentStandings({ tournament, user }) {
  const allMatches = useMatchesByTournament(tournament._id)
  const format = tournament.rules?.format

  const myTeamId = useMemo(() => {
    const userTeamIds = user?.teams?.map((t) => t.teamId) || []
    const participantIds = tournament.participantes?.map((p) => p.teamId) || []
    return userTeamIds.find((id) => participantIds.some((pid) => String(pid) === String(id)))
  }, [user, tournament])

  switch (format) {
    case 'ROUND_ROBIN':
      return <StandingsTable tournament={tournament} matches={allMatches} myTeamId={myTeamId} />

    case 'SINGLE_ELIMINATION':
    case 'DOUBLE_ELIMINATION':
      return <UnderConstruction feature="Llaves de eliminatoria" status="development" size="lg" />

    case 'SWISS':
      return <UnderConstruction feature="Sistema Suizo" status="development" size="lg" />

    default:
      return <StandingsTable tournament={tournament} matches={allMatches} myTeamId={myTeamId} />
  }
}

export default TournamentStandings
