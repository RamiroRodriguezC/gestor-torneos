import Tournament from '../models/TournamentsModel.js';
import Application from '../models/ApplicationsModel.js';
import Match from '../models/MatchesModel.js';
import { requireDB } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';
import { TOURNAMENT_STATUS } from '../constants/enums.js';

const validate = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string') errors.push('title es requerido');
  }
  if (!isUpdate || data.organizerId !== undefined) {
    if (!data.organizerId) errors.push('organizerId es requerido');
  }
  if (!isUpdate || data.sportConfigId !== undefined) {
    if (!data.sportConfigId) errors.push('sportConfigId es requerido');
  }

  return errors;
};

export const findAll = async ({ status } = {}) => {
  requireDB();
  const filter = { isDeleted: false };
  if (status) filter.status = status;
  return Tournament.find(filter);
};

export const findById = async (id) => {
  requireDB();
  return Tournament.findOne({ _id: id, isDeleted: false });
};

export const create = async (data) => {
  requireDB();

  const errors = validate(data);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  return Tournament.create(data);
};

export const update = async (id, data) => {
  requireDB();

  const errors = validate(data, true);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  const tournament = await Tournament.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);
  return tournament;
};

export const findParticipants = async (id) => {
  requireDB();
  const tournament = await Tournament.findById(id).select('participantes');
  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);
  return tournament.participantes;
};

export const addParticipant = async (id, data, { actorId } = {}) => {
  requireDB();

  const participantId = data.participantId || data.teamId; // tolera payload legacy con teamId
  if (!participantId) throw new AppError(ErrorType.VALIDATION_ERROR, 'participantId del participante es requerido');

  const tournament = await Tournament.findOne({ _id: id, isDeleted: false });
  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);

  // Alta directa sin pasar por el flujo de solicitudes: solo el organizador,
  // o una inscripción con Application APROBADA previa (cierra el bypass documentado).
  const isOrganizer = actorId && String(tournament.organizerId) === String(actorId);
  const approvedApp = await Application.findOne({
    tournamentId: id,
    participantId,
    status: 'APROBADA',
    isDeleted: false,
  });
  if (!isOrganizer && !approvedApp) {
    throw new AppError(ErrorType.FORBIDDEN, 'Solo el organizador puede agregar participantes directamente, o debe existir una solicitud aprobada.');
  }

  // Duplicados y cupo.
  const alreadyIn = (tournament.participantes || []).some(
    (p) => String(p.participantId ?? p.teamId) === String(participantId)
  );
  if (alreadyIn) throw new AppError(ErrorType.CONFLICT, 'El participante ya está inscripto en el torneo.');

  if (tournament.maxRegistrations > 0 && (tournament.participantes?.length || 0) >= tournament.maxRegistrations) {
    throw new AppError(ErrorType.CONFLICT, 'El torneo alcanzó su cupo máximo de participantes.');
  }

  const participantType = data.participantType || 'TEAM';
  const updated = await Tournament.findByIdAndUpdate(
    id,
    {
      $push: {
        participantes: {
          participantId,
          participantType,
          displayNameSnapshot: data.displayNameSnapshot || '',
          logoURL: data.logoURL || '',
        },
      },
    },
    { new: true, runValidators: true }
  ).select('participantes');

  return updated.participantes;
};

export const findRounds = async (id) => {
  requireDB();
  const tournament = await Tournament.findById(id).select('rounds');
  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);
  return tournament.rounds;
};

export const addRound = async (id, data) => {
  requireDB();

  if (!data.roundName) throw new AppError(ErrorType.VALIDATION_ERROR, 'roundName es requerido');
  if (data.roundNumber === undefined || data.roundNumber === null) throw new AppError(ErrorType.VALIDATION_ERROR, 'roundNumber es requerido');

  // Verificar que no exista ya una ronda con el mismo roundNumber dentro del torneo
  const existing = await Tournament.findOne({ _id: id, 'rounds.roundNumber': data.roundNumber }).select('_id');
  if (existing) throw new AppError(ErrorType.VALIDATION_ERROR, `Ya existe una ronda con roundNumber ${data.roundNumber} en este torneo`);

  const tournament = await Tournament.findByIdAndUpdate(
    id,
    { $push: { rounds: data } },
    { new: true, runValidators: true }
  ).select('rounds');

  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);
  return tournament.rounds;
};

