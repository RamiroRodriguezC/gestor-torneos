import Team from '../models/TeamsModel.js';
import User from '../models/UsersModel.js';
import { requireDB } from '../config/db.js';
import { AppError } from '../utils/AppError.js';
import { ErrorType } from '../constants/errorTypes.js';

const validate = (data, isUpdate = false) => {
  const errors = [];

  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string') errors.push('name es requerido');
  }
  if (!isUpdate || data.discipline !== undefined) {
    if (!data.discipline || typeof data.discipline !== 'string') errors.push('discipline es requerido');
  }
  if (!isUpdate || data.capitanId !== undefined) {
    if (!data.capitanId) errors.push('capitanId es requerido');
  }

  return errors;
};

export const findAll = async () => {
  requireDB();
  return Team.find({ isDeleted: false })
    .populate('capitanId', 'name lastName url_profile_photo');
};

export const findById = async (id) => {
  requireDB();
  return Team.findOne({ _id: id, isDeleted: false })
    .populate('capitanId', 'name lastName url_profile_photo');
};

export const create = async (data) => {
  requireDB();

  const errors = validate(data);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  return Team.create(data);
};

export const update = async (id, data) => {
  requireDB();

  const errors = validate(data, true);
  if (errors.length) throw new AppError(ErrorType.VALIDATION_ERROR, errors.join('; '));

  const team = await Team.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!team) throw new AppError(ErrorType.TEAM_NOT_FOUND);
  return team;
};

export const findTeamMembers = async (teamId) => {
  requireDB();
  const team = await Team.findById(teamId).select('members');
  if (!team) throw new AppError(ErrorType.TEAM_NOT_FOUND);
  const ids = team.members.map(m => m.userId);
  if (ids.length === 0) return [];
  return User.find({ _id: { $in: ids }, isDeleted: false }).select('-hashedPassword');
};

export const findTeamTournaments = async (teamId) => {
  requireDB();
  const team = await Team.findById(teamId).select('tournaments');
  if (!team) throw new AppError(ErrorType.TEAM_NOT_FOUND);
  const ids = team.tournaments.map(t => t.tournamentId);
  if (ids.length === 0) return [];
  const Tournament = (await import('../models/TournamentsModel.js')).default;
  return Tournament.find({ _id: { $in: ids }, isDeleted: false });
};
