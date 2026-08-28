import Match from '../models/MatchesModel.js';
import { requireDB } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';
import { MATCH_STATUS } from '../constants/enums.js';

const validate = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.tournamentId !== undefined) {
    if (!data.tournamentId) errors.push('tournamentId es requerido');
  }
  if (!isUpdate || data.round !== undefined) {
    if (!data.round || !data.round.roundId || !data.round.number) {
      errors.push('round con roundId y number es requerido');
    }
  }
  if (!isUpdate || data.field !== undefined) {
    if (!data.field || !data.field.fieldId || !data.field.name) {
      errors.push('field con fieldId y name es requerido');
    }
  }
  if (!isUpdate || data.sportConfigId !== undefined) {
    if (!data.sportConfigId) {
      errors.push('sportConfigId es requerido');
    }
  }
  if (data.status !== undefined && !MATCH_STATUS.includes(data.status)) {
    errors.push(`status debe ser uno de: ${MATCH_STATUS.join(', ')}`);
  }

  return errors;
};

export const findAll = async () => {
  requireDB();
  return Match.find({ isDeleted: false })
    .populate('sportConfigId', 'name sportProps.matchExecution');
};

export const findById = async (id) => {
  requireDB();
  return Match.findOne({ _id: id, isDeleted: false })
    .populate('sportConfigId', 'name sportProps.matchExecution');
};

export const create = async (data) => {
  requireDB();

  const errors = validate(data);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  // Verificar que roundId pertenezca al torneo (PK compuesta lógica tournamentId+roundId — ADR-008 opción 1)
  const Tournament = (await import('../models/TournamentsModel.js')).default;
  const tournament = await Tournament.findOne({ _id: data.tournamentId, 'rounds._id': data.round.roundId }).select('rounds');
  if (!tournament) throw new AppError(ErrorType.VALIDATION_ERROR, 'roundId no pertenece al torneo indicado o torneo inexistente');
  // Sincronizar round.number con el round real para evitar divergencia
  const realRound = tournament.rounds.id(data.round.roundId);
  if (realRound && realRound.roundNumber !== data.round.number) {
    throw new AppError(ErrorType.VALIDATION_ERROR, `round.number (${data.round.number}) no coincide con roundNumber del torneo (${realRound.roundNumber})`);
  }

  return Match.create(data);
};

export const update = async (id, data) => {
  requireDB();

  const errors = validate(data, true);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  // Si se actualiza round, validar pertenencia al torneo
  if (data.round?.roundId || data.tournamentId) {
    const current = await Match.findById(id).select('tournamentId round');
    if (!current) throw new AppError(ErrorType.MATCH_NOT_FOUND);
    const tournamentId = data.tournamentId || current.tournamentId;
    const roundId = data.round?.roundId || current.round?.roundId;
    if (roundId) {
      const Tournament = (await import('../models/TournamentsModel.js')).default;
      const tournament = await Tournament.findOne({ _id: tournamentId, 'rounds._id': roundId }).select('rounds');
      if (!tournament) throw new AppError(ErrorType.VALIDATION_ERROR, 'roundId no pertenece al torneo indicado');
    }
  }

  const match = await Match.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!match) throw new AppError(ErrorType.MATCH_NOT_FOUND);
  return match;
};
