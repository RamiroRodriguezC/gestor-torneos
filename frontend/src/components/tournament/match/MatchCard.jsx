import MatchCardVersus from './MatchCardVersus'

const RENDERERS = {
  VERSUS: MatchCardVersus,
  LEADERBOARD: null,
}

function getMatchExecution(match) {
  return match.sportConfigId?.sportProps?.matchExecution || 'VERSUS'
}

function MatchCard({ match, myTeamId, showDate, renderer }) {
  const execution = renderer || getMatchExecution(match)
  const Component = RENDERERS[execution]

  if (!Component) {
    return null
  }

  return <Component match={match} myTeamId={myTeamId} showDate={showDate} />
}

export default MatchCard
