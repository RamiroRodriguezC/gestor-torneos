import mongoose from 'mongoose';
import Tournament from '../models/TournamentsModel.js';
import Match from '../models/MatchesModel.js';
import Field from '../models/FieldModel.js';
import { requireDB } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const ROUND_GAP_DAYS = 7;
const DEFAULT_MATCH_HOUR = 15;
const DEFAULT_MATCH_MINUTE = 0;

/**
 * Emparejamiento round robin (método del círculo / circle method).
 * Recibe el arreglo de participantes del torneo y devuelve las fechas (jornadas)
 * con sus partidos, sin persistir nada.
 *
 * - N par   → N-1 fechas, N/2 partidos por fecha.
 * - N impar → N fechas, (N-1)/2 partidos por fecha y un participante descansa (bye).
 * - doubleRound → replica la ida invirtiendo local/visitante (ida y vuelta).
 *
 * @param {Array} participants Participantes del torneo (equipos o individuales): objetos con teamId / displayNameSnapshot / logoURL
 * @param {Object} options
 * @param {boolean} [options.doubleRound=false]
 * @returns {Array<{roundNumber:number, roundName:string, type:string, status:string, matches:Array<{home:object|null, away:object|null}>}>}
 */
// el = {} hace quesi no se pasa opcion, se toma como default un objeto vacío, y luego se desestructura doubleRound con default false
export const RoundRobinPairing = (participants, { doubleRound = false } = {}) => {
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

/**
 * Asigna a cada partido del fixture una cancha (rotando entre las disponibles)
 * y un horario preseteado: una fecha por semana a las 15:00 desde startDate.
 * Modifica el fixture in-place y le agrega startDate/endDate a cada jornada.
 *
 * @param {Array} fixture Salida de RoundRobinPairing
 * @param {Object} options
 * @param {Array} options.fields Canchas activas ({ _id, name })
 * @param {Date} [options.startDate] Fecha de la primera jornada (default: hoy)
 */
export const assignScheduleToFixture = (fixture, { fields = [], startDate = new Date() } = {}) => {
  if (!fields.length) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'No hay canchas cargadas. Creá al menos una en POST /api/fields antes de generar el fixture.');
  }

  const baseDate = new Date(startDate);
  baseDate.setHours(DEFAULT_MATCH_HOUR, DEFAULT_MATCH_MINUTE, 0, 0);

  fixture.forEach((round, roundIndex) => {
    const roundStart = new Date(baseDate.getTime() + roundIndex * ROUND_GAP_DAYS * DAY_MS);
    round.startDate = new Date(roundStart);
    round.endDate = new Date(roundStart);

    round.matches.forEach((match, matchIndex) => {
      const field = fields[matchIndex % fields.length];
      match.field = { fieldId: field._id, name: field.name };
      match.startAt = new Date(roundStart);
    });
  });

  return fixture;
};

/**
 * Genera y persiste el fixture de un torneo (formato round robin).
 * Crea las rondas en Tournament.rounds[] y los partidos en la colección Match.
 *
 * @param {string} tournamentId
 * @param {Object} [options]
 * @param {'single'|'double'} [options.rounds='single'] Cantidad de ruedas
 * @returns {Promise<{rounds: Array, matches: Array}>}
 */
export const generateFixture = async (tournamentId, { rounds = 'single' } = {}) => {
  requireDB();

  if (!['single', 'double'].includes(rounds)) {
    throw new AppError(ErrorType.VALIDATION_ERROR, `rounds debe ser 'single' o 'double'`);
  }

  const tournament = await Tournament.findOne({ _id: tournamentId, isDeleted: false });
  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);

  if (tournament.rules?.format !== 'ROUND_ROBIN') {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'Formato no soportado: solo ROUND_ROBIN por ahora.');
  }

  const alreadyHasRounds = tournament.rounds && tournament.rounds.length > 0;
  const alreadyHasMatches = await Match.exists({ tournamentId, isDeleted: false });
  if (alreadyHasRounds || alreadyHasMatches) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'El torneo ya tiene un fixture generado. Borrá las rondas y partidos existentes para regenerarlo.');
  }

  const participants = tournament.participantes || [];
  if (participants.length < 2) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'Se necesitan al menos 2 participantes para generar el fixture.');
  }

  // 1) Emparejamientos puros (sin persistir).
  const fixture = RoundRobinPairing(participants, { doubleRound: rounds === 'double' });

  // 2) Canchas + horarios preseteado.
  const fields = await Field.find({ isDeleted: false }).select('_id name');
  assignScheduleToFixture(fixture, {
    fields,
    startDate: tournament.startDate || new Date(),
  });

  // 3) IDs estables de ronda generados por adelantado (ADR-008):
  //    Match.round.roundId debe apuntar al _id del subdocumento ronda del torneo.
  const roundIds = fixture.map(() => new mongoose.Types.ObjectId());

  // 4) Crear los partidos en lote.
  const matchDocs = [];
  fixture.forEach((round, roundIndex) => {
    round.matches.forEach((match) => {
      matchDocs.push({
        tournamentId,
        status: 'PROGRAMADO',
        round: { roundId: roundIds[roundIndex], number: round.roundNumber },
        field: match.field,
        sportConfigId: tournament.sportConfigId,
        competitors: [
          { teamId: match.home.teamId, side: 'HOME', displayNameSnapshot: match.home.displayNameSnapshot, logoURLSnapshot: match.home.logoURL },
          { teamId: match.away.teamId, side: 'AWAY', displayNameSnapshot: match.away.displayNameSnapshot, logoURLSnapshot: match.away.logoURL },
        ],
        startAt: match.startAt,
        isOffline: false,
        result: {},
        isDeleted: false,
      });
    });
  });

  const createdMatches = await Match.insertMany(matchDocs);

  // 5) Persistir las rondas en el torneo, referenciando los partidos creados.
  const roundDocs = [];
  let matchCursor = 0;
  fixture.forEach((round, roundIndex) => {
    const matchIds = createdMatches.slice(matchCursor, matchCursor + round.matches.length).map((m) => m._id);
    matchCursor += round.matches.length;
    roundDocs.push({
      _id: roundIds[roundIndex],
      roundName: round.roundName,
      roundNumber: round.roundNumber,
      startDate: round.startDate,
      endDate: round.endDate,
      type: 'ROUND_ROBIN',
      status: 'SCHEDULED',
      matches: matchIds,
    });
  });

  let savedTournament;
  try {
    savedTournament = await Tournament.findByIdAndUpdate(
      tournamentId,
      { $set: { rounds: roundDocs } },
      { new: true, runValidators: true }
    );
  } catch (error) {
    // Rollback manual: si falla la persistencia de las rondas, no quedan partidos huérfanos.
    await Match.deleteMany({ _id: { $in: createdMatches.map((m) => m._id) } });
    throw error;
  }

  if (!savedTournament) {
    await Match.deleteMany({ _id: { $in: createdMatches.map((m) => m._id) } });
    throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);
  }

  return { rounds: savedTournament.rounds, matches: createdMatches };
};