export const calculateTournamentChampion = (tournament, matches = []) => {
  const participants = tournament.participantes || [];
  if (!participants.length) return null;

  const format = tournament.rules?.format || 'ROUND_ROBIN';

  if (format === 'ROUND_ROBIN') {
    const { winPoints = 3, drawPoints = 1, lossPoints = 0 } = tournament.rules?.scoringSystem || {};
    const completedMatches = matches.filter((m) => m.status === 'FINALIZADO');

    const stats = participants.map((p) => {
      const pId = String(p.participantId ?? p.teamId);
      const pMatches = completedMatches.filter((m) =>
        m.competitors?.some((c) => String(c.participantId ?? c.teamId) === pId)
      );

      let pj = 0, pg = 0, pe = 0, pp = 0, gf = 0, gc = 0;
      for (const m of pMatches) {
        pj++;
        const myScore = m.keyEvents
          ?.filter((e) => String(e.competitorId) === pId && (e.incrementScore || 0) > 0)
          ?.reduce((s, e) => s + (e.incrementScore || 0), 0) || 0;
        const oppScore = m.keyEvents
          ?.filter((e) => String(e.competitorId) !== pId && (e.incrementScore || 0) > 0)
          ?.reduce((s, e) => s + (e.incrementScore || 0), 0) || 0;

        gf += myScore;
        gc += oppScore;
        if (myScore > oppScore) pg++;
        else if (myScore === oppScore) pe++;
        else pp++;
      }

      const pts = pg * winPoints + pe * drawPoints + pp * lossPoints;
      const dg = gf - gc;

      return {
        participantId: p.participantId ?? p.teamId,
        displayNameSnapshot: p.displayNameSnapshot || '',
        logoURL: p.logoURL || '',
        participantType: p.participantType || 'TEAM',
        pts,
        dg,
        gf,
      };
    });

    stats.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.dg !== a.dg) return b.dg - a.dg;
      return b.gf - a.gf;
    });

    if (stats.length > 0) {
      const winner = stats[0];
      return {
        participantId: winner.participantId,
        displayNameSnapshot: winner.displayNameSnapshot,
        logoURL: winner.logoURL,
        participantType: winner.participantType,
        crownedAt: new Date(),
      };
    }
    return null;
  }

  if (format === 'SINGLE_ELIMINATION' || format === 'DOUBLE_ELIMINATION') {
    const rounds = tournament.rounds || [];
    if (!rounds.length) return null;
    const finalRound = [...rounds].sort((a, b) => b.roundNumber - a.roundNumber)[0];
    const finalMatches = matches.filter((m) =>
      (m.round?.roundId && String(m.round.roundId) === String(finalRound._id)) ||
      m.round?.number === finalRound.roundNumber
    );

    if (finalMatches.length > 0) {
      const finalMatch = finalMatches[0];
      const scores = (finalMatch.competitors || []).map((c) => {
        const cId = String(c.participantId ?? c.teamId);
        const score = (finalMatch.keyEvents || [])
          ?.filter((e) => String(e.competitorId) === cId && (e.incrementScore || 0) > 0)
          ?.reduce((s, e) => s + (e.incrementScore || 0), 0) || 0;
        return { competitor: c, score };
      });

      scores.sort((a, b) => b.score - a.score);
      if (scores.length > 0) {
        const winnerComp = scores[0].competitor;
        return {
          participantId: winnerComp.participantId ?? winnerComp.teamId,
          displayNameSnapshot: winnerComp.displayNameSnapshot || '',
          logoURL: winnerComp.logoURLSnapshot || winnerComp.logoURL || '',
          participantType: winnerComp.participantType || 'TEAM',
          crownedAt: new Date(),
        };
      }
    }
  }

  const first = participants[0];
  return {
    participantId: first.participantId ?? first.teamId,
    displayNameSnapshot: first.displayNameSnapshot || '',
    logoURL: first.logoURL || '',
    participantType: first.participantType || 'TEAM',
    crownedAt: new Date(),
  };
};

