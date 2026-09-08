// Helpers de lectura tolerante de participantes (ADR-012).
// Los snapshots nuevos de Tournament.participantes[] usan participantId (+ participantType);
// los docs legacy (seeds pre-ADR-012, Match.competitors) siguen usando teamId.
// Cualquier lectura de identidad/nombre de participante debe pasar por acá.
export const getParticipantId = (p) => p?.participantId ?? p?.teamId ?? null

export const getParticipantName = (p) => p?.displayNameSnapshot || ''

// Dado un tournament y el user actual, devuelve el id del participante que lo
// representa (equipo donde es miembro/capitán, o él mismo en individuales) si
// ya forma parte del torneo; si no, null.
export const findMyParticipation = (tournament, user) => {
  if (!tournament || !user) return null
  const participantIds = (tournament.participantes || [])
    .map((p) => getParticipantId(p))
    .filter(Boolean)
    .map((id) => String(id))

  // Si el usuario está inscripto como individuo (deporte INDIVIDUAL).
  if (participantIds.includes(String(user._id))) return String(user._id)

  // Si alguno de sus equipos está inscripto (deporte TEAM).
  const userTeamIds = (user.teams || []).map((t) => String(t.teamId)).filter(Boolean)
  const match = userTeamIds.find((id) => participantIds.includes(id))
  return match || null
}
