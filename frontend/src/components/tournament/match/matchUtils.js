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

export const MATCH_STATUS_LABEL = {
  PROGRAMADO: 'Programado',
  EN_CURSO: 'En curso',
  FINALIZADO: 'Finalizado',
}

// Carga el estado de la planilla "cerrada" de un partido a partir de sus keyEvents
// y de la config del deporte. Devuelve:
//   {
//     byEvent: { '<eventType>__<competitorId|global>': count },  → por equipo (targetField COMPETITOR)
//     globalByEvent: { '<eventType>': count },                    → sin equipo (targetField PLAYER)
//   }
// Reconstruye keyEvents con buildKeyEventsFromSheet(sheet, match, sportConfig).
export function buildSheetFromMatch(match, sportConfig) {
  const byEvent = {}
  const globalByEvent = {}

  const competitorEvents = (sportConfig?.validEvents || []).filter(
    (e) => e.targetField === 'COMPETITOR'
  )
  const globalEvents = (sportConfig?.validEvents || []).filter(
    (e) => e.targetField !== 'COMPETITOR'
  )

  // Inicializar contadores en 0 para que el form muestre todos los eventos del deporte
  for (const event of competitorEvents) {
    for (const comp of match.competitors || []) {
      const key = `${event.code}__${comp.teamId}`
      byEvent[key] = 0
    }
  }
  for (const event of globalEvents) {
    globalByEvent[event.code] = 0
  }

  // Poblar contadores desde los keyEvents existentes
  for (const ev of match.keyEvents || []) {
    if (!ev.eventType) continue

    if (ev.competitorId) {
      const key = `${ev.eventType}__${ev.competitorId}`
      if (key in byEvent) byEvent[key] += 1
    } else if (ev.eventType in globalByEvent) {
      globalByEvent[ev.eventType] += 1
    }
  }

  return { byEvent, globalByEvent }
}

// Convierte la planilla (byEvent/globalByEvent) en keyEvents listos para guardar.
// Los eventos que suman score generan un keyEvent por unidad con su incrementScore;
// los que no suman (rojas, amarillas) generan un keyEvent por unidad con incrementScore 0.
export function buildKeyEventsFromSheet(sheet, match, sportConfig) {
  const validEvents = sportConfig?.validEvents || []
  const events = []

  const { byEvent = {}, globalByEvent = {} } = sheet || {}

  for (const event of validEvents) {
    if (event.targetField === 'COMPETITOR') {
      for (const comp of match.competitors || []) {
        const key = `${event.code}__${comp.teamId}`
        const count = byEvent[key] || 0
        for (let i = 0; i < count; i++) {
          events.push({
            eventType: event.code,
            competitorId: comp.teamId,
            incrementScore: event.incrementScore || 0,
          })
        }
      }
    } else {
      const count = globalByEvent[event.code] || 0
      for (let i = 0; i < count; i++) {
        events.push({
          eventType: event.code,
          incrementScore: event.incrementScore || 0,
        })
      }
    }
  }

  return events
}