export const syncTournamentLifecycle = async (tournamentId) => {
  requireDB();

  const tournament = await Tournament.findOne({ _id: tournamentId, isDeleted: false });
  if (!tournament) return null;

  const matches = await Match.find({ tournamentId, isDeleted: false });
  const rounds = tournament.rounds || [];

  if (!rounds.length) return tournament;

  let allRoundsCompleted = true;
  let hasAnyStartedMatch = false;
  let hasAnyCompletedRound = false;

  for (const r of rounds) {
    const roundMatches = matches.filter(
      (m) => (m.round?.roundId && String(m.round.roundId) === String(r._id)) || m.round?.number === r.roundNumber
    );

    if (roundMatches.length === 0) {
      r.status = 'SCHEDULED';
      allRoundsCompleted = false;
    } else {
      const allMatchesFinished = roundMatches.every((m) => m.status === 'FINALIZADO');
      const anyMatchStarted = roundMatches.some((m) => m.status === 'FINALIZADO' || m.status === 'EN_CURSO');

      if (anyMatchStarted) hasAnyStartedMatch = true;

      if (allMatchesFinished) {
        r.status = 'COMPLETED';
        hasAnyCompletedRound = true;
      } else if (anyMatchStarted) {
        r.status = 'IN_PROCESS';
        allRoundsCompleted = false;
      } else {
        r.status = 'SCHEDULED';
        allRoundsCompleted = false;
      }
    }
  }

  if (allRoundsCompleted && matches.length > 0) {
    tournament.status = 'FINALIZADO';
    if (!tournament.champion || !tournament.champion.participantId) {
      tournament.champion = calculateTournamentChampion(tournament, matches);
    }
  } else if (hasAnyStartedMatch || hasAnyCompletedRound) {
    if (tournament.status === 'PUBLICADO' || tournament.status === 'BORRADOR') {
      tournament.status = 'EN_CURSO';
    } else if (tournament.status === 'FINALIZADO') {
      tournament.status = 'EN_CURSO';
      tournament.champion = null;
    }
  }

  await tournament.save();
  return tournament;
};

export const updateStatus = async (id, status, { actorId, champion } = {}) => {
  requireDB();

  if (!TOURNAMENT_STATUS.includes(status)) {
    throw new AppError(ErrorType.VALIDATION_ERROR, `status debe ser uno de: ${TOURNAMENT_STATUS.join(', ')}`);
  }

  const tournament = await Tournament.findOne({ _id: id, isDeleted: false });
  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);

  if (!actorId || String(tournament.organizerId) !== String(actorId)) {
    throw new AppError(ErrorType.FORBIDDEN, 'Solo el organizador del torneo puede cambiar su estado.');
  }

  const updateFields = { status };

  if (status === 'FINALIZADO') {
    const matches = await Match.find({ tournamentId: id, isDeleted: false });
    if (tournament.rounds && tournament.rounds.length > 0) {
      tournament.rounds.forEach((r) => {
        r.status = 'COMPLETED';
      });
      updateFields.rounds = tournament.rounds;
    }
    if (champion && champion.participantId) {
      updateFields.champion = {
        ...champion,
        crownedAt: champion.crownedAt || new Date(),
      };
    } else if (!tournament.champion?.participantId) {
      updateFields.champion = calculateTournamentChampion(tournament, matches);
    }
  } else if (status === 'BORRADOR' || status === 'PUBLICADO') {
    if (tournament.champion) {
      updateFields.champion = null;
    }
  }

  const updated = await Tournament.findByIdAndUpdate(id, updateFields, { new: true, runValidators: true });
  return updated;
};

export const findApplications = async (tournamentId) => {
  requireDB();
  return Application.find({ tournamentId, isDeleted: false });
};
