/**
 * Estrategia de emparejamiento para formato ROUND_ROBIN (método del círculo).
 * Recibe los participantes del torneo y devuelve las fechas (jornadas) con sus
 * partidos, sin persistir nada.
 *
 * - N par   -> N-1 fechas, N/2 partidos por fecha.
 * - N impar -> N fechas, (N-1)/2 partidos por fecha y un participante descansa (bye).
 * - doubleRound -> replica la ida invirtiendo local/visitante (ida y vuelta).
 *
 * @param {Array} participants Participantes (equipos o individuales): objetos con participantId (o teamId legacy) / displayNameSnapshot / logoURL
 * @param {Object} options
 * @param {boolean} [options.doubleRound=false]
 * @returns {Array<{roundNumber:number, roundName:string, type:string, status:string, matches:Array<{home:object|null, away:object|null}>}>}
 */
// el = {} evita error si no se pasa options, y permite desestructurar doubleRound con default false
const getParticipantId = (p) => p?.participantId ?? p?.teamId;

export const roundRobinPairing = (participants, { doubleRound = false } = {}) => {
  const list = [...participants];

  if (list.length < 2) return [];

  // Con cantidad impar de participantes se agrega un "bye" (null) para trabajar con lista par.
  if (list.length % 2 !== 0) list.push(null);

  const total = list.length;
  const rounds = [];

  for (let r = 0; r < total - 1; r++) {
    const matches = [];
    for (let i = 0; i < total / 2; i++) {
      const home = list[i];
      const away = list[total - 1 - i];
      // Un partido contra el bye no existe: el participante descansa esa fecha.
      if (home && away) matches.push({ home, away });
    }
    rounds.push(matches);
    // Rotación del círculo: se fija el primero y el último pasa a la segunda posición.
    list.splice(1, 0, list.pop());
  }

  const fixture = rounds.map((matches, index) => ({
    roundNumber: index + 1,
    roundName: `Jornada ${index + 1}`,
    type: 'ROUND_ROBIN',
    status: 'SCHEDULED',
    matches,
  }));

  // Vuelta (ida y vuelta): se replica la ida invirtiendo local/visitante y se anexa con numeración continua.
  if (doubleRound) {
    const returnLeg = fixture.map((round) => ({
      ...round,
      roundNumber: round.roundNumber + fixture.length,
      roundName: `Jornada ${round.roundNumber + fixture.length}`,
      matches: round.matches.map((m) => ({ home: m.away, away: m.home })),
    }));
    fixture.push(...returnLeg);
  }

  return fixture;
};

// El pairer recibe las opciones genéricas de generateFixture ({ rounds }) y las
// traduce a los específicos del formato (rounds: 'double' -> doubleRound).
export default (participants, { rounds = 'single' } = {}) =>
  roundRobinPairing(participants, { doubleRound: rounds === 'double' });
