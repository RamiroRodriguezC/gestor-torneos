export function getTeamScore(match, teamId) {
  return match.keyEvents
    ?.filter((e) => String(e.competitorId) === String(teamId) && (e.incrementScore || 0) > 0)
    ?.reduce((sum, e) => sum + (e.incrementScore || 0), 0) || 0
}

export function getOpponentScore(match, teamId) {
  const opponentId = match.competitors?.find((c) => String(c.teamId) !== String(teamId))?.teamId
  if (!opponentId) return 0
  return getTeamScore(match, opponentId)
}

export function getCompetitorSide(match, teamId) {
  return match.competitors?.find((c) => String(c.teamId) === String(teamId))?.side || null
}

export const STATUS_STYLE = {
  PROGRAMADO: { label: 'PROG.', color: 'grey.500' },
  EN_CURSO: { label: 'EN VIVO', color: '#00e676' },
  FINALIZADO: { label: 'FINAL', color: '#42a5f5' },
}
