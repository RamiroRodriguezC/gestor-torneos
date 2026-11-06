import mongoose from 'mongoose';
import Tournament from '../models/TournamentsModel.js';
import Match from '../models/MatchesModel.js';
import Field from '../models/FieldModel.js';
import { requireDB } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';

const parseTime = (timeStr) => {
  if (typeof timeStr !== 'string') return null;
  const match = timeStr.trim().match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return { hours, minutes, totalMinutes: hours * 60 + minutes };
};

const addCalendarDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getNextMatchDay = (date, allowedDays) => {
  const current = new Date(date);
  for (let i = 0; i < 7; i++) {
    if (allowedDays.includes(current.getDay())) {
      return current;
    }
    current.setDate(current.getDate() + 1);
  }
  return current;
};

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
 * Asigna a cada partido del fixture una cancha y un horario respetando:
 * - Días permitidos de la semana (matchDays: array de números 0=Dom, 1=Lun, ..., 6=Sáb)
 * - Franja horaria diaria (startTime a endTime) y duración de turno (slotDurationMinutes)
 * - Cantidad de canchas disponibles (partidos simultáneos por turno)
 * - Días mínimos de descanso entre fechas (restDaysBetweenRounds)
 * - Desborde: si una jornada excede la capacidad de un día, continúa en el siguiente día permitido
 *
 * @param {Array} fixture Salida de RoundRobinPairing
 * @param {Object} options
 * @param {Array} options.fields Canchas activas ({ _id, name })
 * @param {Date|string} [options.startDate] Fecha de la primera jornada (default: hoy)
 * @param {Array<number>} [options.matchDays] Días permitidos (0-6)
 * @param {string} [options.startTime] Hora inicial 'HH:mm'
 * @param {string} [options.endTime] Hora final 'HH:mm'
 * @param {number} [options.slotDurationMinutes] Duración de cada turno en minutos
 * @param {number} [options.restDaysBetweenRounds] Días de descanso entre el fin de una fecha y el inicio de la siguiente
 */
export const assignScheduleToFixture = (fixture, {
  fields = [],
  startDate = new Date(),
  matchDays = [6, 0],
  startTime = '14:00',
  endTime = '21:00',
  slotDurationMinutes = 90,
  restDaysBetweenRounds = 6,
} = {}) => {
  if (!fields.length) {
    throw new AppError(
      ErrorType.VALIDATION_ERROR,
      'No hay canchas configuradas o seleccionadas para este torneo. Agregá al menos una cancha desde los ajustes del torneo antes de generar el fixture.'
    );
  }

  const validMatchDays = Array.isArray(matchDays) && matchDays.length
    ? [...new Set(matchDays.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))]
    : [6, 0];

  if (!validMatchDays.length) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'Debe seleccionar al menos un día permitido de juego (ej. Sábado o Domingo).');
  }

  const parsedStart = parseTime(startTime);
  const parsedEnd = parseTime(endTime);

  if (!parsedStart || !parsedEnd) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'Las horas de inicio y fin deben tener formato válido (HH:mm).');
  }

  if (parsedStart.totalMinutes >= parsedEnd.totalMinutes) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'La hora de fin de la franja horaria debe ser posterior a la de inicio.');
  }

  const duration = Number(slotDurationMinutes);
  if (!Number.isFinite(duration) || duration <= 0) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'La duración del turno debe ser un número mayor a 0 minutos.');
  }

  if (parsedEnd.totalMinutes - parsedStart.totalMinutes < duration) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'La franja horaria no permite albergar ningún turno de la duración indicada.');
  }

  // Generar turnos horarios dentro del día
  const slots = [];
  for (let m = parsedStart.totalMinutes; m + duration <= parsedEnd.totalMinutes; m += duration) {
    slots.push({
      hours: Math.floor(m / 60),
      minutes: m % 60,
    });
  }

  const startBase = startDate ? new Date(startDate) : new Date();
  if (isNaN(startBase.getTime())) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'La fecha de inicio indicada no es válida.');
  }
  startBase.setHours(0, 0, 0, 0);

  let currentCalendarDay = getNextMatchDay(startBase, validMatchDays);
  let previousRoundEndDate = null;
  const restDays = Math.max(0, Number(restDaysBetweenRounds) || 0);

  fixture.forEach((round) => {
    if (previousRoundEndDate) {
      const minNextDate = addCalendarDays(previousRoundEndDate, restDays);
      currentCalendarDay = getNextMatchDay(minNextDate, validMatchDays);
    }

    const pendingMatches = [...round.matches];
    let roundStartDate = null;
    let roundEndDate = null;

    while (pendingMatches.length > 0) {
      for (const slot of slots) {
        for (const field of fields) {
          if (pendingMatches.length === 0) break;
          const match = pendingMatches.shift();
          const matchDate = new Date(currentCalendarDay);
          matchDate.setHours(slot.hours, slot.minutes, 0, 0);

          match.field = { fieldId: field._id, name: field.name };
          match.startAt = matchDate;

          if (!roundStartDate || matchDate < roundStartDate) {
            roundStartDate = matchDate;
          }
          if (!roundEndDate || matchDate > roundEndDate) {
            roundEndDate = matchDate;
          }
        }
        if (pendingMatches.length === 0) break;
      }

      if (pendingMatches.length > 0) {
        currentCalendarDay = getNextMatchDay(addCalendarDays(currentCalendarDay, 1), validMatchDays);
      }
    }

    round.startDate = roundStartDate;
    round.endDate = roundEndDate;

    previousRoundEndDate = new Date(roundEndDate);
    previousRoundEndDate.setHours(0, 0, 0, 0);
  });

  return fixture;
};

