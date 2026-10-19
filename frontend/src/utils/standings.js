import { getParticipantId } from './participant.js'

export function computeStandings(tournament, allMatches) {
  const participants = tournament.participantes || []
  const rounds = tournament.rounds || []
  const { winPoints = 3, drawPoints = 1, lossPoints = 0 } = tournament.rules?.scoringSystem || {}

  const rrRoundNumbers = new Set(
    rounds.filter((r) => r.type === 'ROUND_ROBIN').map((r) => r.roundNumber)
  )

  const completedMatches = allMatches.filter(
    (m) => rrRoundNumbers.has(m.round?.number) && m.status === 'FINALIZADO'
  )

  const statsMap = {}

  for (const p of participants) {
    const participantId = getParticipantId(p)
    const participantMatches = completedMatches.filter((m) =>
      m.competitors?.some((c) => String(c.teamId) === String(participantId))
    )

    let pj = 0, pg = 0, pe = 0, pp = 0, gf = 0, gc = 0

    for (const m of participantMatches) {
      pj++
      const myScore = m.keyEvents
        ?.filter((e) => String(e.competitorId) === String(participantId) && (e.incrementScore || 0) > 0)
        ?.reduce((s, e) => s + (e.incrementScore || 0), 0) || 0
      const oppScore = m.keyEvents
        ?.filter((e) => String(e.competitorId) !== String(participantId) && (e.incrementScore || 0) > 0)
        ?.reduce((s, e) => s + (e.incrementScore || 0), 0) || 0

      gf += myScore
      gc += oppScore

      if (myScore > oppScore) pg++
      else if (myScore === oppScore) pe++
      else pp++
    }

    statsMap[participantId] = {
      participantId,
      teamId: participantId, // compat: consumidores viejos leen row.teamId
      displayName: p.displayNameSnapshot || participantId,
      logoURL: p.logoURL || '',
      pj, pg, pe, pp, gf, gc,
      dg: gf - gc,
      pts: pg * winPoints + pe * drawPoints + pp * lossPoints,
    }
  }

  return Object.values(statsMap).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.dg !== a.dg) return b.dg - a.dg
    return b.gf - a.gf
  })
}
