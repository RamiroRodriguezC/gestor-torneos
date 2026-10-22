import { getParticipantId } from './participant.js'

/**
 * Diccionario de unidades de puntuación según el modelo de dominio.
 */
const SCORING_UNIT_LABELS = {
  GOLES: 'Goles',
  POINTS: 'Puntos',
  STROKES: 'Golpes',
  TIME: 'Tiempo',
}

/**
 * Calcula las estadísticas agregadas de un torneo a partir de sus partidos y configuración de deporte.
 * Incluye tanto estadísticas por equipo/participante como estadísticas individuales de jugadores.
 *
 * @param {Object} tournament - Documento o snapshot del torneo
 * @param {Array} allMatches - Lista de partidos del torneo (Dexie / Backend)
 * @param {Object} sportConfig - Configuración del deporte (SportsConfig)
 * @returns {Object} { scorers, discipline, playerScorers, playerDiscipline, summary, scoringUnitLabel, hasDiscipline }
 */
export function computeTournamentStats(tournament, allMatches = [], sportConfig = null) {
  if (!tournament) {
    return {
      scorers: [],
      discipline: [],
      playerScorers: [],
      playerDiscipline: [],
      summary: {
        totalMatches: 0,
        completedMatches: 0,
        totalScores: 0,
        averageScoresPerMatch: 0,
        topScoringMatch: null,
      },
      scoringUnitLabel: 'Puntos',
      hasDiscipline: false,
    }
  }

  const participants = tournament.participantes || []
  const completedMatches = (allMatches || []).filter((m) => m.status === 'FINALIZADO')
  const validEvents = sportConfig?.validEvents || []
  const rawScoringUnit = sportConfig?.sportProps?.scoringUnit || 'POINTS'
  const scoringUnitLabel = SCORING_UNIT_LABELS[rawScoringUnit] || 'Puntos'

  // Mapas auxiliares para rápida resolución de nombres y fotos de participantes (equipos)
  const participantMap = new Map()
  for (const p of participants) {
    const pId = String(getParticipantId(p))
    participantMap.set(pId, {
      participantId: pId,
      displayName: p.displayNameSnapshot || pId,
      logoURL: p.logoURL || '',
    })
  }

  // Estructuras de acumulación por equipo
  const scorersMap = new Map()
  const disciplineMap = new Map()

  // Estructuras de acumulación por jugador individual
  const playerScorersMap = new Map()
  const playerDisciplineMap = new Map()

  // Inicializar contadores por participante existente
  for (const [pId, pData] of participantMap.entries()) {
    const pj = completedMatches.filter((m) =>
      (m.competitors || []).some(
        (c) => String(c.participantId ?? c.teamId) === pId
      )
    ).length

    scorersMap.set(pId, {
      participantId: pId,
      displayName: pData.displayName,
      logoURL: pData.logoURL,
      matchesPlayed: pj,
      totalScore: 0,
      averageScore: 0,
    })

    disciplineMap.set(pId, {
      participantId: pId,
      displayName: pData.displayName,
      logoURL: pData.logoURL,
      yellowCards: 0,
      redCards: 0,
      fouls: 0,
      totalSanctions: 0,
    })
  }

  let totalTournamentScores = 0
  let topScoringMatch = null
  let maxMatchScoreSum = -1

  // Helper para resolver el nombre de un jugador en el partido
  const getPlayerMeta = (match, compId, playerId, eventPlayerName) => {
    if (eventPlayerName) return { name: eventPlayerName, photoURL: '' }
    const comp = (match.competitors || []).find(
      (c) => String(c.participantId ?? c.teamId) === compId
    )
    const member = comp?.lineUp?.find(
      (m) => String(m.userId ?? m._id) === playerId
    )
    return {
      name: member?.fullName || `Jugador (${playerId.slice(-4)})`,
      photoURL: member?.photoURL || '',
    }
  }

  // Recorrer todos los partidos finalizados y sus eventos clave
  for (const match of completedMatches) {
    let matchScoreSum = 0

    for (const event of match.keyEvents || []) {
      const compId = event.competitorId ? String(event.competitorId) : null
      const playerId = event.playerId ? String(event.playerId) : null
      const eventCode = (event.eventType || '').toUpperCase()
      const eventDef = validEvents.find((e) => e.code.toUpperCase() === eventCode)
      const increment = event.incrementScore ?? eventDef?.incrementScore ?? 0
      const teamMeta = compId ? participantMap.get(compId) : null

      // 1. Acumulación de Anotaciones / Goles
      if (increment > 0) {
        totalTournamentScores += increment
        matchScoreSum += increment

        // Acumulación a nivel Equipo
        if (compId && scorersMap.has(compId)) {
          const currentScorer = scorersMap.get(compId)
          currentScorer.totalScore += increment
        }

        // Acumulación a nivel Jugador Individual
        if (playerId) {
          if (!playerScorersMap.has(playerId)) {
            const playerMeta = getPlayerMeta(match, compId, playerId, event.playerName)
            playerScorersMap.set(playerId, {
              playerId,
              displayName: playerMeta.name,
              photoURL: playerMeta.photoURL,
              teamId: compId,
              teamName: teamMeta?.displayName || 'Equipo',
              teamLogoURL: teamMeta?.logoURL || '',
              totalScore: 0,
            })
          }
          playerScorersMap.get(playerId).totalScore += increment
        }
      }

      // 2. Acumulación de Disciplina / Sanciones
      const isYellow = eventCode.includes('AMARILLA')
      const isRed = eventCode.includes('ROJA') || eventCode.includes('EXCLUSION')
      const isFoul = eventCode.includes('FALTA') || eventCode.includes('TECNICA')

      if (isYellow || isRed || isFoul) {
        // Por equipo
        if (compId && disciplineMap.has(compId)) {
          const currentDisc = disciplineMap.get(compId)
          if (isYellow) currentDisc.yellowCards += 1
          if (isRed) currentDisc.redCards += 1
          if (isFoul) currentDisc.fouls += 1
          currentDisc.totalSanctions += 1
        }

        // Por jugador individual
        if (playerId) {
          if (!playerDisciplineMap.has(playerId)) {
            const playerMeta = getPlayerMeta(match, compId, playerId, event.playerName)
            playerDisciplineMap.set(playerId, {
              playerId,
              displayName: playerMeta.name,
              photoURL: playerMeta.photoURL,
              teamId: compId,
              teamName: teamMeta?.displayName || 'Equipo',
              teamLogoURL: teamMeta?.logoURL || '',
              yellowCards: 0,
              redCards: 0,
              fouls: 0,
              totalSanctions: 0,
            })
          }
          const pDisc = playerDisciplineMap.get(playerId)
          if (isYellow) pDisc.yellowCards += 1
          if (isRed) pDisc.redCards += 1
          if (isFoul) pDisc.fouls += 1
          pDisc.totalSanctions += 1
        }
      }
    }

    if (matchScoreSum > maxMatchScoreSum) {
      maxMatchScoreSum = matchScoreSum
      topScoringMatch = {
        matchId: match._id,
        totalScore: matchScoreSum,
        competitors: (match.competitors || []).map((c) => c.displayNameSnapshot).join(' vs '),
      }
    }
  }

  // Calcular promedios para anotadores de equipos
  for (const scorer of scorersMap.values()) {
    scorer.averageScore = scorer.matchesPlayed > 0
      ? Number((scorer.totalScore / scorer.matchesPlayed).toFixed(2))
      : 0
  }

  // Ordenar lista de equipos anotadores
  const sortedScorers = Array.from(scorersMap.values())
    .filter((s) => s.totalScore > 0 || s.matchesPlayed > 0)
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
      if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore
      return a.displayName.localeCompare(b.displayName)
    })

  // Ordenar lista de jugadores goleadores/anotadores
  const sortedPlayerScorers = Array.from(playerScorersMap.values())
    .filter((p) => p.totalScore > 0)
    .sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
      return a.displayName.localeCompare(b.displayName)
    })

  // Ordenar lista de equipos disciplina
  const sortedDiscipline = Array.from(disciplineMap.values())
    .filter((d) => d.totalSanctions > 0)
    .sort((a, b) => {
      if (b.redCards !== a.redCards) return b.redCards - a.redCards
      if (b.yellowCards !== a.yellowCards) return b.yellowCards - a.yellowCards
      return b.fouls - a.fouls
    })

  // Ordenar lista de jugadores disciplina
  const sortedPlayerDiscipline = Array.from(playerDisciplineMap.values())
    .filter((d) => d.totalSanctions > 0)
    .sort((a, b) => {
      if (b.redCards !== a.redCards) return b.redCards - a.redCards
      if (b.yellowCards !== a.yellowCards) return b.yellowCards - a.yellowCards
      return b.fouls - a.fouls
    })

  // Detectar si el deporte configurado tiene soporte para eventos de disciplina
  const hasDisciplineEvents = validEvents.some((e) => {
    const code = e.code.toUpperCase()
    return (
      code.includes('AMARILLA') ||
      code.includes('ROJA') ||
      code.includes('FALTA') ||
      code.includes('TECNICA') ||
      code.includes('EXCLUSION')
    )
  })

  return {
    scorers: sortedScorers,
    discipline: sortedDiscipline,
    playerScorers: sortedPlayerScorers,
    playerDiscipline: sortedPlayerDiscipline,
    summary: {
      totalMatches: (allMatches || []).length,
      completedMatches: completedMatches.length,
      totalScores: totalTournamentScores,
      averageScoresPerMatch: completedMatches.length > 0
        ? Number((totalTournamentScores / completedMatches.length).toFixed(2))
        : 0,
      topScoringMatch: maxMatchScoreSum > 0 ? topScoringMatch : null,
    },
    scoringUnitLabel,
    hasDiscipline: hasDisciplineEvents,
  }
}