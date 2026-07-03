import createError from 'http-errors';
import Match from '../models/MatchesModel.js';
import { requireDB } from '../config/db.js';
import { MATCH_STATUS } from '../constants/enums.js';

const validate = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.tournamentId !== undefined) {
    if (!data.tournamentId) errors.push('tournamentId es requerido');
  }
  if (!isUpdate || data.date !== undefined) {
    if (!data.date || !data.date.dateId || !data.date.number) {
      errors.push('date con dateId y number es requerido');
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
  if (errors.length) throw createError(400, errors.join('; '));

  return Match.create(data);
};

export const update = async (id, data) => {
  requireDB();

  const errors = validate(data, true);
  if (errors.length) throw createError(400, errors.join('; '));

  const match = await Match.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!match) throw createError(404, 'Partido no encontrado');
  return match;
};
