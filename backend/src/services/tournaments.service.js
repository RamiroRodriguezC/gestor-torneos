import Tournament from '../models/TournamentsModel.js';
import Application from '../models/ApplicationsModel.js';
import { requireDB } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';

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

export const findAll = async () => {
  requireDB();
  return Tournament.find({ isDeleted: false });
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

export const addParticipant = async (id, data) => {
  requireDB();

  if (!data.teamId) throw new AppError(ErrorType.VALIDATION_ERROR, 'teamId del participante es requerido');

  const tournament = await Tournament.findByIdAndUpdate(
    id,
    { $push: { participantes: { teamId: data.teamId, displayNameSnapshot: data.displayNameSnapshot || '' } } },
    { new: true, runValidators: true }
  ).select('participantes');

  if (!tournament) throw new AppError(ErrorType.TOURNAMENT_NOT_FOUND);
  return tournament.participantes;
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

export const findApplications = async (tournamentId) => {
  requireDB();
  return Application.find({ tournamentId, isDeleted: false });
};