/**
 * Genera y persiste el fixture de un torneo (formato round robin).
 * Crea las rondas en Tournament.rounds[] y los partidos en la colección Match.
 *
 * @param {string} tournamentId
 * @param {Object} [options]
 * @param {'single'|'double'} [options.rounds] Cantidad de ruedas (default lee del torneo o 'single')
 * @param {Array<number>} [options.matchDays] Días permitidos (0-6)
 * @param {string} [options.startTime] Hora inicial 'HH:mm'
 * @param {string} [options.endTime] Hora final 'HH:mm'
 * @param {number} [options.slotDurationMinutes] Duración de cada turno en minutos
 * @param {number} [options.restDaysBetweenRounds] Días de descanso entre el fin de una fecha y el inicio de la siguiente
 * @param {Array<string>} [options.fieldIds] IDs de canchas a utilizar
 * @param {Date|string} [options.startDate] Fecha de inicio
 * @returns {Promise<{rounds: Array, matches: Array}>}
 */
export const generateFixture = async (tournamentId, options = {}) => {
  requireDB();

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

  // Opciones con fallback a las configuradas en el torneo
  const rounds = options.rounds || tournament.rules?.rounds || 'single';
  if (!['single', 'double'].includes(rounds)) {
    throw new AppError(ErrorType.VALIDATION_ERROR, `rounds debe ser 'single' o 'double'`);
  }

  const scheduleConfig = {
    matchDays: options.matchDays || tournament.scheduleConfig?.matchDays || [6, 0],
    startTime: options.startTime || tournament.scheduleConfig?.startTime || '14:00',
    endTime: options.endTime || tournament.scheduleConfig?.endTime || '21:00',
    slotDurationMinutes: Number(options.slotDurationMinutes || tournament.scheduleConfig?.slotDurationMinutes || 90),
    restDaysBetweenRounds: options.restDaysBetweenRounds !== undefined
      ? Number(options.restDaysBetweenRounds)
      : (tournament.scheduleConfig?.restDaysBetweenRounds ?? 6),
    startDate: options.startDate || tournament.startDate || new Date(),
  };

  // 1) Emparejamientos puros (sin persistir).
  const fixture = RoundRobinPairing(participants, { doubleRound: rounds === 'double' });

  // 2) Canchas: filtrar por fieldIds si se pasaron, o todas las del torneo
  let fieldsQuery = { tournamentId, isDeleted: false };
  if (Array.isArray(options.fieldIds) && options.fieldIds.length > 0) {
    fieldsQuery._id = { $in: options.fieldIds };
  }

  let fields = await Field.find(fieldsQuery).select('_id name');
  if (!fields.length && (!options.fieldIds || !options.fieldIds.length)) {
    // Fallback retrocompatible para torneos viejos con canchas globales
    fields = await Field.find({
      isDeleted: false,
      $or: [{ tournamentId: null }, { tournamentId: { $exists: false } }],
    }).select('_id name');
  }

  if (!fields.length) {
    throw new AppError(ErrorType.VALIDATION_ERROR, 'No hay canchas configuradas o seleccionadas para este torneo. Agregá al menos una cancha desde los ajustes del torneo antes de generar el fixture.');
  }

  assignScheduleToFixture(fixture, {
    fields,
    ...scheduleConfig,
  });

  // 3) IDs estables de ronda generados por adelantado (ADR-008):
  //    Match.round.roundId debe apuntar al _id del subdocumento ronda del torneo.
  const roundIds = fixture.map(() => new mongoose.Types.ObjectId());

  // 4) Crear los partidos en lote.
  const matchDocs = [];
  fixture.forEach((round, roundIndex) => {
    round.matches.forEach((match) => {
      const homeId = match.home?.participantId ?? match.home?.teamId ?? match.home?._id;
      const awayId = match.away?.participantId ?? match.away?.teamId ?? match.away?._id;

      if (!homeId || !awayId) {
        throw new AppError(
          ErrorType.VALIDATION_ERROR,
          'Uno o más participantes no tienen un identificador válido (participantId o teamId).'
        );
      }

      matchDocs.push({
        tournamentId,
        status: 'PROGRAMADO',
        round: { roundId: roundIds[roundIndex], number: round.roundNumber },
        field: match.field,
        sportConfigId: tournament.sportConfigId,
        competitors: [
          {
            participantId: homeId,
            teamId: homeId,
            side: 'HOME',
            displayNameSnapshot: match.home.displayNameSnapshot || '',
            logoURLSnapshot: match.home.logoURLSnapshot || match.home.logoURL || '',
          },
          {
            participantId: awayId,
            teamId: awayId,
            side: 'AWAY',
            displayNameSnapshot: match.away.displayNameSnapshot || '',
            logoURLSnapshot: match.away.logoURLSnapshot || match.away.logoURL || '',
          },
        ],
        startAt: match.startAt,
        isOffline: false,
        result: {},
      });
    });
  });

  // 5) Persistir partidos y rondas atómicamente con Mongoose Session / Transaction
  const session = await mongoose.startSession();
  let createdMatches = [];
  let savedTournament = null;

  const tournamentUpdates = {
    'rules.rounds': rounds,
    'scheduleConfig.matchDays': scheduleConfig.matchDays,
    'scheduleConfig.startTime': scheduleConfig.startTime,
    'scheduleConfig.endTime': scheduleConfig.endTime,
    'scheduleConfig.slotDurationMinutes': scheduleConfig.slotDurationMinutes,
    'scheduleConfig.restDaysBetweenRounds': scheduleConfig.restDaysBetweenRounds,
    'scheduleConfig.fieldIds': fields.map((f) => f._id),
  };

  try {
    await session.withTransaction(async () => {
      createdMatches = await Match.insertMany(matchDocs, { session });

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

      savedTournament = await Tournament.findByIdAndUpdate(
        tournamentId,
        {
          $set: {
            rounds: roundDocs,
            ...tournamentUpdates,
          },
        },
        { new: true, runValidators: true, session }
      );

      if (!savedTournament) {
        throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);
      }
    });
  } catch (error) {
    // Si la base de datos es standalone sin ReplicaSet (común en entornos dev locales),
    // el driver lanza un error indicando que las transacciones requieren Replica Set.
    if (error.message && error.message.includes('replica set')) {
      createdMatches = await Match.insertMany(matchDocs);
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

      try {
        savedTournament = await Tournament.findByIdAndUpdate(
          tournamentId,
          {
            $set: {
              rounds: roundDocs,
              ...tournamentUpdates,
            },
          },
          { new: true, runValidators: true }
        );
      } catch (innerErr) {
        await Match.deleteMany({ _id: { $in: createdMatches.map((m) => m._id) } });
        throw innerErr;
      }

      if (!savedTournament) {
        await Match.deleteMany({ _id: { $in: createdMatches.map((m) => m._id) } });
        throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);
      }
    } else {
      throw error;
    }
  } finally {
    await session.endSession();
  }

  return { rounds: savedTournament.rounds, matches: createdMatches };
};
